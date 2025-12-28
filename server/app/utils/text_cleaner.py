import re
import string

def clean_text(text):
    """
    Cleans the input text by removing punctuation, symbols, excessive whitespace,
    URLs, and email addresses.

    Args:
        text (str): The text to clean.

    Returns:
        str: The cleaned text.
    """
    # Remove URLs
    text = re.sub(r'https?://\S+', '', text)
    # Remove email addresses
    text = re.sub(r'\S+@\S+', '', text)
    # Remove punctuation and symbols
    text = text.translate(str.maketrans('', '', string.punctuation))
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    return text
