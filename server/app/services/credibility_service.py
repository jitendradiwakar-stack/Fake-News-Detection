try:
    from ddgs import DDGS
except ImportError:
    from duckduckgo_search import DDGS
from urllib.parse import urlparse


class CredibilityCheckService:
    """Service to check credibility of news by searching trusted portals."""

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
        'theguardian.com': 'The Guardian',
        'bbc.com/news': 'BBC News',
        'reuters.com': 'Reuters',
        'aljazeera.com': 'Al Jazeera',
        'cnn.com': 'CNN'
    }

    ALL_PORTALS = {**BANGLA_PORTALS, **ENGLISH_PORTALS}

    @classmethod
    def check_credibility(cls, headline: str):
        """
        Search DuckDuckGo for the headline and check if trusted portals have covered it.

        Args:
            headline: The news headline to search for

        Returns:
            dict: Contains found_sources list with portal info
        """
        try:
            # Search using DuckDuckGo
            search_results = cls._search_duckduckgo(headline)

            # Filter results to only trusted portals
            found_sources = cls._filter_trusted_sources(search_results)

            return {
                'found_sources': found_sources,
                'total_found': len(found_sources)
            }
        except Exception as e:
            print(f"Error in credibility check: {str(e)}")
            return {
                'found_sources': [],
                'total_found': 0,
                'error': str(e)
            }

    @classmethod
    def _search_duckduckgo(cls, query: str):
        """
        Perform a DuckDuckGo search and extract results from both BD and US regions.

        Args:
            query: Search query string

        Returns:
            list: Combined list of search result dictionaries from both regions
        """
        all_results = []

        # Search in both Bangladesh and USA regions for better coverage
        regions = ['bd-en', 'us-en']

        for region in regions:
            try:
                # Initialize DuckDuckGo search with timeout
                ddgs = DDGS(timeout=10)

                # Perform text search
                search_results = ddgs.text(
                    query=query,
                    region=region,  # Bangladesh English or US English
                    safesearch='off',
                    max_results=20,  # 20 per region = 40 total
                    backend='auto'  # Use multiple backends for reliability
                )

                # Convert to our format
                for result in search_results:
                    # ddgs returns: title, href, body
                    all_results.append({
                        'title': result.get('title', ''),
                        'url': result.get('href', ''),
                        'region': region
                    })

            except Exception as e:
                print(
                    f"Error searching DuckDuckGo in region {region}: {str(e)}")
                continue

        # Remove duplicate URLs
        seen_urls = set()
        unique_results = []
        for result in all_results:
            if result['url'] and result['url'] not in seen_urls:
                seen_urls.add(result['url'])
                unique_results.append(result)

        return unique_results

    @classmethod
    def _filter_trusted_sources(cls, search_results):
        """
        Filter search results to only include trusted news portals.

        Args:
            search_results: List of search result dictionaries

        Returns:
            list: Filtered list with portal name, url, title, and favicon
        """
        found_sources = []

        for result in search_results:
            try:
                url = result['url']
                parsed_url = urlparse(url)
                domain = parsed_url.netloc.lower()

                # Remove 'www.' prefix
                domain = domain.replace('www.', '')

                # Check if domain matches any trusted portal
                matched_portal = None
                portal_name = None

                for portal_domain, name in cls.ALL_PORTALS.items():
                    if portal_domain in domain or domain in portal_domain:
                        matched_portal = portal_domain
                        portal_name = name
                        break

                if matched_portal and portal_name:
                    # Generate favicon URL
                    favicon_url = f"https://www.google.com/s2/favicons?domain={domain}&sz=32"

                    found_sources.append({
                        'portal_name': portal_name,
                        'url': url,
                        'title': result['title'],
                        'favicon': favicon_url,
                        'domain': domain
                    })

            except Exception as e:
                continue

        # Remove duplicates based on domain
        seen_domains = set()
        unique_sources = []
        for source in found_sources:
            if source['domain'] not in seen_domains:
                seen_domains.add(source['domain'])
                unique_sources.append(source)

        return unique_sources
