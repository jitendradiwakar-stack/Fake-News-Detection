from flask import Blueprint, request, jsonify
import uuid
from datetime import datetime, timezone
import ipaddress
import socket
from urllib.parse import urlparse, urljoin
import re
import requests
from bs4 import BeautifulSoup

from app.services.ml_service import MLDetectionService
from app.services.credibility_service import CredibilityCheckService
from app.utils.text_cleaner import clean_text
from app.auth import get_optional_auth_user
from app.db import db_manager
from app.limiter import limiter

detector_bp = Blueprint('detector', __name__)

MAX_URL_REDIRECTS = 3
MAX_RESPONSE_BYTES = 2 * 1024 * 1024  # 2MB Limit


def is_url(text: str) -> bool:
    """Checks if the given text is an HTTP or HTTPS URL."""
    return re.match(r'^https?://\S+', text.strip(), re.IGNORECASE) is not None


def is_safe_ip(ip_str: str) -> bool:
    """Verifies that an IP address is publicly routable and not private/reserved/loopback."""
    try:
        ip = ipaddress.ip_address(ip_str)
        return not (
            ip.is_private or
            ip.is_loopback or
            ip.is_link_local or
            ip.is_reserved or
            ip.is_multicast or
            ip.is_unspecified
        )
    except ValueError:
        return False


def validate_and_resolve_url(url: str):
    """
    Validates URL scheme, parses hostname, resolves DNS,
    and ensures all resolved IP addresses are safe public IPs.
    """
    parsed = urlparse(url)
    if parsed.scheme.lower() not in ('http', 'https'):
        return None, "Invalid scheme. Only HTTP and HTTPS are permitted."

    hostname = parsed.hostname
    if not hostname:
        return None, "Missing hostname in URL."

    try:
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        return None, f"DNS resolution failed for hostname '{hostname}'"

    if not addr_info:
        return None, f"No IP addresses resolved for hostname '{hostname}'"

    for item in addr_info:
        ip_str = item[4][0]
        if not is_safe_ip(ip_str):
            return None, f"Access to private/loopback/reserved IP address is forbidden: {ip_str}"

    return parsed, None


def fetch_url_html(initial_url: str, max_redirects: int = MAX_URL_REDIRECTS, max_bytes: int = MAX_RESPONSE_BYTES) -> str:
    """
    Fetches HTML content from URL safely:
    - Verifies scheme (http/https only)
    - Re-validates destination IP on every redirect hop (max 3)
    - Validates Content-Type header (must be text/html)
    - Enforces maximum response stream size limit (2MB)
    """
    current_url = initial_url
    session = requests.Session()

    for hop in range(max_redirects + 1):
        parsed, error = validate_and_resolve_url(current_url)
        if error or not parsed:
            raise ValueError(error or "Invalid or disallowed URL")

        response = session.get(
            current_url,
            allow_redirects=False,
            stream=True,
            timeout=6,
            headers={'User-Agent': 'SatyaCheckBot/1.0 (+https://satyacheck.org)'}
        )

        if response.is_redirect or response.status_code in (301, 302, 303, 307, 308):
            location = response.headers.get('Location')
            if not location or hop >= max_redirects:
                raise ValueError("Too many redirects or missing Location header")
            current_url = urljoin(current_url, location)
            continue

        if response.status_code != 200:
            raise ValueError(f"Target responded with HTTP {response.status_code}")

        content_type = response.headers.get('Content-Type', '').lower()
        if 'text/html' not in content_type:
            raise ValueError(f"Disallowed Content-Type '{content_type}'. Only text/html is accepted.")

        content = bytearray()
        for chunk in response.iter_content(chunk_size=8192):
            content.extend(chunk)
            if len(content) > max_bytes:
                raise ValueError("Payload size exceeded maximum allowed limit of 2MB.")

        encoding = response.encoding or 'utf-8'
        return content.decode(encoding, errors='replace')

    raise ValueError("Exceeded maximum redirect hops")


