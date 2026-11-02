import os
import re
import json
import time
import uuid
import hashlib
import logging
import threading
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urlparse
import requests
from app.db import db_manager

logger = logging.getLogger(__name__)

# Configurable environment settings
GOOGLE_FACT_CHECK_API_KEY = os.environ.get('GOOGLE_FACT_CHECK_API_KEY', '').strip()
SYNC_INTERVAL_MINUTES = int(os.environ.get('FACT_CHECK_SYNC_INTERVAL_MINUTES', '30'))
SYNC_ON_STARTUP = os.environ.get('FACT_CHECK_SYNC_ON_STARTUP', 'true').lower() in ('true', '1', 'yes')

# Trusted Indian fact-checkers registry
INDIAN_PUBLISHERS = [
    'boom live', 'boom', 'vishwas news', 'alt news', 'the quint', 'webqoof',
    'factly', 'newschecker', 'india today', 'dainik jagran', 'amar ujala',
    'pib fact check', 'press information bureau', 'thip media', 'logically facts',
    'the print', 'newsmobile', 'fact crescendo'
]

# RSS Feeds of verified IFCN accredited Indian fact check portals
TRUSTED_FACT_CHECK_FEEDS = [
    {
        'url': 'https://www.boomlive.in/feeds/fact-check.rss',
        'publisher': 'BOOM Live',
        'language': 'en',
        'country': 'India',
        'category': 'India'
    },
    {
        'url': 'https://www.vishwasnews.com/feed/',
        'publisher': 'Vishwas News',
        'language': 'en',
        'country': 'India',
        'category': 'India'
    },
    {
        'url': 'https://www.vishwasnews.com/hindi/feed/',
        'publisher': 'Vishwas News',
        'language': 'hi',
        'country': 'India',
        'category': 'India'
    },
    {
        'url': 'https://www.altnews.in/feed/',
        'publisher': 'Alt News',
        'language': 'en',
        'country': 'India',
        'category': 'India'
    },
    {
        'url': 'https://factly.in/category/fake-news/feed/',
        'publisher': 'Factly',
        'language': 'en',
        'country': 'India',
        'category': 'India'
    },
    {
        'url': 'https://newschecker.in/feed/',
        'publisher': 'Newschecker',
        'language': 'en',
        'country': 'India',
        'category': 'India'
    }
]


def normalize_verdict(raw_rating: str) -> str:
    """
    Normalizes arbitrary external publisher ratings to standardized UI categories:
    'False', 'Misleading', 'Partly False', 'True', 'Other'.
    """
    if not raw_rating:
        return 'Other'

    r = raw_rating.strip().lower()

    # 1. Check Partly False patterns first
    if any(w in r for w in ['partly', 'half', 'partially', 'mixture', 'आंशिक', 'mostly false']):
        return 'Partly False'

    # 2. Check False patterns (English & Hindi)
    if any(w in r for w in [
        'false', 'fake', 'गलत', 'झूठा', 'झूठ', 'incorrect', 'pants on fire',
        'fabricated', 'hoax', 'debunk', 'not true', 'untrue', 'unsupported',
        'manipulated video', 'doctored', 'altered photo', 'scam'
    ]):
        return 'False'

    # 3. Check Misleading patterns
    if any(w in r for w in [
        'mislead', 'भ्रामक', 'missing context', 'manipulated',
        'altered', 'exaggerat', 'distort', 'misattribut', 'misleading context'
    ]):
        return 'Misleading'

    # 4. Check True patterns
    if any(w in r for w in [
        'true', 'correct', 'accurate', 'सच', 'सही', 'verified', 'authentic', 'confirmed'
    ]):
        return 'True'

    return 'Other'


def detect_script_language(text: str) -> str:
    """Detects if text contains Devanagari (Hindi) or Latin (English)."""
    if re.search(r'[\u0900-\u097F]', text):
        return 'hi'
    return 'en'


def generate_external_id(url: str, claim_text: str, publisher: str) -> str:
    """Produces a stable, deterministic SHA256 identifier for duplicate prevention."""
    clean_url = (url or '').strip().lower()
    if clean_url and clean_url.startswith('http'):
        seed = clean_url
    else:
        seed = f"{publisher.lower()}:{(claim_text or '').strip().lower()[:150]}"
    return hashlib.sha256(seed.encode('utf-8')).hexdigest()[:32]


