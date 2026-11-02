import re
import string
import unicodedata

def clean_text(text: str) -> str:
    """
    Cleans and normalizes text for multilingual NLP (English, Hindi, Hinglish, Bengali).
    Preserves Devanagari, Bengali, and Latin alphanumeric characters while removing
    URLs, emails, punctuation (including Hindi Danda), and excessive whitespace.
    """
    if not text:
        return ""

    # Normalize Unicode (NFKC) for consistent Devanagari & Bengali glyphs
    text = unicodedata.normalize('NFKC', str(text))

    # Remove URLs
    text = re.sub(r'https?://\S+', '', text)

    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)

    # Remove punctuation including Hindi Danda (। and ॥)
    text = re.sub(r'[।॥!?,;:"\'\(\)\[\]\{\}<>\/\\`~@#$%^&*+=_\-|]', ' ', text)

    # Standard ASCII punctuation removal for any remaining symbols
    text = text.translate(str.maketrans('', '', string.punctuation))

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()

    return text
