import math
from flask import Blueprint, request, jsonify
from app.db import db_manager
from app.auth import require_auth

history_bp = Blueprint('history', __name__)

@history_bp.route('/history', methods=['GET'])
@require_auth
def get_history():
    """
    Returns paginated prediction history for current authenticated user.
    Supports query parameter search (?q=keyword), label filtering (?label=fake),
    page (?page=1&limit=10), and sort (?sort=newest|oldest).
    """
    search = request.args.get('q', '').strip() or None
    label_filter = request.args.get('label', '').strip().lower() or None
    sort = request.args.get('sort', 'newest').strip().lower()
    if sort not in ('newest', 'oldest'):
        sort = 'newest'

    try:
        limit = min(int(request.args.get('limit', 10)), 100)
        page = max(int(request.args.get('page', 1)), 1)
        offset = (page - 1) * limit
    except ValueError:
        limit = 10
        page = 1
        offset = 0

    total_count = db_manager.get_user_history_count(
        user_id=request.user['id'],
        search=search,
        label_filter=label_filter
    )

    history = db_manager.get_user_history(
        user_id=request.user['id'],
        search=search,
        label_filter=label_filter,
        sort=sort,
        limit=limit,
        offset=offset
    )

    total_pages = max(1, math.ceil(total_count / limit)) if total_count > 0 else 1

    return jsonify({
        'history': history,
        'count': len(history),
        'total': total_count,
        'page': page,
        'limit': limit,
        'total_pages': total_pages
    }), 200


@history_bp.route('/history/<string:pred_id>', methods=['GET'])
@require_auth
def get_prediction(pred_id):
    """
    Returns specific prediction detail.
    Strictly verifies user ownership to prevent unauthorized data access.
    """
    prediction = db_manager.get_prediction_by_id(pred_id, request.user['id'])
    if not prediction:
        return jsonify({'error': 'Record not found or access denied.'}), 404
    return jsonify({'prediction': prediction}), 200


@history_bp.route('/history/<string:pred_id>', methods=['DELETE'])
@require_auth
def delete_prediction(pred_id):
    """
    Deletes specific prediction record owned by current user.
    """
    success = db_manager.delete_prediction(pred_id, request.user['id'])
    if not success:
        return jsonify({'error': 'Record not found or access denied.'}), 404
    return jsonify({'message': 'Prediction record deleted successfully.'}), 200


@history_bp.route('/history', methods=['DELETE'])
@require_auth
def clear_history():
    """
    Deletes all prediction records belonging to current authenticated user.
    """
    deleted_count = db_manager.clear_user_history(request.user['id'])
    return jsonify({
        'message': f'Successfully cleared {deleted_count} prediction records.',
        'deleted_count': deleted_count
    }), 200


@history_bp.route('/dashboard/stats', methods=['GET'])
@require_auth
def get_dashboard_stats():
    """
    Returns real, calculated analysis metrics and breakdown for authenticated user.
    """
    stats = db_manager.get_user_stats(request.user['id'])
    recent = db_manager.get_user_history(request.user['id'], limit=5)
    stats['recent_analyses'] = recent
    return jsonify({'stats': stats}), 200
