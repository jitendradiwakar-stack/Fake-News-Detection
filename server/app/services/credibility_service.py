import logging
from urllib.parse import urlparse

try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS

logger = logging.getLogger(__name__)


class CredibilityCheckService:
    """Service to check credibility of news by searching trusted portals."""

    # Top Hindi & Indian Fact-Checking portals
    HINDI_PORTALS = {
        'jagran.com': 'Dainik Jagran',
        'amarujala.com': 'Amar Ujala',
        'navbharattimes.indiatimes.com': 'Navbharat Times',
        'bhaskar.com': 'Dainik Bhaskar',
        'aajtak.in': 'Aaj Tak',
        'ndtv.in': 'NDTV India',
        'bbc.com/hindi': 'BBC Hindi',
        'abplive.com': 'ABP News',
        'zeenews.india.com/hindi': 'Zee News Hindi',
        'livehindustan.com': 'Hindustan',
        'indiatv.in': 'India TV',
        'boomlive.in': 'BOOM Live Fact Check',
        'altnews.in': 'Alt News Fact Check',
        'factcrescendo.com': 'Fact Crescendo',
        'vishvasnews.com': 'Vishvas News',
        'thequint.com/hindi': 'Quint Hindi',
        'patrika.com': 'Rajasthan Patrika',
        'thewirehindi.com': 'The Wire Hindi',
        'firstpost.com/hindi': 'Firstpost Hindi'
    }

    # Top Bangla news portals
    BANGLA_PORTALS = {
        'prothomalo.com': 'Prothom Alo',
        'bdnews24.com': 'BDNews24',
        'somoynews.tv': 'Somoy News',
        'jamuna.tv': 'Jamuna TV',
        'banglatribune.com': 'Bangla Tribune',
        'kalerkantho.com': 'Kaler Kantho',
        'ittefaq.com.bd': 'Ittefaq',
        'thedailystar.net/bangla': 'Daily Star Bangla',
        'ntvbd.com': 'NTV',
        'rtvonline.com': 'RTV',
        'channel24bd.tv': 'Channel 24',
        'ekattor.tv': 'Ekattor TV',
        'bhorerkagoj.com': 'Bhorer Kagoj',
        'jugantor.com': 'Jugantor',
        'mzamin.com': 'Manab Zamin'
    }

    # Top English news portals
    ENGLISH_PORTALS = {
        'thedailystar.net': 'The Daily Star',
        'dhakatribune.com': 'Dhaka Tribune',
        'bdnews24.com/english': 'BDNews24 English',
        'newagebd.net': 'New Age',
        'tbsnews.net': 'The Business Standard',
        'thefinancialexpress.com.bd': 'The Financial Express',
        'unb.com.bd': 'UNB',
        'theindependentbd.com': 'The Independent',
        'observerbd.com': 'The Observer',
        'prothomalo.com/english': 'Prothom Alo English',
        'thehindu.com': 'The Hindu',
        'indianexpress.com': 'The Indian Express',
        'timesofindia.indiatimes.com': 'Times of India',
        'hindustantimes.com': 'Hindustan Times',
        'theguardian.com': 'The Guardian',
        'bbc.com/news': 'BBC News',
        'reuters.com': 'Reuters',
        'aljazeera.com': 'Al Jazeera',
        'cnn.com': 'CNN',
        'apnews.com': 'Associated Press'
    }

    ALL_PORTALS = {**HINDI_PORTALS, **BANGLA_PORTALS, **ENGLISH_PORTALS}

    @classmethod
    def get_favicon_url(cls, domain: str) -> str:
        """Get favicon URL using Google's favicon service."""
        clean_domain = domain.split('/')[0]
        return f"https://www.google.com/s2/favicons?domain={clean_domain}&sz=64"

    @classmethod
    def extract_domain(cls, url: str) -> str:
        """Extract clean domain from URL."""
        try:
            parsed = urlparse(url)
            domain = parsed.netloc.lower()
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except Exception:
            return ""

    @classmethod
    def match_portal(cls, url: str) -> tuple[str, str] | None:
        """
        Check if URL matches any trusted portal.
        Returns (portal_name, matched_key) or None.
        """
        domain = cls.extract_domain(url)
        url_lower = url.lower()

        # Check full path matches first (e.g. bbc.com/hindi)
        for portal_key, portal_name in cls.ALL_PORTALS.items():
            if '/' in portal_key:
                if portal_key in url_lower:
                    return portal_name, portal_key

        # Check domain-only matches
        for portal_key, portal_name in cls.ALL_PORTALS.items():
            if '/' not in portal_key:
                if domain == portal_key or domain.endswith('.' + portal_key):
                    return portal_name, portal_key

        return None

    @classmethod
    def check_credibility(cls, headline: str, max_results: int = 15) -> dict:
        """
        Search DuckDuckGo for the headline and find matches on trusted portals.
        Gracefully falls back within 3 seconds if network fails or search is throttled,
        allowing the caller to rely seamlessly on offline ML predictions.
        """
        found_sources = []
        seen_domains = set()

        try:
            with DDGS(timeout=3) as ddgs:
                results = list(ddgs.text(headline, max_results=max_results))

                for result in results:
                    url = result.get('href', '')
                    title = result.get('title', '')

                    match = cls.match_portal(url)
                    if match:
                        portal_name, portal_key = match
                        domain = cls.extract_domain(url)

                        if portal_name not in seen_domains:
                            seen_domains.add(portal_name)
                            found_sources.append({
                                'portal_name': portal_name,
                                'url': url,
                                'title': title,
                                'favicon': cls.get_favicon_url(domain),
                                'domain': domain
                            })

            return {
                'headline': headline,
                'found_sources': found_sources,
                'total_found': len(found_sources),
                'is_credible': len(found_sources) > 0,
                'network_fallback': False
            }

        except Exception as e:
            logger.warning(f"Credibility search fallback activated ({type(e).__name__}): {e}")
            return {
                'headline': headline,
                'found_sources': [],
                'total_found': 0,
                'is_credible': False,
                'network_fallback': True,
                'error': 'Credibility search temporarily unavailable'
            }
