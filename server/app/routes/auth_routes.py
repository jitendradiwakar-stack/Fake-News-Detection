from flask import Blueprint, request, jsonify, make_response
from app.db import db_manager
from app.auth import (
    hash_password,
    verify_password,
    create_jwt_token,
    require_auth,
    EMAIL_REGEX,
    USERNAME_REGEX
)
from app.limiter import limiter

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
@limiter.limit("5 per minute")
def signup():
    """
    Registers a new user with full_name, username, email, and password.
    Enforces validation, duplicate checks, and password hashing.
    """
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    username = data.get('username', '').strip().lower()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    confirm_password = data.get('confirm_password', '')

    # Validation
    if not full_name:
        return jsonify({'error': 'Full name is required.'}), 400

    if not username or not USERNAME_REGEX.match(username):
        return jsonify({
            'error': 'Username must be 3-30 characters and contain only letters, numbers, underscores, or hyphens.'
        }), 400

    if not email or not EMAIL_REGEX.match(email):
        return jsonify({'error': 'Please provide a valid email address.'}), 400

    if not password or len(password) < 8:
        return jsonify({'error': 'Password must be at least 8 characters long.'}), 400

    if confirm_password and password != confirm_password:
        return jsonify({'error': 'Passwords do not match.'}), 400

    # Duplicate checks
    if db_manager.get_user_by_email(email):
        return jsonify({'error': 'An account with this email address already exists.'}), 409

    if db_manager.get_user_by_username(username):
        return jsonify({'error': 'This username is already taken. Please choose another.'}), 409

    try:
        pw_hash = hash_password(password)
        user = db_manager.create_user(full_name, username, email, pw_hash)
        token = create_jwt_token(user)

        user_safe = dict(user)
        user_safe.pop('password_hash', None)

        response = make_response(jsonify({
            'message': 'Account created successfully!',
            'user': user_safe,
            'token': token
        }), 201)

        # Set secure HttpOnly cookie
        response.set_cookie(
            'satyacheck_token',
            token,
            max_age=7 * 24 * 3600,
            httponly=True,
            samesite='Lax',
            secure=False  # Set True in HTTPS production
        )
        return response

    except Exception as e:
        return jsonify({'error': f'Failed to create account: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
@limiter.limit("5 per minute")
def login():
    """
    Authenticates user via email or username + password.
    Returns generic error to prevent user enumeration.
    """
    data = request.get_json() or {}
    identifier = data.get('identifier', '').strip().lower()
    password = data.get('password', '')

    if not identifier or not password:
        return jsonify({'error': 'Email/Username and password are required.'}), 400

    # Look up user by email first, then username
    user = db_manager.get_user_by_email(identifier)
    if not user:
        user = db_manager.get_user_by_username(identifier)

    # Generic error message to prevent user enumeration
    if not user or not verify_password(user['password_hash'], password):
        return jsonify({'error': 'Invalid credentials. Please verify your email/username and password.'}), 401

    try:
        db_manager.update_user_last_login(user['id'])
        token = create_jwt_token(user)

        user_safe = dict(user)
        user_safe.pop('password_hash', None)

        response = make_response(jsonify({
            'message': 'Login successful!',
            'user': user_safe,
            'token': token
        }), 200)

        # Set secure HttpOnly cookie
        response.set_cookie(
            'satyacheck_token',
            token,
            max_age=7 * 24 * 3600,
            httponly=True,
            samesite='Lax',
            secure=False
        )
        return response

    except Exception as e:
        return jsonify({'error': f'Login failed: {str(e)}'}), 500


@auth_bp.route('/logout', methods=['POST'])
def logout():
    """Invalidates client authentication cookie"""
    response = make_response(jsonify({'message': 'Logged out successfully.'}), 200)
    response.delete_cookie('satyacheck_token')
    return response


@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_me():
    """Returns currently authenticated user profile"""
    return jsonify({'user': request.user}), 200
