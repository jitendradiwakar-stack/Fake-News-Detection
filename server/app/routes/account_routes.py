import re
from flask import Blueprint, request, jsonify
from app.db import db_manager
from app.auth import require_auth, verify_password, hash_password

account_bp = Blueprint('account', __name__)

EMAIL_REGEX = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
USERNAME_REGEX = r'^[a-zA-Z0-9_]{3,30}$'

@account_bp.route('/account', methods=['GET'])
@require_auth
def get_account():
    """Returns profile and account metadata for current authenticated user"""
    stats = db_manager.get_user_stats(request.user['id'])
    full_user = db_manager.get_user_by_id(request.user['id'])
    user_safe = dict(full_user) if full_user else dict(request.user)
    user_safe.pop('password_hash', None)
    return jsonify({
        'user': user_safe,
        'stats': stats
    }), 200

@account_bp.route('/account', methods=['PATCH'])
@require_auth
def update_account():
    """
    Allows user to update their full name, username, email, or change their password.
    Requires current password verification if changing password.
    """
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip() if 'full_name' in data else None
    username = data.get('username', '').strip() if 'username' in data else None
    email = data.get('email', '').strip() if 'email' in data else None
    current_password = data.get('current_password', '')
    new_password = data.get('new_password', '')

    # Validations
    if full_name is not None:
        if len(full_name) < 2 or len(full_name) > 100:
            return jsonify({'error': 'Full name must be between 2 and 100 characters.'}), 400

    if username is not None:
        if not re.match(USERNAME_REGEX, username):
            return jsonify({'error': 'Username must be 3-30 characters (letters, numbers, underscores only).'}), 400

    if email is not None:
        if not re.match(EMAIL_REGEX, email):
            return jsonify({'error': 'Please provide a valid email address.'}), 400

    new_hash = None
    if new_password:
        if len(new_password) < 8:
            return jsonify({'error': 'New password must be at least 8 characters long.'}), 400

        # Fetch full user to get password hash for verification
        full_user = db_manager.get_user_by_id(request.user['id'])
        if not full_user or not verify_password(full_user['password_hash'], current_password):
            return jsonify({'error': 'Current password incorrect. Cannot change password.'}), 400

        new_hash = hash_password(new_password)

    if full_name is None and username is None and email is None and not new_hash:
        return jsonify({'error': 'No valid profile changes provided.'}), 400

    try:
        db_manager.update_user_profile(
            user_id=request.user['id'],
            full_name=full_name,
            username=username,
            email=email,
            password_hash=new_hash
        )
    except ValueError as ve:
        return jsonify({'error': str(ve)}), 409

    updated_user = db_manager.get_user_by_id(request.user['id'])
    user_safe = dict(updated_user)
    user_safe.pop('password_hash', None)

    return jsonify({
        'message': 'Account updated successfully.',
        'user': user_safe
    }), 200

@account_bp.route('/account/preferences', methods=['POST'])
@require_auth
def update_preferences():
    """
    Updates user topic interests and preferred content language.
    """
    data = request.get_json() or {}
    preferred_language = data.get('preferred_language')
    selected_interests = data.get('selected_interests')

    if preferred_language is not None:
        clean_lang = str(preferred_language).strip().lower()
        if clean_lang not in ('all', 'en', 'hi', 'hinglish'):
            return jsonify({'error': "Preferred language must be 'all', 'en', 'hi', or 'hinglish'."}), 400
        preferred_language = clean_lang

    if selected_interests is not None:
        if not isinstance(selected_interests, list):
            return jsonify({'error': 'Selected interests must be an array of category strings.'}), 400
        selected_interests = [str(item).strip() for item in selected_interests if str(item).strip()]

    db_manager.update_user_preferences(
        user_id=request.user['id'],
        preferred_language=preferred_language,
        selected_interests=selected_interests
    )

    updated_user = db_manager.get_user_by_id(request.user['id'])
    user_safe = dict(updated_user)
    user_safe.pop('password_hash', None)

    return jsonify({
        'message': 'Preferences saved successfully.',
        'user': user_safe
    }), 200

@account_bp.route('/account/onboarding-complete', methods=['POST'])
@require_auth
def complete_onboarding():
    """
    Marks onboarding completed for user. Optionally accepts preferred_language
    and selected_interests in the same request payload.
    """
    data = request.get_json() or {}
    preferred_language = data.get('preferred_language')
    selected_interests = data.get('selected_interests')

    if preferred_language is not None or selected_interests is not None:
        if preferred_language is not None:
            clean_lang = str(preferred_language).strip().lower()
            if clean_lang in ('all', 'en', 'hi', 'hinglish'):
                preferred_language = clean_lang
            else:
                preferred_language = 'all'

        if selected_interests is not None and isinstance(selected_interests, list):
            selected_interests = [str(item).strip() for item in selected_interests if str(item).strip()]
        else:
            selected_interests = []

        db_manager.update_user_preferences(
            user_id=request.user['id'],
            preferred_language=preferred_language,
            selected_interests=selected_interests
        )

    db_manager.set_user_onboarding_status(request.user['id'], completed=True)

    updated_user = db_manager.get_user_by_id(request.user['id'])
    user_safe = dict(updated_user)
    user_safe.pop('password_hash', None)

    return jsonify({
        'message': 'Onboarding marked as completed.',
        'user': user_safe
    }), 200

@account_bp.route('/account/onboarding-reset', methods=['POST'])
@require_auth
def reset_onboarding():
    """
    Resets onboarding status to false so user can replay the welcome tutorial.
    """
    db_manager.set_user_onboarding_status(request.user['id'], completed=False)
    updated_user = db_manager.get_user_by_id(request.user['id'])
    user_safe = dict(updated_user)
    user_safe.pop('password_hash', None)

    return jsonify({
        'message': 'Onboarding reset. Welcome tutorial will appear on next visit.',
        'user': user_safe
    }), 200
