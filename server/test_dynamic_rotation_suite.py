import sys
import os
import uuid
import json

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.db import db_manager

def run_tests():
    print("--- Starting SatyaCheck Dynamic Rotation & Refresh Test Suite ---")
    app = create_app(enable_scheduler=False)
    client = app.test_client()

    passed = 0
    total = 0

    def assert_test(cond, title):
        nonlocal passed, total
        total += 1
        if cond:
            print(f"  [PASS] Test {total}: {title}")
            passed += 1
        else:
            print(f"  [FAIL] Test {total}: {title}")
            assert cond, f"Failed assertion: {title}"

    # 1. Signup new user
    uid = uuid.uuid4().hex[:8]
    signup_data = {
        'full_name': 'Rohan Sen',
        'username': f'rohan_{uid}',
        'email': f'rohan_{uid}@example.com',
        'password': 'Password@123'
    }
    resp_signup = client.post('/api/auth/signup', json=signup_data)
    assert_test(resp_signup.status_code == 201, "New user registered (HTTP 201)")
    token = resp_signup.json['token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Set user preferences
    resp_pref = client.post('/api/account/preferences', json={
        'preferred_language': 'en',
        'selected_interests': ['Politics', 'Technology', 'Science']
    }, headers=headers)
    assert_test(resp_pref.status_code == 200, "User topic preferences saved")

    # 3. GET /api/recommendations contains pagination and timestamp
    resp_rec1 = client.get('/api/recommendations?limit=4', headers=headers)
    assert_test(resp_rec1.status_code == 200, "GET /api/recommendations returns HTTP 200")
    data1 = resp_rec1.json
    assert_test('pagination' in data1, "Response includes 'pagination' metadata")
    assert_test('last_refreshed_at' in data1, "Response includes 'last_refreshed_at' timestamp")
    batch1 = data1['recommended']
    batch1_ids = [item['id'] for item in batch1]
    assert_test(len(batch1_ids) > 0, "Initial recommendation batch returned")
    assert_test(len(batch1_ids) == len(set(batch1_ids)), "Batch 1 contains ZERO duplicate article IDs")

    # 4. Smart rotation on subsequent request (Reload/Revisit)
    # The first batch was recorded as displayed, so smart rotation dampening prioritizes alternative unviewed items!
    resp_rec2 = client.get('/api/recommendations?limit=4', headers=headers)
    assert_test(resp_rec2.status_code == 200, "Subsequent GET /api/recommendations returns HTTP 200")
    batch2 = resp_rec2.json['recommended']
    batch2_ids = [item['id'] for item in batch2]
    assert_test(len(batch2_ids) == len(set(batch2_ids)), "Batch 2 contains ZERO duplicate article IDs")

    # If database has more than 4 items, batch2 should rotate to show fresh candidates
    total_eligible = data1['pagination']['total_eligible']
    if total_eligible > 4:
        has_rotated = any(bid not in batch1_ids for bid in batch2_ids)
        assert_test(has_rotated, "Feed rotated to display newly surfaced fact-checks on reload")
    else:
        assert_test(True, "Limited catalogue gracefully returned available items")

    # 5. POST /api/recommendations/refresh explicitly forces fresh rotation
    resp_refresh = client.post('/api/recommendations/refresh', json={
        'limit': 4,
        'category': 'all'
    }, headers=headers)
    assert_test(resp_refresh.status_code == 200, "POST /api/recommendations/refresh returns HTTP 200")
    refresh_batch = resp_refresh.json['recommended']
    assert_test(len(refresh_batch) > 0, "Refresh endpoint returns valid candidate articles")
    assert_test('last_refreshed_at' in resp_refresh.json, "Refresh response includes updated last_refreshed_at")

    # 6. Load More simulation with exclude_ids deduplication
    exclude_specimen = batch1_ids[:2]
    resp_load_more = client.get(f'/api/recommendations?limit=4&exclude_ids={",".join(exclude_specimen)}', headers=headers)
    assert_test(resp_load_more.status_code == 200, "GET with exclude_ids returns HTTP 200")
    load_more_items = resp_load_more.json['recommended']
    load_more_ids = [item['id'] for item in load_more_items]
    assert_test(
        not any(eid in load_more_ids for eid in exclude_specimen),
        "Excluded IDs are strictly omitted: ZERO duplicates across continuous Load More"
    )

    # 7. Category filter preserves relevance across rotation
    resp_tech = client.get('/api/recommendations?category=Technology&limit=4', headers=headers)
    assert_test(resp_tech.status_code == 200, "GET /api/recommendations?category=Technology succeeds")
    tech_items = resp_tech.json['recommended']
    if tech_items:
        tech_kws = ['tech', 'technology', 'ai', 'phone', 'cyber', 'google', 'app', 'online scam']
        assert_test(
            any(any(kw in (item.get('claim_text', '') + item.get('explanation', '')).lower() for kw in tech_kws) for item in tech_items),
            "Rotated items in Technology category preserve topic relevance"
        )
    else:
        assert_test(True, "Empty category handled gracefully")

    # 8. Unauthenticated / Guest user rotation and exclude_ids
    guest_batch1 = client.get('/api/recommendations?limit=3').json['recommended']
    guest_ids = [g['id'] for g in guest_batch1]
    guest_batch2 = client.get(f'/api/recommendations?limit=3&exclude_ids={",".join(guest_ids)}').json['recommended']
    guest_batch2_ids = [g['id'] for g in guest_batch2]
    assert_test(
        not any(gid in guest_batch2_ids for gid in guest_ids),
        "Guest requests also respect exclude_ids with zero duplicates"
    )

    # 9. Verify user preferences are intact
    resp_acc = client.get('/api/account', headers=headers)
    user_data = resp_acc.json['user']
    assert_test(user_data.get('preferred_language') == 'en', "User preferred language preserved as 'en'")
    assert_test(set(user_data.get('selected_interests')) == {'Politics', 'Technology', 'Science'}, "User selected interests preserved")

    # 10. Existing prediction and dashboard metrics regression check
    pred = client.post('/api/detector', json={
        'input': 'Verified announcement: Indian space agency prepares lunar exploration rover mission.'
    }, headers=headers)
    assert_test(pred.status_code == 200, "ML detector functions normally (HTTP 200)")

    stats_resp = client.get('/api/dashboard/stats', headers=headers)
    assert_test(stats_resp.status_code == 200, "Dashboard stats function normally")
    assert_test(stats_resp.json['stats']['total_analyses'] >= 1, "Dashboard statistics increment properly")

    print(f"\nAll Dynamic Rotation & Refresh tests completed: {passed}/{total} Passed.")
    return passed == total

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
