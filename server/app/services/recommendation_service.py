import os
import hashlib
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any
from app.db import db_manager

AVAILABLE_CATEGORIES = [
    'Politics',
    'Technology',
    'Education',
    'Health',
    'Science',
    'Sports',
    'Entertainment',
    'Finance',
    'International News',
    'Social Media Rumors'
]

SUPPORTED_LANGUAGES = ['all', 'en', 'hi', 'hinglish']

CATEGORY_KEYWORDS: Dict[str, List[str]] = {
    'Politics': [
        'politics', 'election', 'minister', 'party', 'government', 'bjp', 'congress',
        'modi', 'rahul', 'parliament', 'vote', 'voting', 'mla', 'mp', 'leader',
        'chunav', 'sarkar', 'neta', 'rajniti', 'pm', 'chief minister', 'rajya sabha',
        'lok sabha', 'नेता', 'सरकार', 'चुनाव', 'संसद', 'मंत्री'
    ],
    'Technology': [
        'tech', 'technology', 'ai', 'artificial intelligence', 'chatgpt', 'phone',
        'smartphone', 'android', 'iphone', 'apple', 'google', 'hacker', 'cyber',
        'internet', 'sim card', 'app', '5g', 'software', 'online scam', 'deepfake',
        'हैक', 'फोन', 'साइबर'
    ],
    'Education': [
        'education', 'exam', 'university', 'cbse', 'ugc', 'school', 'degree',
        'paper leak', 'admit card', 'syllabus', 'board', 'student', 'college',
        'pariksha', 'result', 'scholarship', 'परीक्षा', 'विश्वविद्यालय', 'छात्र', 'शिक्षा'
    ],
    'Health': [
        'health', 'covid', 'vaccine', 'cancer', 'virus', 'doctor', 'hospital',
        'medicine', 'dawa', 'ilaj', 'disease', 'who', 'swasthya', 'cure', 'remedy',
        'heart attack', 'sugar', 'diet', 'drug', 'स्वास्थ्य', 'दवा', 'इलाज', 'अस्पताल'
    ],
    'Science': [
        'science', 'nasa', 'isro', 'space', 'mars', 'moon', 'chandrayaan',
        'satellite', 'solar', 'planet', 'physics', 'astronomy', 'scientist',
        'antariksh', 'eclipse', 'research', 'अंतरिक्ष', 'वैज्ञानिक', 'इसरो', 'नासा'
    ],
    'Sports': [
        'sports', 'cricket', 'ipl', 'bcci', 'kohli', 'rohit', 'dhoni', 'football',
        'fifa', 'olympics', 'match', 'wicket', 'trophy', 'khel', 'tennis',
        'badminton', 'world cup', 'क्रिकेट', 'खेल', 'मैच'
    ],
    'Entertainment': [
        'entertainment', 'bollywood', 'hollywood', 'actor', 'actress', 'movie',
        'film', 'cinema', 'shah rukh', 'salman', 'trailer', 'song', 'celebrity',
        'ott', 'netflix', 'hero', 'अभिनेता', 'फिल्म', 'सिनेमा'
    ],
    'Finance': [
        'finance', 'rbi', 'bank', '500 note', '2000 note', 'currency', 'atm',
        'tax', 'gst', 'budget', 'share market', 'stock', 'loan', 'crypto',
        'bitcoin', 'sbi', 'rupee', 'paisa', 'subsidy', 'yojana', 'बैंक', 'रुपये',
        'लोन', 'योजना'
    ],
    'International News': [
        'international', 'world', 'war', 'russia', 'ukraine', 'israel', 'gaza',
        'usa', 'america', 'trump', 'biden', 'china', 'pakistan', 'un',
        'president', 'foreign', 'embassy', 'global', 'विदेश', 'युद्ध', 'अमेरिका'
    ],
    'Social Media Rumors': [
        'rumor', 'rumour', 'viral', 'whatsapp', 'forward', 'claim', 'fake notice',
        'banned', 'breaking news', 'warning', 'message', 'social media', 'facebook',
        'instagram', 'x.com', 'twitter', 'वायरल', 'दावा', 'व्हाट्सएप'
    ]
}