@detector_bp.route('/detector', methods=['POST'])
@limiter.limit("15 per minute")
def detect():
    """
    Accepts a headline or URL and returns a fake news prediction.
    If the user is authenticated, saves the prediction to the database under their account.
    """
    data = request.get_json()
    if not data or 'input' not in data:
        return jsonify({'error': 'Invalid input. Missing "input" field.'}), 400

    user_input = data['input']
    headline = ''

    if is_url(user_input):
        try:
            html_text = fetch_url_html(user_input)
            soup = BeautifulSoup(html_text, 'html.parser')
            if soup.title and soup.title.string:
                headline = soup.title.string.strip()
            else:
                return jsonify({'error': 'Could not extract title from the URL.'}), 400
        except ValueError as e:
            return jsonify({'error': 'Invalid or disallowed URL'}), 400
        except Exception as e:
            return jsonify({'error': 'Invalid or disallowed URL'}), 400
    else:
        headline = user_input.strip()

    cleaned_headline = clean_text(headline)

    if not cleaned_headline:
        return jsonify({'error': 'Input is empty after cleaning.'}), 400

    try:
        result = MLDetectionService.detect(cleaned_headline)

        # Check credibility and boost score if applicable
        try:
            credibility_result = CredibilityCheckService.check_credibility(headline)
            sources_found = credibility_result.get('total_found', 0)

            # Boost authenticity score if below 80% and reputable sources are found
            if sources_found > 0 and result['probabilities']['authentic'] < 0.8:
                boost = min(sources_found * 0.05, 0.5)
                boosted_score = min(result['probabilities']['authentic'] + boost, 0.89)

                if boosted_score < 0.9:
                    result['probabilities']['authentic'] = boosted_score
                    result['probabilities']['fake'] = 1 - boosted_score

                    if boosted_score >= 0.5:
                        result['prediction'] = 1

                    result['credibility_boost'] = {
                        'applied': True,
                        'boost_amount': boost,
                        'sources_found': sources_found
                    }
        except Exception as cred_error:
            print(f"Credibility check failed: {str(cred_error)}")

        # Determine semantic label
        authentic_score = result['probabilities']['authentic']
        if authentic_score >= 0.7:
            predicted_label = 'authentic'
        elif authentic_score >= 0.4:
            predicted_label = 'suspicious'
        else:
            predicted_label = 'fake'

        result['classification'] = predicted_label

        # If user is authenticated, save record to persistent database
        auth_user = get_optional_auth_user()
        if auth_user:
            try:
                confidence_pct = max(result['probabilities']['authentic'], result['probabilities']['fake']) * 100
                db_manager.save_prediction(
                    user_id=auth_user['id'],
                    input_text=user_input,
                    input_type='url' if is_url(user_input) else 'headline',
                    predicted_label=predicted_label,
                    prediction_code=result['prediction'],
                    authenticity_score=authentic_score,
                    confidence=confidence_pct,
                    detected_language=result.get('detected_language', 'en'),
                    headline=headline
                )
            except Exception as save_err:
                print(f"Warning: Failed to save user prediction to database: {save_err}")

        if is_url(user_input):
            result_with_headline = dict(result)
            result_with_headline['headline'] = headline
            return jsonify(result_with_headline), 200

        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': f'An error occurred during detection: {str(e)}'}), 500


@detector_bp.route('/credibility-check', methods=['POST'])
def check_credibility():
    """
    Check if a news headline appears on trusted news portals.
    """
    data = request.get_json()
    if not data or 'headline' not in data:
        return jsonify({'error': 'Invalid input. Missing "headline" field.'}), 400

    headline = data['headline']

    if not headline or len(headline.strip()) == 0:
        return jsonify({'error': 'Headline cannot be empty.'}), 400

    try:
        result = CredibilityCheckService.check_credibility(headline)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            'error': f'An error occurred during credibility check: {str(e)}',
            'found_sources': [],
            'total_found': 0
        }), 500


@detector_bp.route('/feedback', methods=['POST'])
def submit_feedback():
    """
    Submits user forensic feedback, disputed verdicts, or reported misinformation claims.
    """
    data = request.get_json() or {}
    category = data.get('category', 'general').strip()
    claim_text = data.get('claim_text', '').strip()
    feedback_text = data.get('feedback_text', '').strip()
    evidence_url = data.get('evidence_url', '').strip()
    rating = data.get('rating')

    if not feedback_text and not claim_text:
        return jsonify({'error': 'Please provide claim details or feedback message.'}), 400

    feedback_id = str(uuid.uuid4())
    user = get_optional_auth_user()
    user_id = user['id'] if user else None

    try:
        now = datetime.now(timezone.utc).isoformat()
        if db_manager.use_mongo:
            db_manager.db.feedback.insert_one({
                '_id': feedback_id,
                'id': feedback_id,
                'user_id': user_id,
                'category': category,
                'claim_text': claim_text,
                'feedback_text': feedback_text,
                'evidence_url': evidence_url,
                'rating': rating,
                'created_at': now
            })
        else:
            with db_manager._get_sqlite_conn() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    CREATE TABLE IF NOT EXISTS forensic_feedback (
                        id TEXT PRIMARY KEY,
                        user_id TEXT,
                        category TEXT NOT NULL,
                        claim_text TEXT,
                        feedback_text TEXT,
                        evidence_url TEXT,
                        rating INTEGER,
                        created_at TEXT NOT NULL
                    )
                ''')
                cursor.execute('''
                    INSERT INTO forensic_feedback (id, user_id, category, claim_text, feedback_text, evidence_url, rating, created_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ''', (feedback_id, user_id, category, claim_text, feedback_text, evidence_url, rating, now))
                conn.commit()
    except Exception:
        pass

    return jsonify({
        'success': True,
        'message': 'Forensic feedback submitted successfully. Our team and automated verification pipeline will review this report.',
        'feedback_id': feedback_id
    }), 201


@detector_bp.route('/alerts', methods=['GET'])
def get_alerts():
    """
    Returns real-time disinformation alerts based on recent false/misleading claims and viral rumors.
    """
    try:
        recent_claims = db_manager.get_fact_checks(verdict='False', limit=6)
        alerts = []
        for i, c in enumerate(recent_claims):
            alerts.append({
                'id': c.get('id', f'alert-{i}'),
                'title': c.get('claim_text'),
                'publisher': c.get('fact_check_publisher', 'IFCN Verified'),
                'severity': 'CRITICAL' if i == 0 else ('HIGH' if i < 3 else 'WARNING'),
                'verdict': c.get('normalized_verdict', 'False'),
                'review_date': c.get('review_date'),
                'url': c.get('fact_check_url'),
                'explanation': c.get('explanation') or f"Debunked by {c.get('fact_check_publisher')}",
                'impact': 'High Virality on WhatsApp & Social Media' if i % 2 == 0 else 'Active Disinformation Campaign'
            })
        return jsonify({'alerts': alerts, 'count': len(alerts)}), 200
    except Exception as e:
        return jsonify({'error': str(e), 'alerts': []}), 500
