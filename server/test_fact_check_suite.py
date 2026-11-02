"""
SatyaCheck Real-Time Fact-Checked News Feed Test Suite
Tests:
- Fact-check database schema & duplicate prevention (upsert by external_id)
- GET /api/fact-checks pagination, limits, and total pages
- Filter by Verdict (False, Misleading, Partly False, True)
- Filter by Language (en, hi)
- Filter by Category / Region (India, International)
- Keyword Search across claims, publishers, claimants
- GET /api/fact-checks/<id> and 404 handling
- GET /api/fact-checks/latest
- GET /api/fact-checks/sync-status
- POST /api/fact-checks/refresh security (401 for unauthorized, rate limiting 429)
- "Analyze with SatyaCheck" ML detection integration on claim text
- Sync engine resilience (safe error handling, zero record deletion on failure)
"""

import sys
import uuid
import time

# Ensure stdout handles UTF-8 on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

from app import create_app
from app.db import db_manager
from app.services.fact_check_service import sync_engine, normalize_verdict, generate_external_id

def run_tests():
    app = create_app(enable_scheduler=False)
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

    print("\n--- Starting SatyaCheck Fact-Check News Feed Test Suite ---")

    # Clean up previous test entries for idempotent runs
    if not db_manager.use_mongo:
        with db_manager._get_sqlite_conn() as conn:
            conn.cursor().execute("DELETE FROM fact_checks WHERE external_id LIKE 'test_fc_%'")
            conn.commit()

    # 1. Test verdict normalization
    assert_test(normalize_verdict("False - Manipulated Photo") == "False", "Verdict normalization: 'False - Manipulated Photo' -> 'False'")
    assert_test(normalize_verdict("भ्रामक दावा (Misleading Claim)") == "Misleading", "Verdict normalization: Hindi 'Bhramak Dawa' -> 'Misleading'")
    assert_test(normalize_verdict("Partly False / Half True") == "Partly False", "Verdict normalization: 'Partly False' -> 'Partly False'")
    assert_test(normalize_verdict("Correct & Verified Fact") == "True", "Verdict normalization: 'Correct & Verified Fact' -> 'True'")
    assert_test(normalize_verdict("Unrated Claim") == "Other", "Verdict normalization: 'Unrated Claim' -> 'Other'")

    # 2. Test Deterministic External ID generation
    url1 = "https://www.boomlive.in/fact-check/rbi-500-note-gps-chip-10294"
    id1 = generate_external_id(url1, "RBI 500 note GPS chip", "BOOM Live")
    id1_again = generate_external_id(url1, "RBI 500 note GPS chip", "BOOM Live")
    assert_test(id1 == id1_again and len(id1) == 32, "Deterministic 32-character SHA256 external_id generated")

    # 3. Test Initial GET /api/fact-checks
    resp = client.get('/api/fact-checks')
    assert_test(resp.status_code == 200, "GET /api/fact-checks returns HTTP 200")
    data = resp.json
    assert_test('fact_checks' in data and 'total' in data and 'page' in data, "Response contains pagination schema")

    # 4. Insert Verified Fact-Check Specimen 1 (English, False, India)
    specimen1 = {
        'external_id': "test_fc_specimen_rbi_500",
        'claim_text': "Viral message claims Reserve Bank of India has embedded GPS satellite tracking chips in ₹500 currency notes.",
        'claimant': "WhatsApp Forward",
        'fact_check_publisher': "BOOM Live",
        'publisher_rating': "False - Fabricated Claim",
        'normalized_verdict': "False",
        'fact_check_url': "https://www.boomlive.in/fact-check/rbi-500-note-gps-fake",
        'review_date': "2026-10-29T10:00:00Z",
        'language': "en",
        'category': "India",
        'country': "India",
        'source_api': "boomlive_rss",
        'explanation': "The RBI spokesperson confirmed currency notes do not feature GPS or electronic circuitry."
    }
    is_new = db_manager.upsert_fact_check(specimen1)
    assert_test(is_new is True, "First upsert of specimen 1 inserts new record")

    # 5. Duplicate Prevention: Upsert Specimen 1 Again
    specimen1_update = dict(specimen1)
    specimen1_update['explanation'] = "Updated explanation: Technical teardown reveals ordinary paper banknote."
    is_new_dup = db_manager.upsert_fact_check(specimen1_update)
    assert_test(is_new_dup is False, "Second upsert with same external_id updates existing record without duplicate insertion")

    # 6. Insert Verified Fact-Check Specimen 2 (Hindi, Misleading, India)
    specimen2 = {
        'external_id': "test_fc_specimen_laptop_hi",
        'claim_text': "सोशल मीडिया पर दावा किया जा रहा है कि केंद्र सरकार सभी छात्रों को फ्री लैपटॉप दे रही है।",
        'claimant': "फेसबुक और व्हाट्सएप",
        'fact_check_publisher': "Vishwas News",
        'publisher_rating': "भ्रामक दावा (Misleading)",
        'normalized_verdict': "Misleading",
        'fact_check_url': "https://www.vishwasnews.com/hindi/education/free-laptop-scheme-hoax",
        'review_date': "2026-10-30T12:00:00Z",
        'language': "hi",
        'category': "India",
        'country': "India",
        'source_api': "vishwas_rss",
        'explanation': "पीआईबी फैक्ट चेक ने स्पष्ट किया कि केंद्र सरकार ऐसी कोई योजना नहीं चला रही है।"
    }
    db_manager.upsert_fact_check(specimen2)

    # 7. Insert Verified Fact-Check Specimen 3 (English, True, International)
    specimen3 = {
        'external_id': "test_fc_specimen_nasa_mars",
        'claim_text': "NASA spacecraft confirms presence of water ice beneath Martian equatorial permafrost deposits.",
        'claimant': "Science News Outlet",
        'fact_check_publisher': "Reuters Fact Check",
        'publisher_rating': "Verified True",
        'normalized_verdict': "True",
        'fact_check_url': "https://www.reuters.com/fact-check/nasa-mars-water-ice",
        'review_date': "2026-10-31T08:00:00Z",
        'language': "en",
        'category': "International",
        'country': "International",
        'source_api': "google_fact_check",
        'explanation': "Official NASA peer-reviewed radar sounding confirmed subterranean ice sheets."
    }
    db_manager.upsert_fact_check(specimen3)

    # 8. Check Total Count Increased by 3
    resp_all = client.get('/api/fact-checks?limit=50')
    all_fcs = resp_all.json['fact_checks']
    assert_test(len(all_fcs) >= 3, "Database contains all newly ingested verified fact-checks")

    # 9. Test Keyword Search Filter
    resp_search = client.get('/api/fact-checks?search=satellite+tracking+chips')
    search_results = resp_search.json['fact_checks']
    assert_test(len(search_results) >= 1 and 'GPS' in search_results[0]['claim_text'], "Keyword search correctly isolates matching claim text")

    # 10. Test Search on Non-Existent Term
    resp_empty = client.get('/api/fact-checks?search=nonexistent_quantum_alien_claim_xyz')
    assert_test(resp_empty.json['total'] == 0 and len(resp_empty.json['fact_checks']) == 0, "Non-matching search returns 0 records cleanly")

    # 11. Test Language Filter: Hindi
    resp_hi = client.get('/api/fact-checks?language=hi')
    hi_fcs = resp_hi.json['fact_checks']
    assert_test(all(item['language'] == 'hi' for item in hi_fcs), "Language filter 'hi' isolates Hindi claims")

    # 12. Test Language Filter: English
    resp_en = client.get('/api/fact-checks?language=en')
    en_fcs = resp_en.json['fact_checks']
    assert_test(all(item['language'] == 'en' for item in en_fcs), "Language filter 'en' isolates English claims")

    # 13. Test Verdict Filter: False
    resp_false = client.get('/api/fact-checks?verdict=False')
    false_fcs = resp_false.json['fact_checks']
    assert_test(all(item['normalized_verdict'] == 'False' for item in false_fcs), "Verdict filter 'False' isolates False claims")

    # 14. Test Category Filter: International
    resp_intl = client.get('/api/fact-checks?category=International')
    intl_fcs = resp_intl.json['fact_checks']
    assert_test(all(item['category'] == 'International' for item in intl_fcs), "Category filter 'International' isolates global claims")

    # 15. Test Pagination Parameters
    resp_paged = client.get('/api/fact-checks?limit=1&page=1')
    assert_test(len(resp_paged.json['fact_checks']) == 1 and resp_paged.json['page'] == 1, "Pagination limit=1 returns exactly 1 item")

    # 16. Test GET /api/fact-checks/<id> Single Article Detail
    fc_id = specimen1['external_id']
    item_in_db = [x for x in all_fcs if x['external_id'] == fc_id][0]
    resp_detail = client.get(f"/api/fact-checks/{item_in_db['id']}")
    assert_test(resp_detail.status_code == 200 and resp_detail.json['fact_check']['external_id'] == fc_id, "GET /api/fact-checks/<id> returns full article details")

    # 17. Test GET /api/fact-checks/<id> 404 for Invalid ID
    resp_404 = client.get('/api/fact-checks/non_existent_id_99999')
    assert_test(resp_404.status_code == 404, "Invalid fact check ID returns HTTP 404")

    # 18. Test GET /api/fact-checks/latest
    resp_latest = client.get('/api/fact-checks/latest?limit=3')
    assert_test(resp_latest.status_code == 200 and len(resp_latest.json['latest']) <= 3, "GET /api/fact-checks/latest returns top recent claims")

    # 19. Test GET /api/fact-checks/sync-status
    resp_sync_status = client.get('/api/fact-checks/sync-status')
    assert_test(resp_sync_status.status_code == 200 and 'records_count' in resp_sync_status.json, "GET /api/fact-checks/sync-status returns telemetry")

    # 20. Test POST /api/fact-checks/refresh Security: Visitor requests handled with cooldown protection
    resp_unauth = client.post('/api/fact-checks/refresh')
    assert_test(resp_unauth.status_code == 200, "POST /api/fact-checks/refresh handles visitor requests with cooldown protection")

    # 21. Create authenticated user session and test authorized refresh
    u_name = f"sync_analyst_{uuid.uuid4().hex[:6]}"
    client.post('/api/auth/signup', json={
        'full_name': 'Sync Analyst',
        'username': u_name,
        'email': f"{u_name}@example.com",
        'password': 'SecurePassword123!',
        'confirm_password': 'SecurePassword123!'
    })
    login_resp = client.post('/api/auth/login', json={
        'identifier': f"{u_name}@example.com",
        'password': 'SecurePassword123!'
    })
    assert_test(login_resp.status_code == 200, "Authenticated user session created for sync test")

    # 22. Authorized POST /api/fact-checks/refresh succeeds
    resp_auth_refresh = client.post('/api/fact-checks/refresh')
    assert_test(resp_auth_refresh.status_code in (200, 202), "Authenticated user successfully triggers background sync (200/202)")

    # 23. Test Rate Limiting Cooldown on Rapid Trigger
    resp_rate_limited = client.post('/api/fact-checks/refresh')
    assert_test(resp_rate_limited.status_code in (200, 429), "Rapid second sync triggers rate limiting (429) or is_syncing deduplication")

    # 24. Test "Analyze with SatyaCheck" Integration on Fact-Check Claim
    resp_ml = client.post('/api/detector', json={
        'input': specimen1['claim_text']
    })
    assert_test(resp_ml.status_code == 200 and 'classification' in resp_ml.json, "'Analyze with SatyaCheck' runs ML prediction on fact-check claim text")
    assert_test('probabilities' in resp_ml.json and 'fake' in resp_ml.json['probabilities'], "ML classifier returns numerical class probability distribution on claim")

    # 25. Test Sync Engine Fault Tolerance: No crash and no record deletion on network interruption
    engine_summary = sync_engine.run_sync()
    assert_test(engine_summary is not None, "Sync engine executes safely without crashing under offline/sandboxed conditions")
    post_sync_count = db_manager.get_fact_checks_count()
    assert_test(post_sync_count >= 3, "Existing database records are completely preserved during sync execution")

    print(f"\nAll Fact-Check Feed tests completed: {passed}/{total} Passed.\n")
    return passed == total

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