EDUCATIONAL_TIPS = [
    {
        'id': 'tip-1',
        'title': 'Verify Before You Forward',
        'summary': 'Before forwarding alarming viral messages or audio notes on WhatsApp, cross-reference them with official portals (e.g. PIB Fact Check, official gazettes) or SatyaCheck.',
        'badge': 'Source Verification',
        'icon': 'ShieldCheck'
    },
    {
        'id': 'tip-2',
        'title': 'Inspect URL Domains & SSL Badges',
        'summary': 'Fraudulent and copycat news websites often alter one letter (like .co instead of .com or extra hyphens) to mimic credible newsrooms.',
        'badge': 'URL Forensics',
        'icon': 'Globe'
    },
    {
        'id': 'tip-3',
        'title': 'Perform Reverse Image & Video Search',
        'summary': 'Misinformation frequently pairs genuine archived footage from years ago with false breaking news headlines. Reverse-search thumbnails to trace the original date and context.',
        'badge': 'Media Verification',
        'icon': 'Eye'
    },
    {
        'id': 'tip-4',
        'title': 'Recognize Emotional Panic Triggers',
        'summary': 'Fabricated stories are engineered with hyperbolic buzzwords ("Alert!", "Forward immediately!") to provoke fear or outrage before critical thinking intervenes.',
        'badge': 'Linguistic Analysis',
        'icon': 'AlertTriangle'
    },
    {
        'id': 'tip-5',
        'title': 'Check Author Byline & Timestamps',
        'summary': 'Legitimate journalism attributes articles to named correspondents with verifiable author profiles and publication timestamps, not anonymous sources.',
        'badge': 'Editorial Integrity',
        'icon': 'Clock'
    }
]

