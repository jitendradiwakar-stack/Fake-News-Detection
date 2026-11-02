from flask import Blueprint, request, jsonify
from app.auth import get_optional_auth_user, require_auth
from app.db import db_manager
from app.services.recommendation_service import RecommendationService

recommendation_bp = Blueprint('recommendations', __name__)

@recommendation_bp.route('/recommendations', methods=['GET'])
def get_recommendations():
    """
    Returns personalized recommended fact-check news claims, trending records,
    available category counts, educational misinformation tips, and user preferences.
    Supports dynamic rotation, pagination (limit, offset), and exclude_ids deduplication.
    """
    user = get_optional_auth_user()
    category = request.args.get('category')
    language = request.args.get('language')
    limit = request.args.get('limit', 6, type=int)
    offset = request.args.get('offset', 0, type=int)
    cursor_val = request.args.get('cursor')
    if cursor_val and cursor_val.isdigit() and offset == 0:
        offset = int(cursor_val)
    refresh_param = request.args.get('refresh', '').lower() in ('true', '1', 'yes')
    seed = request.args.get('seed')

    # Parse exclude_ids (comma-separated or multiple query parameters)
    exclude_ids = []
    raw_exclude = request.args.get('exclude_ids')
    if raw_exclude:
        exclude_ids = [item.strip() for item in raw_exclude.split(',') if item.strip()]

    data = RecommendationService.get_recommendations(
        user=user,
        category_filter=category,
        language_filter=language,
        exclude_ids=exclude_ids,
        limit=min(max(limit, 1), 30),
        offset=max(offset, 0),
        is_refresh=refresh_param,
        session_seed=seed
    )

    return jsonify(data), 200


@recommendation_bp.route('/recommendations/refresh', methods=['POST'])
def refresh_recommendations():
    """
    Explicitly triggers a fresh recommendation rotation.
    Applies rotation dampening to previously seen articles, ensuring alternative
    relevant fact-checks are surfaced whenever available.
    """
    user = get_optional_auth_user()
    payload = request.get_json() or {}

    category = payload.get('category')
    language = payload.get('language')
    limit = int(payload.get('limit', 6))
    exclude_ids = payload.get('exclude_ids', [])
    seed = payload.get('seed')

    if isinstance(exclude_ids, str):
        exclude_ids = [item.strip() for item in exclude_ids.split(',') if item.strip()]
    elif not isinstance(exclude_ids, list):
        exclude_ids = []

    data = RecommendationService.get_recommendations(
        user=user,
        category_filter=category,
        language_filter=language,
        exclude_ids=exclude_ids,
        limit=min(max(limit, 1), 30),
        offset=0,
        is_refresh=True,
        session_seed=seed
    )

    return jsonify(data), 200


@recommendation_bp.route('/recommendations/interact', methods=['POST'])
@require_auth
def record_interaction():
    """
    Records a user interaction with a fact-check article:
    'viewed' - user opened or expanded detail
    'saved' - user bookmarked article to their reading list
    'dismissed' - user hid this article (will not be recommended again)
    """
    data = request.get_json() or {}
    article_id = data.get('article_id', '').strip()
    interaction_type = data.get('interaction_type', '').strip().lower()

    if not article_id:
        return jsonify({'error': 'article_id is required.'}), 400

    if interaction_type not in ('viewed', 'saved', 'dismissed', 'displayed'):
        return jsonify({'error': "interaction_type must be 'viewed', 'saved', 'dismissed', or 'displayed'."}), 400

    try:
        db_manager.record_user_interaction(
            user_id=request.user['id'],
            article_id=article_id,
            interaction_type=interaction_type
        )
        return jsonify({
            'message': f'Interaction {interaction_type} recorded.',
            'article_id': article_id,
            'interaction_type': interaction_type
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
