import pytest
from unittest.mock import patch, MagicMock
from app import create_app
from app.routes.detector import is_safe_ip, validate_and_resolve_url, fetch_url_html

@pytest.fixture
def client():
    app = create_app(enable_scheduler=False)
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


def test_is_safe_ip():
    # Private / Loopback / Link-Local / Reserved must all be rejected
    assert not is_safe_ip("127.0.0.1")
    assert not is_safe_ip("::1")
    assert not is_safe_ip("10.0.0.1")
    assert not is_safe_ip("192.168.1.1")
    assert not is_safe_ip("172.16.0.1")
    assert not is_safe_ip("169.254.169.254")
    assert not is_safe_ip("0.0.0.0")
    assert not is_safe_ip("invalid_ip")

    # Public IPs must be accepted
    assert is_safe_ip("8.8.8.8")
    assert is_safe_ip("1.1.1.1")
    assert is_safe_ip("93.184.216.34")


def test_ssrf_detector_blocks_private_ips(client):
    forbidden_urls = [
        "http://127.0.0.1:5000/api/auth/me",
        "http://localhost:8080/",
        "http://169.254.169.254/latest/meta-data/",
        "http://10.0.0.5/admin",
        "http://192.168.1.1/",
        "http://172.16.0.10:8000/",
    ]

    for url in forbidden_urls:
        resp = client.post('/api/detector', json={'input': url})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == "Invalid or disallowed URL"


def test_ssrf_detector_rejects_non_html(client):
    with patch('app.routes.detector.validate_and_resolve_url') as mock_val, \
         patch('requests.Session.get') as mock_get:
        
        mock_val.return_value = (MagicMock(), None)
        
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_resp.headers = {'Content-Type': 'application/json'}
        mock_get.return_value = mock_resp

        resp = client.post('/api/detector', json={'input': 'https://example.com/api/data.json'})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == "Invalid or disallowed URL"


def test_ssrf_detector_rejects_payload_exceeding_2mb(client):
    with patch('app.routes.detector.validate_and_resolve_url') as mock_val, \
         patch('requests.Session.get') as mock_get:
        
        mock_val.return_value = (MagicMock(), None)
        
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_resp.headers = {'Content-Type': 'text/html'}
        # Simulate >2MB stream (3MB of dummy bytes)
        mock_resp.iter_content.return_value = [b"A" * 1024 * 1024 for _ in range(3)]
        mock_get.return_value = mock_resp

        resp = client.post('/api/detector', json={'input': 'https://example.com/huge-page.html'})
        assert resp.status_code == 400
        assert resp.get_json()['error'] == "Invalid or disallowed URL"


def test_ssrf_detector_allows_legitimate_html(client):
    with patch('app.routes.detector.validate_and_resolve_url') as mock_val, \
         patch('requests.Session.get') as mock_get:
        
        mock_val.return_value = (MagicMock(), None)
        
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.is_redirect = False
        mock_resp.headers = {'Content-Type': 'text/html; charset=utf-8'}
        mock_resp.encoding = 'utf-8'
        mock_resp.iter_content.return_value = [b"<html><head><title>Breaking: Verified Science Discovery</title></head><body>Content</body></html>"]
        mock_get.return_value = mock_resp

        resp = client.post('/api/detector', json={'input': 'https://example.com/science-article.html'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'prediction' in data
        assert 'classification' in data