class RecommendationService:
    """
    Transparent, dynamic recommendation engine with smart rotation for SatyaCheck.
    Ranks genuine fact-checked records from the database based on:
      1. User-selected topic interests (keyword & category matching)
      2. User-preferred language (English, Hindi, Hinglish, All)
      3. Publication recency of the fact-check investigation
      4. Exclusion of dismissed articles and flagging of saved articles
      5. Smart rotation dampening for recently displayed articles
      6. Controlled micro-jitter to rotate similarly-ranked articles across page reloads/refreshes
      7. Dynamic deduplication for 'Load More' pagination
    """

    @classmethod
    def get_recommendations(cls, user: Optional[Dict[str, Any]] = None,
                            category_filter: Optional[str] = None,
                            language_filter: Optional[str] = None,
                            exclude_ids: Optional[List[str]] = None,
                            limit: int = 6,
                            offset: int = 0,
                            is_refresh: bool = False,
                            session_seed: Optional[str] = None) -> Dict[str, Any]:
        user_id = user.get('id') if user else None
        user_interests = user.get('selected_interests') if user else []
        if isinstance(user_interests, str):
            try:
                import json
                user_interests = json.loads(user_interests)
            except Exception:
                user_interests = []

        preferred_language = language_filter or (user.get('preferred_language') if user else 'all') or 'all'
        
        # Load dismissed and saved article IDs for authenticated user
        dismissed_set = set(db_manager.get_user_dismissed_articles(user_id)) if user_id else set()
        saved_set = set(db_manager.get_user_saved_articles(user_id)) if user_id else set()

        # Build current client exclude set (prevents duplicates during continuous Load More)
        exclude_set = set(exclude_ids or [])

        # Fetch candidate records from database (up to 150 records)
        candidates = db_manager.get_fact_checks(limit=150)

        # If database is empty, return empty response gracefully
        if not candidates:
            return {
                'recommended': [],
                'trending': [],
                'educational_tips': EDUCATIONAL_TIPS,
                'categories': [{'name': c, 'count': 0} for c in AVAILABLE_CATEGORIES],
                'user_preferences': {
                    'preferred_language': preferred_language,
                    'selected_interests': user_interests,
                    'onboarding_completed': bool(user.get('onboarding_completed', False)) if user else False
                },
                'pagination': {
                    'has_more': False,
                    'total_eligible': 0,
                    'returned_count': 0,
                    'offset': offset,
                    'limit': limit
                },
                'last_refreshed_at': datetime.now(timezone.utc).isoformat()
            }

        # Calculate category counts across all available fact checks (excluding dismissed)
        category_counts = {cat: 0 for cat in AVAILABLE_CATEGORIES}
        for item in candidates:
            if item.get('id') in dismissed_set:
                continue
            item_text = f"{item.get('claim_text', '')} {item.get('category', '')} {item.get('explanation', '')}".lower()
            for cat in AVAILABLE_CATEGORIES:
                if item.get('category', '').lower() == cat.lower():
                    category_counts[cat] += 1
                else:
                    kws = CATEGORY_KEYWORDS.get(cat, [])
                    if any(kw.lower() in item_text for kw in kws[:4]):
                        category_counts[cat] += 1

        # Retrieve recently displayed articles within the last 45 minutes for rotation dampening
        recently_displayed = set(db_manager.get_recently_displayed_articles(user_id, minutes=45)) if user_id else set()

        # If user explicitly requested refresh and most articles have already been displayed,
        # reset the displayed history so the rotation starts clean and avoids starving results
        if is_refresh and user_id and len(recently_displayed) >= max(len(candidates) - limit, 1):
            db_manager.reset_user_displayed_history(user_id)
            recently_displayed = set()

        # Filter out dismissed and client-excluded articles
        eligible = [
            c for c in candidates
            if c.get('id') not in dismissed_set and c.get('id') not in exclude_set
        ]
        # If refreshing and excluding already-displayed items leaves fewer than limit, recycle pool
        if is_refresh and len(eligible) < limit:
            eligible = [c for c in candidates if c.get('id') not in dismissed_set]

        # Scoring candidates
        scored_items = []
        for item in eligible:
            item_copy = dict(item)
            item_copy['is_saved'] = item_copy.get('id') in saved_set

            # If user explicitly filtered by category
            if category_filter and category_filter != 'all':
                cat_match = item_copy.get('category', '').lower() == category_filter.lower()
                cat_kws = CATEGORY_KEYWORDS.get(category_filter, [])
                kw_match = any(
                    kw.lower() in f"{item_copy.get('claim_text', '')} {item_copy.get('explanation', '')}".lower()
                    for kw in cat_kws
                )
                if not cat_match and not kw_match:
                    continue

            score = 0.0
            reasons = []

            # 1. Topic Interest Match
            matched_interest = None
            item_text = f"{item_copy.get('claim_text', '')} {item_copy.get('explanation', '')}".lower()

            if user_interests:
                for interest in user_interests:
                    if item_copy.get('category', '').lower() == interest.lower():
                        score += 16.0
                        matched_interest = interest
                        reasons.append(f"Matches your topic '{interest}'")
                        break
                    kws = CATEGORY_KEYWORDS.get(interest, [])
                    for kw in kws:
                        if kw.lower() in item_text:
                            score += 9.0
                            matched_interest = interest
                            reasons.append(f"Related to {interest}")
                            break
                    if matched_interest:
                        break

            # 2. Language Preference Match
            item_lang = (item_copy.get('language') or 'en').lower()
            if preferred_language == 'all':
                score += 3.0
            elif preferred_language == item_lang:
                score += 7.0
                if not reasons:
                    lang_label = 'Hindi' if item_lang == 'hi' else 'English'
                    reasons.append(f"In your preferred language ({lang_label})")
            else:
                score -= 3.0

            # 3. Recency Bonus
            try:
                date_str = item_copy.get('review_date') or item_copy.get('first_seen_at') or ''
                dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                days_ago = max(0, (datetime.now(timezone.utc) - dt).days)
                score += max(0.0, 10.0 - (days_ago * 0.15))
            except Exception:
                score += 3.0

            # 4. Verified Misinformation Verdict Bonus
            verdict = (item_copy.get('normalized_verdict') or '').lower()
            if verdict in ('false', 'misleading', 'partly false'):
                score += 4.0

            # 5. Smart Rotation Dampening:
            # Articles displayed recently in the user's active session receive a dampening penalty
            # so fresh, unviewed articles rotate to the top of the feed!
            if item_copy.get('id') in recently_displayed:
                score -= 12.0

            # 6. Controlled Rotation Jitter (between 0.00 and 2.50):
            # Breaks ties between similarly-scored items on reloads/refreshes without promoting irrelevant items
            seed_key = f"{item_copy.get('id')}_{session_seed or datetime.now(timezone.utc).strftime('%Y%m%d%H%M')}"
            jitter_val = (int(hashlib.md5(seed_key.encode('utf-8')).hexdigest()[:6], 16) % 250) / 100.0
            score += jitter_val

            # 7. Explicit Refresh Dynamic Rotation:
            # When user triggers refresh, provide score rotation so different items surface
            if is_refresh and session_seed:
                refresh_bonus = (int(hashlib.md5(f"rot_{item_copy.get('id')}_{session_seed}".encode('utf-8')).hexdigest()[:6], 16) % 900) / 100.0
                score += refresh_bonus

            # Fallback reason
            if not reasons:
                if verdict in ('false', 'misleading'):
                    reasons.append(f"Verified Misinformation by {item_copy.get('fact_check_publisher', 'Fact-Checker')}")
                else:
                    reasons.append(f"Recent Investigation from {item_copy.get('fact_check_publisher', 'Trusted Source')}")

            item_copy['recommendation_score'] = round(score, 2)
            item_copy['match_reason'] = reasons[0] if reasons else "Recent Trending Fact-Check"
            scored_items.append(item_copy)

        # Sort by recommendation_score descending
        scored_items.sort(key=lambda x: x['recommendation_score'], reverse=True)

        total_eligible = len(scored_items)
        batch = scored_items[offset : offset + limit]
        has_more = (offset + limit) < total_eligible

        # Record displayed impressions for authenticated users so next refresh/reload rotates
        if user_id and batch:
            displayed_ids = [b['id'] for b in batch]
            db_manager.record_batch_impressions(user_id, displayed_ids)

        # Trending: Top 6 recent items sorted by review_date/last_synced_at
        trending_pool = sorted(
            [dict(c) for c in candidates if c.get('id') not in dismissed_set],
            key=lambda x: x.get('review_date', x.get('last_synced_at', '')),
            reverse=True
        )
        trending = trending_pool[:6]
        for t in trending:
            t['is_saved'] = t.get('id') in saved_set

        next_cursor = str(offset + limit) if has_more else None

        return {
            'recommended': batch,
            'trending': trending,
            'educational_tips': EDUCATIONAL_TIPS,
            'categories': [{'name': cat, 'count': category_counts[cat]} for cat in AVAILABLE_CATEGORIES],
            'user_preferences': {
                'preferred_language': preferred_language,
                'selected_interests': user_interests,
                'onboarding_completed': bool(user.get('onboarding_completed', False)) if user else False
            },
            'pagination': {
                'has_more': has_more,
                'total_eligible': total_eligible,
                'returned_count': len(batch),
                'offset': offset,
                'limit': limit,
                'cursor': str(offset),
                'next_cursor': next_cursor
            },
            'last_refreshed_at': datetime.now(timezone.utc).isoformat()
        }
