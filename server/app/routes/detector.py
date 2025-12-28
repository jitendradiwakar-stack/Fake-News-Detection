from flask import Blueprint, request, jsonify
from app.services.ml_service import MLDetectionService
from app.services.credibility_service import CredibilityCheckService
from app.utils.text_cleaner import clean_text
import requests
from bs4 import BeautifulSoup
import re

detector_bp = Blueprint('detector', __name__)


def is_url(text):
    """Checks if the given text is a URL."""
    return re.match(r'https?://\S+', text) is not None


@detector_bp.route('/detector', methods=['POST'])
def detect():
    """
    Accepts a headline or URL and returns a fake news prediction.
    """
    data = request.get_json()
    if not data or 'input' not in data:
        return jsonify({'error': 'Invalid input. Missing "input" field.'}), 400

    user_input = data['input']
    headline = ''

    if is_url(user_input):
        try:
            response = requests.get(user_input, timeout=10)
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            if soup.title and soup.title.string:
                headline = soup.title.string
            else:
                return jsonify({'error': 'Could not extract title from the URL.'}), 400
        except requests.RequestException as e:
            return jsonify({'error': f'Failed to fetch URL: {str(e)}'}), 400
    else:
        headline = user_input

    cleaned_headline = clean_text(headline)

    if not cleaned_headline:
        return jsonify({'error': 'Input is empty after cleaning.'}), 400

    try:
        result = MLDetectionService.detect(cleaned_headline)

        # Check credibility and boost score if applicable
        try:
            credibility_result = CredibilityCheckService.check_credibility(
                headline)
            sources_found = credibility_result.get('total_found', 0)

            # Boost authenticity score if below 80% and reputable sources are found
            if sources_found > 0 and result['probabilities']['authentic'] < 0.8:
                # 5% per source, max 50% boost
                boost = min(sources_found * 0.05, 0.5)
                boosted_score = min(
                    result['probabilities']['authentic'] + boost, 0.89)  # Cap at 89%

                # Only apply boost if it keeps us under 90%
                if boosted_score < 0.9:
                    result['probabilities']['authentic'] = boosted_score
                    result['probabilities']['fake'] = 1 - boosted_score

                    # Update prediction if score crosses threshold
                    if boosted_score >= 0.5:
                        result['prediction'] = 1

                    # Add credibility info to result
                    result['credibility_boost'] = {
                        'applied': True,
                        'boost_amount': boost,
                        'sources_found': sources_found
                    }
        except Exception as cred_error:
            print(f"Credibility check failed: {str(cred_error)}")
            # Continue without credibility boost

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
