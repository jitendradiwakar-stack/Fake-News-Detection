import pytest
from app import create_app
from app.limiter import limiter

@pytest.fixture
def client():
    # Set up test app with rate limiting enabled
    app = create_app(enable_scheduler=False)
    app.config['TESTING'] = True
    app.config['RATELIMIT_ENABLED'] = True
    # Reset storage to start fresh
    limiter.reset()
    with app.test_client() as client:
        yield client
    limiter.reset()


def test_detector_rate_limiting(client):
    limiter.reset()
    # 15 allowed per minute
    for i in range(15):
        resp = client.post('/api/detector', json={'input': f'Headline check test number {i}'})
        assert resp.status_code in (200, 400), f"Request {i+1} failed with {resp.status_code}"
    
    # 16th request must exceed rate limit
    blocked_resp = client.post('/api/detector', json={'input': 'Excess request'})
    assert blocked_resp.status_code == 429
    data = blocked_resp.get_json()
    assert data['error'] == 'Too Many Requests'
    assert 'Rate limit exceeded' in data['message']


def test_auth_login_rate_limiting(client):
    limiter.reset()
    # 5 allowed per minute
    for i in range(5):
        resp = client.post('/api/auth/login', json={'identifier': f'user{i}', 'password': 'wrongpassword'})
        assert resp.status_code == 401
    
    # 6th request must trigger rate limit 429
    blocked_resp = client.post('/api/auth/login', json={'identifier': 'user6', 'password': 'wrongpassword'})
    assert blocked_resp.status_code == 429
    data = blocked_resp.get_json()
    assert data['error'] == 'Too Many Requests'
    assert 'Rate limit exceeded' in data['message']


def test_auth_signup_rate_limiting(client):
    limiter.reset()
    # 5 allowed per minute
    for i in range(5):
        resp = client.post('/api/auth/signup', json={
            'full_name': f'Test User {i}',
            'username': f'testuser_{i}',
            'email': f'test_{i}@example.com',
            'password': 'Short',
            'confirm_password': 'Short'
        })
        assert resp.status_code == 400
    
    # 6th request must trigger 429
    blocked_resp = client.post('/api/auth/signup', json={
        'full_name': 'Test User Blocked',
        'username': 'testuser_blocked',
        'email': 'blocked@example.com',
        'password': 'Short',
        'confirm_password': 'Short'
    })
    assert blocked_resp.status_code == 429
    data = blocked_resp.get_json()
    assert data['error'] == 'Too Many Requests'
    assert 'Rate limit exceeded' in data['message']