class FactCheckSyncEngine:
    """
    Thread-safe synchronization engine for fetching genuine fact-check claims
    from Google Fact Check Tools API and accredited Indian IFCN feeds.
    """
    _instance = None
    _lock = threading.Lock()

    def __init__(self):
        self.is_running = False
        self._scheduler_thread = None
        self._stop_event = threading.Event()
        self.last_sync_time = None
        self.last_sync_summary = {}

    @classmethod
    def get_instance(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = cls()
            return cls._instance

    # ==================== Google Fact Check Tools API ====================

    def fetch_google_fact_checks(self, api_key: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Fetches live claims from Google Fact Check Tools API.
        Endpoint: https://factchecktools.googleapis.com/v1alpha1/claims:search
        Prioritizes India queries and English/Hindi languages.
        """
        key = api_key or GOOGLE_FACT_CHECK_API_KEY
        if not key:
            logger.info("FactCheckSync: No GOOGLE_FACT_CHECK_API_KEY provided. Skipping Google API.")
            return []

        base_url = "https://factchecktools.googleapis.com/v1alpha1/claims:search"
        headers = {"User-Agent": "SatyaCheck/2.4 (Research/Verification Engine)"}

        # Query topics prioritized for India & regional news
        queries = [
            {"query": "India", "languageCode": "en"},
            {"query": "India", "languageCode": "hi"},
            {"query": "viral", "languageCode": "en"},
            {"query": "WhatsApp", "languageCode": "en"},
            {"query": "election", "languageCode": "en"},
            {"query": "health", "languageCode": "en"}
        ]

        collected_records = []
        seen_keys = set()

        for q_params in queries:
            try:
                params = {
                    "key": key,
                    "query": q_params["query"],
                    "languageCode": q_params["languageCode"],
                    "pageSize": 20
                }
                resp = requests.get(base_url, params=params, headers=headers, timeout=12)

                if resp.status_code == 200:
                    data = resp.json()
                    claims = data.get("claims", [])
                    for c in claims:
                        claim_text = c.get("text", "").strip()
                        claimant = c.get("claimant", "")
                        claim_date = c.get("claimDate", "")

                        reviews = c.get("claimReview", [])
                        for r in reviews:
                            pub_info = r.get("publisher", {})
                            publisher_name = pub_info.get("name", "Verified Publisher")
                            pub_site = pub_info.get("site", "")
                            raw_rating = r.get("textualRating", "Unrated")
                            url = r.get("url", "")
                            review_date = r.get("reviewDate") or claim_date or datetime.now(timezone.utc).isoformat()
                            lang = r.get("languageCode") or q_params["languageCode"]
                            title = r.get("title", "")

                            if not claim_text or not url:
                                continue

                            ext_id = generate_external_id(url, claim_text, publisher_name)
                            if ext_id in seen_keys:
                                continue
                            seen_keys.add(ext_id)

                            # Determine country & category
                            is_india = (
                                "india" in q_params["query"].lower() or
                                any(ip in publisher_name.lower() for ip in INDIAN_PUBLISHERS) or
                                "in" in pub_site.lower() or
                                detect_script_language(claim_text) == 'hi'
                            )

                            record = {
                                "external_id": ext_id,
                                "claim_text": claim_text,
                                "claimant": claimant or "Social Media Claim",
                                "fact_check_publisher": publisher_name,
                                "publisher_rating": raw_rating,
                                "normalized_verdict": normalize_verdict(raw_rating),
                                "fact_check_url": url,
                                "review_date": review_date,
                                "language": lang if lang in ('en', 'hi') else detect_script_language(claim_text),
                                "category": "India" if is_india else "International",
                                "country": "India" if is_india else "International",
                                "source_api": "google_fact_check",
                                "explanation": title or f"Fact-checked by {publisher_name}: {raw_rating}.",
                                "image_url": None,
                                "image_source": publisher_name,
                                "image_caption": f"Fact-check investigation by {publisher_name}"
                            }
                            collected_records.append(record)
                elif resp.status_code in (401, 403):
                    logger.warning(f"FactCheckSync: Google API authentication failed (status {resp.status_code}). Check GOOGLE_FACT_CHECK_API_KEY.")
                    break
                else:
                    logger.warning(f"FactCheckSync: Google API query {q_params} returned status {resp.status_code}")
            except Exception as e:
                logger.warning(f"FactCheckSync: Error querying Google Fact Check API ({q_params.get('query')}): {str(e)}")

        logger.info(f"FactCheckSync: Google Fact Check Tools returned {len(collected_records)} claims.")
        return collected_records

    # ==================== Legitimate Indian IFCN RSS Feeds ====================

    def fetch_rss_fact_checks(self) -> List[Dict[str, Any]]:
        """
        Fetches genuine fact check articles from accredited Indian IFCN feeds
        (BOOM Live, Vishwas News, Alt News, Factly, Newschecker).
        """
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SatyaCheck/2.4 (Research/Verification Engine)",
            "Accept": "application/rss+xml, application/xml, text/xml, */*"
        }

        collected_records = []
        seen_keys = set()

        for feed in TRUSTED_FACT_CHECK_FEEDS:
            try:
                resp = requests.get(feed['url'], headers=headers, timeout=12)
                if resp.status_code != 200:
                    continue

                root = ET.fromstring(resp.content)
                channel = root.find('channel')
                if channel is None:
                    continue

                items = channel.findall('item')
                for item in items:
                    title_elem = item.find('title')
                    link_elem = item.find('link')
                    desc_elem = item.find('description')
                    pubdate_elem = item.find('pubDate')

                    title = title_elem.text.strip() if title_elem is not None and title_elem.text else ''
                    link = link_elem.text.strip() if link_elem is not None and link_elem.text else ''
                    desc = desc_elem.text.strip() if desc_elem is not None and desc_elem.text else ''
                    pubdate = pubdate_elem.text.strip() if pubdate_elem is not None and pubdate_elem.text else ''

                    if not title or not link:
                        continue

                    # Clean CDATA or HTML in description
                    clean_desc = re.sub(r'<[^>]+>', ' ', desc).strip()
                    clean_desc = re.sub(r'\s+', ' ', clean_desc)

                    # Extract Claim Text: Remove prefix like "Fact Check:" or "BOOM Fact Check:"
                    claim_text = re.sub(
                        r'^(fact[\s\-]?check|boom[\s\-]?fact[\s\-]?check|विशवास न्यूज|फैक्ट चेक)[\s\:\-\|]+',
                        '',
                        title,
                        flags=re.IGNORECASE
                    ).strip()

                    # Deduce rating from title/desc keywords
                    raw_text_combined = f"{title} {clean_desc[:200]}"
                    raw_rating = "False"
                    if "misleading" in raw_text_combined.lower() or "भ्रामक" in raw_text_combined:
                        raw_rating = "Misleading"
                    elif "partly" in raw_text_combined.lower() or "partially" in raw_text_combined.lower():
                        raw_rating = "Partly False"
                    elif "true" in raw_text_combined.lower() or "सच" in raw_text_combined:
                        raw_rating = "True"

                    # Parse PubDate to ISO format
                    parsed_date = datetime.now(timezone.utc).isoformat()
                    if pubdate:
                        try:
                            from email.utils import parsedate_to_datetime
                            parsed_date = parsedate_to_datetime(pubdate).isoformat()
                        except Exception:
                            parsed_date = datetime.now(timezone.utc).isoformat()

                    ext_id = generate_external_id(link, claim_text, feed['publisher'])
                    if ext_id in seen_keys:
                        continue
                    seen_keys.add(ext_id)

                    detected_lang = feed['language']
                    if detected_lang == 'en' and detect_script_language(claim_text) == 'hi':
                        detected_lang = 'hi'

                    # Extract Genuine Article Image if provided by feed
                    img_url = None
                    enclosure = item.find('enclosure')
                    if enclosure is not None and ('image' in enclosure.attrib.get('type', '') or any(enclosure.attrib.get('url', '').lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp', '.avif'])):
                        img_url = enclosure.attrib.get('url')

                    if not img_url:
                        for media_tag in ['{http://search.yahoo.com/mrss/}content', '{http://search.yahoo.com/mrss/}thumbnail']:
                            m_elem = item.find(media_tag)
                            if m_elem is not None and m_elem.attrib.get('url'):
                                img_url = m_elem.attrib.get('url')
                                break

                    if not img_url:
                        raw_html_for_img = f"{desc} {item.findtext('{http://purl.org/rss/1.0/modules/content/}encoded', '')}"
                        img_match = re.search(r'<img[^>]+src=["\'](https?://[^"\']+)["\']', raw_html_for_img, re.IGNORECASE)
                        if img_match:
                            img_url = img_match.group(1)

                    record = {
                        "external_id": ext_id,
                        "claim_text": claim_text,
                        "claimant": "Viral Claim / Social Media Post",
                        "fact_check_publisher": feed['publisher'],
                        "publisher_rating": raw_rating,
                        "normalized_verdict": normalize_verdict(raw_rating),
                        "fact_check_url": link,
                        "review_date": parsed_date,
                        "language": detected_lang,
                        "category": feed['category'],
                        "country": feed['country'],
                        "source_api": f"{feed['publisher'].lower().replace(' ', '_')}_rss",
                        "explanation": clean_desc[:350] if clean_desc else f"Fact-checked by {feed['publisher']}.",
                        "image_url": img_url,
                        "image_source": feed['publisher'] if img_url else None,
                        "image_caption": f"Official fact-check article image from {feed['publisher']}" if img_url else None
                    }
                    collected_records.append(record)

            except Exception as e:
                logger.warning(f"FactCheckSync: Failed to fetch feed {feed['publisher']} ({feed['url']}): {str(e)}")

        logger.info(f"FactCheckSync: RSS feeds returned {len(collected_records)} articles.")
        return collected_records

    # ==================== Main Sync Orchestrator ====================

    def run_sync(self, api_key: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes an end-to-end sync cycle.
        Fetches genuine fact checks from external APIs, normalizes and dedupes them,
        saves records to SQLite/MongoDB, and updates sync status.
        Thread-safe: will not execute concurrently.
        """
        if not self._lock.acquire(blocking=False):
            return {
                "status": "in_progress",
                "message": "A synchronization task is already actively executing.",
                "is_syncing": True
            }

        start_time = time.time()
        db_manager.update_sync_status(status='syncing', is_syncing=True)
        newly_inserted = 0
        updated_records = 0
        errors = []

        try:
            logger.info("FactCheckSync: Initiating live fact-check synchronization...")
            fetched_records: List[Dict[str, Any]] = []

            # 1. Primary Source: Google Fact Check Tools API
            try:
                google_records = self.fetch_google_fact_checks(api_key=api_key)
                fetched_records.extend(google_records)
            except Exception as e:
                err_msg = f"Google Fact Check API error: {str(e)}"
                logger.error(err_msg)
                errors.append(err_msg)

            # 2. Supplementary Source: Accredited Indian IFCN RSS Feeds
            try:
                rss_records = self.fetch_rss_fact_checks()
                fetched_records.extend(rss_records)
            except Exception as e:
                err_msg = f"IFCN RSS feed error: {str(e)}"
                logger.error(err_msg)
                errors.append(err_msg)

            # 3. Upsert records into database (prevents duplicates)
            for record in fetched_records:
                try:
                    is_new = db_manager.upsert_fact_check(record)
                    if is_new:
                        newly_inserted += 1
                    else:
                        updated_records += 1
                except Exception as e:
                    logger.warning(f"FactCheckSync: Failed to upsert record {record.get('external_id')}: {e}")

            # 4. Finalize Sync Status
            status_label = 'success' if (fetched_records or not errors) else 'error'
            err_summary = '; '.join(errors) if errors else None

            db_manager.update_sync_status(
                status=status_label,
                records_added=newly_inserted,
                error=err_summary,
                is_syncing=False
            )

            total_count = db_manager.get_fact_checks_count()
            duration = round(time.time() - start_time, 2)
            self.last_sync_time = datetime.now(timezone.utc).isoformat()

            summary = {
                "status": status_label,
                "new_records": newly_inserted,
                "updated_records": updated_records,
                "total_in_db": total_count,
                "duration_seconds": duration,
                "errors": errors,
                "last_synced_at": self.last_sync_time
            }
            self.last_sync_summary = summary
            logger.info(f"FactCheckSync: Synchronization complete. Added: {newly_inserted}, Updated: {updated_records}, Total: {total_count} ({duration}s)")
            return summary

        except Exception as e:
            err_msg = f"Fatal error during synchronization: {str(e)}"
            logger.exception(err_msg)
            db_manager.update_sync_status(status='error', error=err_msg, is_syncing=False)
            return {
                "status": "error",
                "message": err_msg,
                "new_records": newly_inserted,
                "updated_records": updated_records,
                "errors": [err_msg]
            }
        finally:
            self._lock.release()

    # ==================== Background Scheduler ====================

    def start_scheduler(self):
        """Starts the background recurring sync daemon thread."""
        if self.is_running:
            return

        self.is_running = True
        self._stop_event.clear()

        def _worker():
            logger.info(f"FactCheckSync: Background scheduler daemon initialized (Interval: {SYNC_INTERVAL_MINUTES} min).")
            
            # Initial startup sync (if enabled)
            if SYNC_ON_STARTUP:
                try:
                    time.sleep(3)  # Brief delay to allow Flask server to bind
                    self.run_sync()
                except Exception as e:
                    logger.warning(f"FactCheckSync: Startup sync caught exception: {e}")

            # Periodic loop
            while not self._stop_event.is_set():
                interval_secs = max(SYNC_INTERVAL_MINUTES * 60, 60)
                # Sleep in short slices for responsive shutdown
                for _ in range(int(interval_secs / 5)):
                    if self._stop_event.is_set():
                        break
                    time.sleep(5)

                if not self._stop_event.is_set():
                    try:
                        self.run_sync()
                    except Exception as e:
                        logger.warning(f"FactCheckSync: Recurring sync caught exception: {e}")

        self._scheduler_thread = threading.Thread(target=_worker, name="FactCheckSyncDaemon", daemon=True)
        self._scheduler_thread.start()

    def stop_scheduler(self):
        """Stops the recurring sync daemon thread."""
        self.is_running = False
        self._stop_event.set()
        if self._scheduler_thread and self._scheduler_thread.is_alive():
            self._scheduler_thread.join(timeout=2)


# Global Engine Singleton
sync_engine = FactCheckSyncEngine.get_instance()
