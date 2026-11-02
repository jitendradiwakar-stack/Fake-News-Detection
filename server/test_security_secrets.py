import os
import pytest
from app import create_app
from app.auth import get_jwt_secret, create_jwt_token, decode_jwt_token

def test_dev_mode_generates_random_secrets_without_crash(monkeypatch):
    monkeypatch.delenv('SECRET_KEY', raising=False)
    monkeypatch.delenv('JWT_SECRET_KEY', raising=False)
    monkeypatch.setenv('FLASK_ENV', 'development')

    app = create_app(enable_scheduler=False)
    assert app.config['SECRET_KEY'] is not None
    assert len(app.config['SECRET_KEY']) >= 32

    # JWT generation should work cleanly with dev generated secret
    user_payload = {'id': 'user-dev-123', 'email': 'dev@example.com', 'username': 'devuser'}
    token = create_jwt_token(user_payload)
    decoded = decode_jwt_token(token)
    assert decoded['sub'] == 'user-dev-123'


def test_production_mode_raises_error_when_flask_secret_missing(monkeypatch):
    monkeypatch.delenv('SECRET_KEY', raising=False)
    monkeypatch.setenv('FLASK_ENV', 'production')

    with pytest.raises(RuntimeError) as exc_info:
        create_app(enable_scheduler=False)
    assert "CRITICAL SECURITY ERROR: SECRET_KEY" in str(exc_info.value)


def test_production_mode_raises_error_when_jwt_secret_missing(monkeypatch):
    monkeypatch.delenv('JWT_SECRET_KEY', raising=False)
    monkeypatch.setenv('FLASK_ENV', 'production')

    with pytest.raises(RuntimeError) as exc_info:
        get_jwt_secret()
    assert "CRITICAL SECURITY ERROR: JWT_SECRET_KEY" in str(exc_info.value)
