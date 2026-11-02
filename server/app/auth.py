import os
import re
import secrets
import logging
from datetime import datetime, timedelta, timezone
from functools import wraps
from typing import Optional, Dict, Any
import jwt
from flask import request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from app.db import db_manager

logger = logging.getLogger(__name__)

_CACHED_DEV_JWT_SECRET = None

def get_jwt_secret() -> str:
    """
    Returns configured JWT secret key.
    In production (FLASK_ENV/ENV=production), raises RuntimeError if key is missing.
    In development, generates a secure random 32-byte ephemeral key with warning.
    """
    global _CACHED_DEV_JWT_SECRET
    key = os.environ.get('JWT_SECRET_KEY')
    if key:
        return key

    is_prod = (os.environ.get('FLASK_ENV') == 'production' or 
               os.environ.get('ENV') == 'production' or 
               os.environ.get('ENVIRONMENT') == 'production')
    if is_prod:
        raise RuntimeError("CRITICAL SECURITY ERROR: JWT_SECRET_KEY environment variable is mandatory in production!")

    if not _CACHED_DEV_JWT_SECRET:
        _CACHED_DEV_JWT_SECRET = secrets.token_hex(32)
        logger.warning("SECURITY WARNING: JWT_SECRET_KEY not set in environment. Generated random ephemeral key for development.")

    return _CACHED_DEV_JWT_SECRET

JWT_SECRET_KEY = get_jwt_secret()
JWT_ALGORITHM = 'HS256'
TOKEN_EXPIRATION_DAYS = 7

EMAIL_REGEX = re.compile(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$')
USERNAME_REGEX = re.compile(r'^[a-zA-Z0-9_-]{3,30}$')

def hash_password(password: str) -> str:
    """Hash password using PBKDF2:SHA256 with salt"""
    return generate_password_hash(password, method='pbkdf2:sha256')

def verify_password(stored_hash: str, password: str) -> bool:
    """Verify password against stored hash"""
    return check_password_hash(stored_hash, password)

def create_jwt_token(user: Dict[str, Any]) -> str:
    """Generate signed JWT token containing user identity and 7-day expiration"""
    now = datetime.now(timezone.utc)
    payload = {
        'sub': user['id'],
        'email': user['email'],
        'username': user['username'],
        'iat': now,
        'exp': now + timedelta(days=TOKEN_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, get_jwt_secret(), algorithm=JWT_ALGORITHM)

def decode_jwt_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate JWT token signature and expiration"""
    try:
        payload = jwt.decode(token, get_jwt_secret(), algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None

def extract_token_from_request() -> Optional[str]:
    """
    Extract token from Authorization: Bearer <token>
    or HttpOnly cookie 'satyacheck_token'
    """
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        return auth_header[7:].strip()
    return request.cookies.get('satyacheck_token')

def get_optional_auth_user() -> Optional[Dict[str, Any]]:
    """Returns authenticated user if valid token exists, or None for guest requests"""
    token = extract_token_from_request()
    if not token:
        return None
    payload = decode_jwt_token(token)
    if not payload:
        return None
    user = db_manager.get_user_by_id(payload['sub'])
    if user:
        user_safe = dict(user)
        user_safe.pop('password_hash', None)
        return user_safe
    return None

def require_auth(f):
    """Decorator to protect endpoints requiring valid authentication"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = extract_token_from_request()
        if not token:
            return jsonify({'error': 'Authentication required. Please log in.'}), 401

        payload = decode_jwt_token(token)
        if not payload:
            return jsonify({'error': 'Session expired or invalid. Please log in again.'}), 401

        user = db_manager.get_user_by_id(payload['sub'])
        if not user:
            return jsonify({'error': 'User account not found.'}), 401

        user_safe = dict(user)
        user_safe.pop('password_hash', None)
        request.user = user_safe
        return f(*args, **kwargs)
    return decorated
