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
    
    # International
    "london": "London, UK",
    "paris": "Paris, France",
    "tokyo": "Tokyo, Japan",
    "beijing": "Beijing, China",
    "shanghai": "Shanghai, China",
    "mumbai": "Mumbai, India",
    "delhi": "Delhi, India",
    "bangalore": "Bangalore, India",
    "sydney": "Sydney, Australia",
    "melbourne": "Melbourne, Australia",
    "brisbane": "Brisbane, Australia",
    "dubai": "Dubai, UAE",
    "bangkok": "Bangkok, Thailand",
    "singapore": "Singapore",
    "hong kong": "Hong Kong",
    "moscow": "Moscow, Russia",
    "istanbul": "Istanbul, Turkey",
    "toronto": "Toronto, Canada",
    "vancouver": "Vancouver, Canada",
    "mexico city": "Mexico City, Mexico",
    "são paulo": "São Paulo, Brazil",
    "rio de janeiro": "Rio de Janeiro, Brazil",
    "buenos aires": "Buenos Aires, Argentina",
    "cairo": "Cairo, Egypt",
    "johannesburg": "Johannesburg, South Africa",
    "cape town": "Cape Town, South Africa",
    "nairobi": "Nairobi, Kenya",
    "manila": "Manila, Philippines",
    "bangkok": "Bangkok, Thailand",
    "seoul": "Seoul, South Korea",
    "amsterdam": "Amsterdam, Netherlands",
    "berlin": "Berlin, Germany",
    "madrid": "Madrid, Spain",
    "rome": "Rome, Italy",
    "barcelona": "Barcelona, Spain",
    "toronto": "Toronto, Canada",
    "mexico": "Mexico",
    "canada": "Canada",
    "brazil": "Brazil",
    "argentina": "Argentina",
    "india": "India",
    "china": "China",
    "japan": "Japan",
    "thailand": "Thailand",
    "vietnam": "Vietnam",
    "pakistan": "Pakistan",
    "nepal": "Nepal",
    "bangladesh": "Bangladesh",
    "sri lanka": "Sri Lanka",
    "indonesia": "Indonesia",
    "malaysia": "Malaysia",
    "philippines": "Philippines",
    "south korea": "South Korea",
    "north korea": "North Korea",
    "germany": "Germany",
    "france": "France",
    "italy": "Italy",
    "spain": "Spain",
    "uk": "United Kingdom",
    "united kingdom": "United Kingdom",
    "ireland": "Ireland",
    "greece": "Greece",
    "poland": "Poland",
    "ukraine": "Ukraine",
    "russia": "Russia",
    "turkey": "Turkey",
    "middle east": "Middle East",
    "africa": "Africa",
    "europe": "Europe",
    "asia": "Asia",
    "north america": "North America",
    "south america": "South America",
    "australia": "Australia",
    "new zealand": "New Zealand",
}

def extract_location_from_text(text: str) -> str:
    """
    Extract real location from ANY article text.
    Works with real news articles to find where events are happening.
    """
    if not text:
        return ""
    
    # Normalize text for search
    text_lower = text.lower()
    text_first_2000 = text[:2000]  # Look in first 2000 chars for main info
    
    # 1. Check for exact location keyword matches (highest priority)
    for keyword, location_name in WORLD_LOCATIONS.items():
        if keyword in text_lower:
            return location_name
    
    # 2. Look for "City, State" or "City, Country" pattern
    city_pattern = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*,\s*([A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\b'
    match = re.search(city_pattern, text_first_2000)
    if match:
        city = match.group(1)
        state_or_country = match.group(2)
        return f"{city}, {state_or_country}"
    
    # 3. Look for location context clues (City + action verb)
    location_context = r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:hit|struck|affected|damaged|destroyed|flooded|evacuated|emergency|disaster|alert|warning)\b'
    match = re.search(location_context, text_first_2000, re.IGNORECASE)
    if match:
        potential_location = match.group(1)
        if len(potential_location) > 3:
            return potential_location
    
    # 4. Try to find any capitalized phrase that looks like a location
    capitalized_phrases = re.finditer(r'\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2})\b', text_first_2000)
    for match in capitalized_phrases:
        phrase = match.group(1)
        # Filter out common non-location words
        stopwords = {'The', 'A', 'An', 'In', 'At', 'From', 'To', 'And', 'Or', 'This', 'That', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'}
        if phrase not in stopwords and len(phrase) > 3:
            # Check if it's a recognized location keyword
            if any(keyword in phrase.lower() for keyword in WORLD_LOCATIONS.keys()):
                return phrase
    
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
