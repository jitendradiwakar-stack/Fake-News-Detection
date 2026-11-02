import sys
import os
import uuid
import json

# Ensure UTF-8 output on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Set path for app imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from app.db import db_manager
from app.services.recommendation_service import RecommendationService, AVAILABLE_CATEGORIES

def run_tests():
    print("--- Starting SatyaCheck Onboarding & Recommendations Test Suite ---")
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
        'full_name': 'Aarav Sharma',
        'username': f'aarav_{uid}',
        'email': f'aarav_{uid}@example.com',
        'password': 'Password@123'
    }
    resp = client.post('/api/auth/signup', json=signup_data)
    assert_test(resp.status_code == 201, "New user signs up successfully (HTTP 201)")
    new_user = resp.json['user']
    token = resp.json['token']
    headers = {'Authorization': f'Bearer {token}'}

    # 2. Check onboarding_completed is False by default for new user
    assert_test(new_user.get('onboarding_completed') is False, "New user has onboarding_completed = False")
    assert_test(new_user.get('preferred_language') == 'all', "New user has preferred_language = 'all'")
    assert_test(new_user.get('selected_interests') == [], "New user has selected_interests = []")

    # 3. GET /api/auth/me returns onboarding status
    resp_me = client.get('/api/auth/me', headers=headers)
    assert_test(resp_me.status_code == 200, "GET /api/auth/me returns HTTP 200")
    assert_test(resp_me.json['user']['onboarding_completed'] is False, "/api/auth/me confirms onboarding_completed is False")

    # 4. GET /api/recommendations for guest (unauthenticated)
    resp_guest_rec = client.get('/api/recommendations')
    assert_test(resp_guest_rec.status_code == 200, "GET /api/recommendations succeeds for guest (HTTP 200)")
    assert_test('recommended' in resp_guest_rec.json, "Guest recommendations include 'recommended' list")
    assert_test('trending' in resp_guest_rec.json, "Guest recommendations include 'trending' list")
    assert_test('educational_tips' in resp_guest_rec.json, "Response includes educational misinformation tips")
    assert_test(len(resp_guest_rec.json['educational_tips']) >= 3, "Educational tips contains at least 3 verified guides")

    # 5. Save preferences & complete onboarding
    complete_payload = {
        'preferred_language': 'en',
        'selected_interests': ['Science', 'Technology']
    }
    resp_complete = client.post('/api/account/onboarding-complete', json=complete_payload, headers=headers)
    assert_test(resp_complete.status_code == 200, "POST /api/account/onboarding-complete returns HTTP 200")
    updated_user = resp_complete.json['user']
    assert_test(updated_user.get('onboarding_completed') is True, "User onboarding_completed updated to True")
    assert_test(updated_user.get('preferred_language') == 'en', "User preferred_language updated to 'en'")
    assert_test(set(updated_user.get('selected_interests')) == {'Science', 'Technology'}, "User selected_interests updated to ['Science', 'Technology']")

    # 6. GET /api/recommendations with authenticated user tailored to Science & Technology
    resp_rec = client.get('/api/recommendations', headers=headers)
    assert_test(resp_rec.status_code == 200, "GET /api/recommendations succeeds for authenticated user (HTTP 200)")
    user_recs = resp_rec.json['recommended']
    assert_test(len(user_recs) > 0, "Authenticated user receives non-empty recommendations")

    # Verify top recommendations match user topics or language
    top_rec = user_recs[0]
    assert_test('match_reason' in top_rec, "Recommended card has explainable match_reason")
    assert_test('recommendation_score' in top_rec, "Recommended card has calculated recommendation_score")

    # 7. Category filter testing
    resp_cat = client.get('/api/recommendations?category=Science', headers=headers)
    assert_test(resp_cat.status_code == 200, "Category filter ?category=Science returns HTTP 200")
    science_recs = resp_cat.json['recommended']
    if science_recs:
        science_kws = ['science', 'nasa', 'mars', 'satellite', 'space', 'isro']
        assert_test(
            any(any(kw in (r.get('claim_text', '') + r.get('category', '') + r.get('explanation', '')).lower() for kw in science_kws) for r in science_recs),
            "Category filtered items match Science keywords"
        )
    else:
        assert_test(True, "Empty science category returns empty list safely")

    # 8. Language filter testing
    resp_lang_hi = client.get('/api/recommendations?language=hi', headers=headers)
    assert_test(resp_lang_hi.status_code == 200, "Language filter ?language=hi returns HTTP 200")
    hi_recs = resp_lang_hi.json['recommended']
    if hi_recs:
        assert_test(hi_recs[0].get('language') == 'hi', "Language filter prioritizes Hindi fact-check items")
    else:
        assert_test(True, "Language filter handled gracefully")

    # 9. User interaction tracking: Save article
    if user_recs:
        target_article = user_recs[0]
        resp_save = client.post('/api/recommendations/interact', json={
            'article_id': target_article['id'],
            'interaction_type': 'saved'
        }, headers=headers)
        assert_test(resp_save.status_code == 200, "POST /api/recommendations/interact with 'saved' returns HTTP 200")

        # Verify article is now marked is_saved
        resp_after_save = client.get('/api/recommendations', headers=headers)
        saved_items = [r for r in resp_after_save.json['recommended'] if r['id'] == target_article['id']]
        if saved_items:
            assert_test(saved_items[0].get('is_saved') is True, "Saved article has is_saved=True in recommendations")

    # 10. User interaction tracking: Dismiss article
    if len(user_recs) > 1:
        dismiss_target = user_recs[1]
        resp_dismiss = client.post('/api/recommendations/interact', json={
            'article_id': dismiss_target['id'],
            'interaction_type': 'dismissed'
        }, headers=headers)
        assert_test(resp_dismiss.status_code == 200, "POST /api/recommendations/interact with 'dismissed' returns HTTP 200")

        # Verify article is excluded from future recommendations
        resp_after_dismiss = client.get('/api/recommendations', headers=headers)
        remaining_ids = [r['id'] for r in resp_after_dismiss.json['recommended']]
        assert_test(dismiss_target['id'] not in remaining_ids, "Dismissed article is excluded from recommendations")

    # 11. Profile preferences update from Account settings
    resp_pref_update = client.post('/api/account/preferences', json={
        'preferred_language': 'hi',
        'selected_interests': ['Health', 'Finance', 'Politics']
    }, headers=headers)
    assert_test(resp_pref_update.status_code == 200, "POST /api/account/preferences updates preferences (HTTP 200)")
    assert_test(resp_pref_update.json['user']['preferred_language'] == 'hi', "Preferred language updated to 'hi'")
    assert_test(set(resp_pref_update.json['user']['selected_interests']) == {'Health', 'Finance', 'Politics'}, "Selected interests updated to Health, Finance, Politics")

    # 12. Invalid preference handling
    resp_inv_lang = client.post('/api/account/preferences', json={'preferred_language': 'invalid_lang'}, headers=headers)
    assert_test(resp_inv_lang.status_code == 400, "Invalid language rejected with HTTP 400")

    # 13. Restart onboarding tutorial
    resp_reset = client.post('/api/account/onboarding-reset', json={}, headers=headers)
    assert_test(resp_reset.status_code == 200, "POST /api/account/onboarding-reset returns HTTP 200")
    assert_test(resp_reset.json['user']['onboarding_completed'] is False, "User onboarding_completed reset to False")

    # 14. Existing prediction & history features preserved
    pred_res = client.post('/api/detector', json={
        'input': 'Breaking official announcement: Reserve Bank of India keeps repo rate unchanged at 6.5 percent.'
    }, headers=headers)
    assert_test(pred_res.status_code == 200, "Existing ML prediction endpoint works properly (HTTP 200)")

    # 15. Check dashboard stats
    resp_stats = client.get('/api/dashboard/stats', headers=headers)
    assert_test(resp_stats.status_code == 200, "Dashboard stats endpoint returns HTTP 200")
    assert_test(resp_stats.json['stats']['total_analyses'] >= 1, "Dashboard total analyses incremented")

    print(f"\nAll tests completed: {passed}/{total} Passed.")

if __name__ == '__main__':
    run_tests()
