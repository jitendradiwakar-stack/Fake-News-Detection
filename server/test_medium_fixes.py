import pytest
import uuid
from unittest.mock import patch, MagicMock
from app.db import db_manager
from app.services.credibility_service import CredibilityCheckService
from app import create_app

def test_sqlite_exclude_ids_exceeding_1500_ids():
    """
    Tests that passing 1500+ excluded IDs does not throw SQLite variable limit error
    due to NOT IN (SELECT value FROM json_each(?)) optimization.
    """
    # Generate 1600 unique synthetic UUIDs
    massive_exclude_ids = [f"claim_{uuid.uuid4().hex}" for _ in range(1600)]
    
    # Query fact checks with 1600 excluded IDs
    results = db_manager.get_fact_checks(exclude_ids=massive_exclude_ids, limit=10)
    
    assert isinstance(results, list)
    # Ensure none of the returned IDs are in the excluded set
    for item in results:
        assert item['id'] not in massive_exclude_ids


def test_credibility_service_network_failure_fallback():
    """
    Simulates a network timeout or DNS failure in DuckDuckGo search.
    Verifies that the service falls back gracefully within milliseconds without crashing.
    """
    with patch('app.services.credibility_service.DDGS') as mock_ddgs:
        instance = mock_ddgs.return_value.__enter__.return_value
        instance.text.side_effect = TimeoutError("Connection to search provider timed out")
        
        result = CredibilityCheckService.check_credibility("Breaking claim for testing network fallback")
        
        assert result['is_credible'] is False
        assert result['total_found'] == 0
        assert result['network_fallback'] is True
        assert 'temporarily unavailable' in result['error']


def test_detector_api_with_credibility_network_failure():
    """
    Verifies that /api/detector returns 200 with ML prediction even if credibility search fails.
    """
    app = create_app(enable_scheduler=False)
    app.config['TESTING'] = True
    client = app.test_client()

    with patch('app.services.credibility_service.DDGS') as mock_ddgs:
        instance = mock_ddgs.return_value.__enter__.return_value
        instance.text.side_effect = ConnectionError("DNS resolution failed")

        resp = client.post('/api/detector', json={'input': 'Government issues new guidelines for citizen safety'})
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'prediction' in data
        assert 'classification' in data
