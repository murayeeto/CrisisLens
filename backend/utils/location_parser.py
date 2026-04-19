import re

# Comprehensive list of world cities and regions for location detection
WORLD_LOCATIONS = {
    # USA
    "california": "California, USA",
    "texas": "Texas, USA",
    "florida": "Florida, USA",
    "new york": "New York, USA",
    "oklahoma": "Oklahoma, USA",
    "san francisco": "San Francisco, USA",
    "los angeles": "Los Angeles, USA",
    "chicago": "Chicago, USA",
    "houston": "Houston, USA",
    "miami": "Miami, USA",
    "seattle": "Seattle, USA",
    "denver": "Denver, USA",
    "boston": "Boston, USA",
    "new orleans": "New Orleans, USA",
    "norman": "Norman, Oklahoma, USA",
    "bay area": "Bay Area, California, USA",
    "sumatra": "Sumatra, Indonesia",
    "northern sumatra": "Northern Sumatra, Indonesia",
    
    # Canada
    "canada": "Canada",
    "ontario": "Ontario, Canada",
    "quebec": "Quebec, Canada",
    "british columbia": "British Columbia, Canada",
    "bc": "British Columbia, Canada",
    "west nipissing": "West Nipissing, Ontario, Canada",
    "peguis": "Peguis, Manitoba, Canada",
    "nova scotia": "Nova Scotia, Canada",
    
    # International - Europe
    "london": "London, UK",
    "paris": "Paris, France",
    "uk": "United Kingdom",
    "united kingdom": "United Kingdom",
    "england": "England, UK",
    "scotland": "Scotland, UK",
    "ireland": "Ireland",
    "venice": "Venice, Italy",
    "italy": "Italy",
    "italy": "Italy",
    "prague": "Prague, Czech Republic",
    "czechia": "Czech Republic",
    "czech republic": "Czech Republic",
    "ukraine": "Ukraine",
    "kyiv": "Kyiv, Ukraine",
    "russia": "Russia",
    "moscow": "Moscow, Russia",
    "peak district": "Peak District, UK",
    
    # Middle East & Asia
    "dubai": "Dubai, UAE",
    "uae": "United Arab Emirates",
    "united arab emirates": "United Arab Emirates",
    "istanbul": "Istanbul, Turkey",
    "turkey": "Turkey",
    "iran": "Iran",
    "iraq": "Iraq",
    "middle east": "Middle East",
    
    # Asia
    "tokyo": "Tokyo, Japan",
    "beijing": "Beijing, China",
    "shanghai": "Shanghai, China",
    "mumbai": "Mumbai, India",
    "delhi": "Delhi, India",
    "india": "India",
    "odisha": "Odisha, India",
    "bangalore": "Bangalore, India",
    "thailand": "Thailand",
    "bangkok": "Bangkok, Thailand",
    "pai": "Pai, Thailand",
    "singapore": "Singapore",
    "hong kong": "Hong Kong",
    "taiwan": "Taiwan",
    "philippines": "Philippines",
    "manila": "Manila, Philippines",
    "south korea": "South Korea",
    "north korea": "North Korea",
    "vietnam": "Vietnam",
    "malaysia": "Malaysia",
    "indonesia": "Indonesia",
    "java": "Java, Indonesia",
    "merapi": "Mount Merapi, Indonesia",
    "jakarta": "Jakarta, Indonesia",
    "chernobyl": "Chernobyl, Ukraine",
    
    # Africa
    "egypt": "Egypt",
    "cairo": "Cairo, Egypt",
    "south africa": "South Africa",
    "johannesburg": "Johannesburg, South Africa",
    "cape town": "Cape Town, South Africa",
    "kenya": "Kenya",
    "nairobi": "Nairobi, Kenya",
    "nigeria": "Nigeria",
    "uyo": "Uyo, Nigeria",
    "akwa ibom": "Akwa Ibom State, Nigeria",
    
    # Australia & Pacific
    "australia": "Australia",
    "sydney": "Sydney, Australia",
    "melbourne": "Melbourne, Australia",
    "brisbane": "Brisbane, Australia",
    "queensland": "Queensland, Australia",
    "new zealand": "New Zealand",
    
    # South America
    "brazil": "Brazil",
    "são paulo": "São Paulo, Brazil",
    "rio de janeiro": "Rio de Janeiro, Brazil",
    "mexico": "Mexico",
    "mexico city": "Mexico City, Mexico",
    "argentina": "Argentina",
    "buenos aires": "Buenos Aires, Argentina",
}

def extract_location_from_text(text: str) -> str:
    """
    Extract real location from article text.
    Uses multiple strategies to find actual crisis locations mentioned in articles.
    """
    if not text:
        return ""
    
    # Normalize text for search
    text_lower = text.lower()
    text_first_2000 = text[:2000]  # Look in first 2000 chars for main info
    
    # STRATEGY 1: Check for exact location keyword matches (highest priority)
    # Sort by keyword length (longest first) to avoid partial matches
    sorted_keywords = sorted(WORLD_LOCATIONS.items(), key=lambda x: len(x[0]), reverse=True)
    for keyword, location_name in sorted_keywords:
        if keyword in text_lower:
            return location_name
    
    # STRATEGY 2: Look for specific "City, State" or "City, Country" patterns
    # This catches formats like "Tokyo, Japan" or "New York, NY"
    city_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]*)*)\s*,\s*([A-Z][a-z]*(?:\s+[A-Z][a-z]*)?)\b'
    for match in re.finditer(city_pattern, text_first_2000):
        city = match.group(1)
        state_or_country = match.group(2)
        combined = f"{city}, {state_or_country}".lower()
        # Only return if this looks like a real location
        if len(city) > 3 and len(state_or_country) > 2:
            return f"{city}, {state_or_country}"
    
    # STRATEGY 3: For articles that mention a crisis type, try to match locations near crisis keywords
    # This helps catch articles where the location might not be obvious
    crisis_keywords = ['earthquake', 'flood', 'fire', 'hurricane', 'tornado', 'disaster', 
                       'evacuation', 'emergency', 'crisis', 'explosion', 'storm', 'volcanic',
                       'tsunami', 'accident', 'incident', 'war', 'attack', 'pollution', 'alert']
    
    for crisis_word in crisis_keywords:
        if crisis_word in text_lower:
            crisis_pos = text_lower.find(crisis_word)
            # Look for location keywords within 150 chars before or after the crisis word
            search_start = max(0, crisis_pos - 150)
            search_end = min(len(text), crisis_pos + 150)
            nearby_text = text_lower[search_start:search_end]
            
            for keyword, location_name in sorted_keywords:
                if keyword in nearby_text and len(keyword) > 2:
                    return location_name
    
    # STRATEGY 4: Return empty - geocoding service will handle default
    return ""

def clean_location_name(location: str) -> str:
    """Clean up location name for geocoding."""
    if not location:
        return "Unknown"
    
    # Remove coordinate patterns
    location = re.sub(r'\([\d.\s,\-]+\)', '', location).strip()
    # Remove extra punctuation
    location = re.sub(r'\s+', ' ', location).strip()
    # Standard replacements
    replacements = {
        'U.S.': 'United States',
        'USA': 'United States',
        'U.S': 'United States',
        'U.K.': 'United Kingdom',
        'UK': 'United Kingdom',
        'US': 'United States',
    }
    for old, new in replacements.items():
        location = re.sub(r'\b' + re.escape(old) + r'\b', new, location, flags=re.IGNORECASE)
    
    return location
