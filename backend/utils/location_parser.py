import re

LOCATION_INDICATORS = [
    r'\b[A-Z][a-z]+\s*,\s*[A-Z][a-z]+\b',  # City, Country
    r'\b[A-Z][a-z]+\s+State\b',
    r'\b(U\.S\.|USA|UK|Canada|France|Germany|China|India|Brazil)\b',
    r'\b(California|Texas|Florida|New York|London|Paris|Tokyo|Sydney)\b',
]

def extract_location_from_text(text: str) -> str:
    """
    Extract potential location names from article text.
    Returns the most likely location or empty string.
    """
    if not text:
        return ""
    
    text = text[:500]  # Limit to first 500 chars
    
    for pattern in LOCATION_INDICATORS:
        match = re.search(pattern, text)
        if match:
            return match.group(0)
    
    return ""

def clean_location_name(location: str) -> str:
    """Clean up location name for geocoding."""
    return location.strip().replace('U.S.', 'United States').replace('UK', 'United Kingdom')
