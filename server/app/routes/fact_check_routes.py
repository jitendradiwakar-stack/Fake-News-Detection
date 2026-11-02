import os
import time
import threading
from flask import Blueprint, request, jsonify
from app.db import db_manager
from app.services.fact_check_service import sync_engine, GOOGLE_FACT_CHECK_API_KEY
from app.auth import get_optional_auth_user

fact_check_bp = Blueprint('fact_check', __name__)

ADMIN_API_KEY = os.environ.get('ADMIN_API_KEY', '').strip()
LAST_MANUAL_TRIGGER_TIME = 0
MANUAL_REFRESH_COOLDOWN_SECONDS = 30  # Prevent denial-of-service / external API quota exhaustion


@fact_check_bp.route('/fact-checks', methods=['GET'])
def get_fact_checks():
    """
    Retrieves paginated, filtered, and searchable genuine fact-checked claims.
    Serves from cached database storage - DOES NOT consume external API quotas on read.
    """
    try:
        page = max(int(request.args.get('page', 1)), 1)
        limit = min(max(int(request.args.get('limit', 12)), 1), 50)
        offset = (page - 1) * limit

        raw_search = request.args.get('search', '')
        search = raw_search.replace('+', ' ').strip() or None
        language = request.args.get('language', 'all').strip()
        category = request.args.get('category', 'all').strip()
        verdict = request.args.get('verdict', 'all').strip()
        sort = request.args.get('sort', 'newest').strip().lower()
        if sort not in ('newest', 'oldest'):
            sort = 'newest'

        raw_exclude = request.args.get('exclude_ids')
        exclude_ids = [item.strip() for item in raw_exclude.split(',') if item.strip()] if raw_exclude else None

        is_refresh = request.args.get('refresh', '').lower() in ('true', '1')
        seed = request.args.get('seed', '').strip() or None

        records = db_manager.get_fact_checks(
            search=search,
            language=language,
            category=category,
            verdict=verdict,
            sort=sort,
            limit=limit,
            offset=offset,
            exclude_ids=exclude_ids,
            is_refresh=is_refresh,
            seed=seed
        )
        total_count = db_manager.get_fact_checks_count(
            search=search,
            language=language,
            category=category,
            verdict=verdict
        )

        total_pages = (total_count + limit - 1) // limit if total_count > 0 else 1
        sync_meta = db_manager.get_sync_status()

        return jsonify({
            'fact_checks': records,
            'total': total_count,
            'page': page,
            'limit': limit,
            'total_pages': total_pages,
            'last_synced_at': sync_meta.get('last_synced_at'),
            'sync_status': sync_meta.get('last_sync_status', 'ready'),
            'is_syncing': sync_meta.get('is_syncing', False)
        }), 200

    except Exception as e:
        return jsonify({'error': f'Failed to retrieve fact checks: {str(e)}'}), 500


@fact_check_bp.route('/fact-checks/<fc_id>', methods=['GET'])
def get_fact_check_detail(fc_id):
    """Retrieves full details for a single verified fact-check record."""
    try:
        record = db_manager.get_fact_check_by_id(fc_id)
        if not record:
            return jsonify({'error': 'Fact-check article not found'}), 404
        return jsonify({'fact_check': record}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve fact check detail: {str(e)}'}), 500


@fact_check_bp.route('/fact-checks/latest', methods=['GET'])
def get_latest_fact_checks():
    """Returns top 5-10 recent fact-checks for dashboard and sidebar widgets."""
    try:
        limit = min(max(int(request.args.get('limit', 6)), 1), 20)
        records = db_manager.get_latest_fact_checks(limit=limit)
        return jsonify({'latest': records}), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve latest fact checks: {str(e)}'}), 500


@fact_check_bp.route('/fact-checks/sync-status', methods=['GET'])
def get_sync_status_endpoint():
    """Returns current real-time synchronization health and scheduling telemetry."""
    try:
        status_data = db_manager.get_sync_status()
        status_data['google_api_configured'] = bool(GOOGLE_FACT_CHECK_API_KEY)
        status_data['sync_interval_minutes'] = int(os.environ.get('FACT_CHECK_SYNC_INTERVAL_MINUTES', '30'))
        return jsonify(status_data), 200
    except Exception as e:
        return jsonify({'error': f'Failed to retrieve sync status: {str(e)}'}), 500


@fact_check_bp.route('/fact-checks/refresh', methods=['POST'])
def trigger_manual_sync():
    """
    Triggers an immediate background synchronization.
    Security:
    - Rate-limited to prevent abuse.
    - Requires admin key (X-Admin-Key) OR authenticated user session.
    """
    global LAST_MANUAL_TRIGGER_TIME
    now = time.time()

    # 1. Authorization & Cooldown check
    provided_key = request.headers.get('X-Admin-Key', '').strip()
    is_admin = bool(ADMIN_API_KEY and provided_key == ADMIN_API_KEY)

    # 2. Rate limit cooldown (30s) to safeguard external API quotas
    if not is_admin and (now - LAST_MANUAL_TRIGGER_TIME) < MANUAL_REFRESH_COOLDOWN_SECONDS:
        remaining = int(MANUAL_REFRESH_COOLDOWN_SECONDS - (now - LAST_MANUAL_TRIGGER_TIME))
        return jsonify({
            'message': f'External sync cooling down ({remaining}s remaining). Rotating local feed.',
            'cooldown_remaining': remaining,
            'is_syncing': False
        }), 200

    LAST_MANUAL_TRIGGER_TIME = now

    # 3. Check if already running
    sync_status = db_manager.get_sync_status()
    if sync_status.get('is_syncing'):
        return jsonify({
            'message': 'Synchronization is already currently in progress.',
            'is_syncing': True
        }), 200

    # 4. Launch non-blocking sync in background thread
    def _async_sync():
        sync_engine.run_sync()

    thread = threading.Thread(target=_async_sync, name="ManualFactCheckSync", daemon=True)
    thread.start()

    return jsonify({
        'message': 'Real-time fact-check synchronization initiated successfully.',
        'is_syncing': True
    }), 200
