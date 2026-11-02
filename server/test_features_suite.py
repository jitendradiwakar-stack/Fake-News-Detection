"""
SatyaCheck Comprehensive Feature & Security Verification Suite
Tests:
- Authentication & Session security
- Personal Dashboard statistics & recent activity
- Profile settings editing (Full name, username, email, password)
- Full prediction history with pagination, search, label filtering, sorting
- Data isolation between different users
- Prediction persistence & cleanup
"""

import sys
import uuid
from app import create_app
from app.db import db_manager

def run_tests():
    app = create_app()
    client = app.test_client()
    passed = 0
    total = 0

    def assert_test(cond, title):
        nonlocal passed, total
        total += 1
        if cond:
            passed += 1
            print(f"  [PASS] Test {total}: {title}")
        else:
            print(f"  [FAIL] Test {total}: {title}")
            assert cond, f"Failed on: {title}"

    print("\n--- Starting SatyaCheck Feature Test Suite ---")

    # Generate test users
    uid1 = uuid.uuid4().hex[:6]
    uid2 = uuid.uuid4().hex[:6]
    user1_email = f"analyst_{uid1}@example.com"
    user1_user = f"analyst_{uid1}"
    user2_email = f"lead_{uid2}@example.com"
    user2_user = f"lead_{uid2}"

    # 1. Signup User 1
    resp1 = client.post('/api/auth/signup', json={
        'full_name': 'Test Analyst One',
        'username': user1_user,
        'email': user1_email,
        'password': 'SecurePassword123!',
        'confirm_password': 'SecurePassword123!'
    })
    assert_test(resp1.status_code == 201, "User 1 registration succeeds")
    token1 = resp1.get_json()['token']
    auth_headers1 = {'Authorization': f'Bearer {token1}'}

    # 2. Test scenario 1: New user sees zero analyses in dashboard stats
    stats_resp = client.get('/api/dashboard/stats', headers=auth_headers1)
    stats = stats_resp.get_json()['stats']
    assert_test(stats['total_analyses'] == 0 and stats['recent_activity'] is None, "New user has 0 analyses and null recent activity")

    # 3. Test scenario 14: Unauthenticated access to protected endpoints is rejected
    unauth_client = app.test_client()
    unauth_resp = unauth_client.get('/api/history')
    assert_test(unauth_resp.status_code == 401, "Unauthenticated /api/history returns 401")
    unauth_acc = unauth_client.get('/api/account')
    assert_test(unauth_acc.status_code == 401, "Unauthenticated /api/account returns 401")

    # 4. Test scenario 2 & 3: Run prediction with auth header; record is saved and stats update
    pred1 = client.post('/api/detector', headers=auth_headers1, json={
        'input': 'Breaking news: WHO confirms global vaccine milestone achieved.'
    })
    assert_test(pred1.status_code == 200, "ML prediction executes successfully for authenticated user")

    stats_resp2 = client.get('/api/dashboard/stats', headers=auth_headers1)
    stats2 = stats_resp2.get_json()['stats']
    assert_test(stats2['total_analyses'] == 1, "Dashboard total analyses count increments to 1")
    assert_test(stats2['recent_activity'] is not None, "Recent activity timestamp is populated")

    # 5. Add two more predictions with known labels
    client.post('/api/detector', headers=auth_headers1, json={
        'input': 'Secret WhatsApp forward: 2000 rupee notes containing GPS chips to be reissued tomorrow.'
    })
    client.post('/api/detector', headers=auth_headers1, json={
        'input': 'Official government press release: Finance ministry announces new inflation targeting framework.'
    })

    # 6. Test scenario 5 & 6: Search, filters, pagination, and sorting
    hist_resp = client.get('/api/history?page=1&limit=2&sort=newest', headers=auth_headers1)
    hist_data = hist_resp.get_json()
    assert_test(hist_data['total'] == 3, "Total predictions count in history equals 3")
    assert_test(len(hist_data['history']) == 2, "Pagination limit=2 returns exactly 2 records")
    assert_test(hist_data['total_pages'] == 2, "Total pages calculated correctly as 2")

    # Test search
    search_resp = client.get('/api/history?q=WhatsApp', headers=auth_headers1)
    assert_test(search_resp.get_json()['total'] == 1, "Search keyword filtering returns matching record")

    # Test label filter
    label_resp = client.get('/api/history?label=fake', headers=auth_headers1)
    assert_test(label_resp.status_code == 200, "Label filtering query succeeds")

    # 7. Test scenario 15: Data isolation between User 1 and User 2
    resp2 = client.post('/api/auth/signup', json={
        'full_name': 'Test Lead Two',
        'username': user2_user,
        'email': user2_email,
        'password': 'SecurePassword456!',
        'confirm_password': 'SecurePassword456!'
    })
    token2 = resp2.get_json()['token']
    auth_headers2 = {'Authorization': f'Bearer {token2}'}

    # User 2 should see 0 records
    u2_hist = client.get('/api/history', headers=auth_headers2).get_json()
    assert_test(u2_hist['total'] == 0, "User 2 cannot see User 1's records (0 total)")

    # User 2 tries to access User 1's record by ID
    u1_record_id = hist_data['history'][0]['id']
    forbidden_get = client.get(f'/api/history/{u1_record_id}', headers=auth_headers2)
    assert_test(forbidden_get.status_code == 404, "User 2 cannot GET User 1's prediction by ID (404/access denied)")

    # User 2 tries to delete User 1's record
    forbidden_del = client.delete(f'/api/history/{u1_record_id}', headers=auth_headers2)
    assert_test(forbidden_del.status_code == 404, "User 2 cannot DELETE User 1's prediction (404/access denied)")

    # 8. Test scenario 10, 11: Profile loading and updating
    acc_resp = client.get('/api/account', headers=auth_headers1)
    acc_data = acc_resp.get_json()
    assert_test(acc_data['user']['email'] == user1_email, "Profile retrieves authenticated user email")

    # Update Full Name and Username
    new_username = f"analyst_pro_{uid1}"
    patch_resp = client.patch('/api/account', headers=auth_headers1, json={
        'full_name': 'Senior Analyst One',
        'username': new_username
    })
    assert_test(patch_resp.status_code == 200, "Profile name and username update successfully")
    assert_test(patch_resp.get_json()['user']['username'] == new_username, "Updated username reflects in response")

    # Test scenario 12: Duplicate username or email rejection
    dup_resp = client.patch('/api/account', headers=auth_headers1, json={
        'username': user2_user  # already taken by user 2
    })
    assert_test(dup_resp.status_code == 409, "Duplicate username update rejected with 409 Conflict")

    # 9. Test password change
    pwd_patch = client.patch('/api/account', headers=auth_headers1, json={
        'current_password': 'SecurePassword123!',
        'new_password': 'UpdatedPassword789!'
    })
    assert_test(pwd_patch.status_code == 200, "Password change succeeds with valid current password")

    # Wrong current password
    bad_pwd_patch = client.patch('/api/account', headers=auth_headers1, json={
        'current_password': 'WrongPassword999!',
        'new_password': 'AnotherPassword123!'
    })
    assert_test(bad_pwd_patch.status_code == 400, "Password change rejected with incorrect current password")

    # 10. Test scenario 7, 8, 9: Individual deletion and Clear All
    del_resp = client.delete(f'/api/history/{u1_record_id}', headers=auth_headers1)
    assert_test(del_resp.status_code == 200, "Individual record deletion succeeds")

    stats_after_del = client.get('/api/dashboard/stats', headers=auth_headers1).get_json()['stats']
    assert_test(stats_after_del['total_analyses'] == 2, "Dashboard statistics reflect deleted record (count drops to 2)")

    # Clear all history for User 1
    clear_resp = client.delete('/api/history', headers=auth_headers1)
    assert_test(clear_resp.status_code == 200, "Clear all history succeeds")
    stats_after_clear = client.get('/api/dashboard/stats', headers=auth_headers1).get_json()['stats']
    assert_test(stats_after_clear['total_analyses'] == 0, "Dashboard statistics reflect clear all (count drops to 0)")

    # 11. Test Live Disinformation Alerts Endpoint
    alerts_resp = client.get('/api/alerts')
    assert_test(alerts_resp.status_code == 200, "Live Disinformation Alerts endpoint returns 200")
    alerts_data = alerts_resp.get_json()
    assert_test('alerts' in alerts_data and len(alerts_data['alerts']) > 0, "Alerts endpoint returns active alerts list")
    assert_test(alerts_data['alerts'][0].get('severity') in ['CRITICAL', 'HIGH', 'WARNING', 'ADVISORY'], "Alert severity correctly formatted")

    # 12. Test Forensic Feedback Submission
    feedback_resp = client.post('/api/feedback', json={
        'category': 'contest_verdict',
        'claim_text': 'NASA discovers liquid water ocean on Mars',
        'feedback_text': 'Radar evidence indicates frozen subsurface ice per peer review.',
        'evidence_url': 'https://science.nasa.gov',
        'rating': 'Verified True'
    })
    assert_test(feedback_resp.status_code == 201, "Forensic feedback submission returns 201 Created")
    feedback_data = feedback_resp.get_json()
    assert_test(feedback_data.get('success') is True and 'feedback_id' in feedback_data, "Feedback response includes success flag and ID")

    # 13. Test Forensic Feedback Validation (empty submission rejected)
    empty_feedback_resp = client.post('/api/feedback', json={})
    assert_test(empty_feedback_resp.status_code == 400, "Empty feedback submission rejected with 400")

    print(f"\nAll tests completed: {passed}/{total} Passed.")
    return passed == total

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
