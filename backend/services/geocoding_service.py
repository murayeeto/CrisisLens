import requests
from config import config
from models import Location
from utils.logger import logger
from utils.location_parser import clean_location_name

MOCK_LOCATIONS = {
    "california": Location(name="California, USA", latitude=36.1162, longitude=-119.6816, country="USA", region="California"),
    "san francisco": Location(name="San Francisco, CA", latitude=37.7749, longitude=-122.4194, country="USA", region="California"),
    "pakistan": Location(name="Pakistan", latitude=30.3753, longitude=69.3451, country="Pakistan", region="Sindh"),
    "sydney": Location(name="Sydney, Australia", latitude=-33.8688, longitude=151.2093, country="Australia", region="NSW"),
}

# Cache for geocoding results to avoid repeated API calls
_geocoding_cache = {}

class GeocodingService:
    @staticmethod
    def geocode_location(location_name: str) -> Location:
        """
        Geocode a location name to lat/lng using Google Maps API or fallback.
        Uses caching to avoid repeated API calls for the same location.
        """
        if not location_name:
            return Location(name="Unknown", latitude=0.0, longitude=0.0)
        
        location_name_lower = location_name.lower()
        
        # Check cache first
        if location_name_lower in _geocoding_cache:
            logger.debug(f"Cache hit for location '{location_name}'")
            return _geocoding_cache[location_name_lower]
        
        # Check mock locations first
        for key, loc in MOCK_LOCATIONS.items():
            if key in location_name_lower:
                logger.info(f"Geocoded '{location_name}' using mock data: {loc.name}")
                _geocoding_cache[location_name_lower] = loc  # Cache the result
                return loc
        
        if config.USE_MOCK_DATA or not config.MAPS_API_KEY:
            logger.warning(f"No mock location for '{location_name}'. Using fallback.")
            loc = Location(
                name=location_name,
                latitude=20.0,
                longitude=0.0,
                country="Unknown"
            )
            _geocoding_cache[location_name_lower] = loc  # Cache the result
            return loc
        
        try:
            # Try Google Maps Geocoding API
            url = "https://maps.googleapis.com/maps/api/geocode/json"
            params = {
                "address": location_name,
                "key": config.MAPS_API_KEY
            }
            
            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            if data.get("results"):
                result = data["results"][0]
                location = result["geometry"]["location"]
                address_components = result.get("address_components", [])
                
                country = next(
                    (c["long_name"] for c in address_components if "country" in c["types"]),
                    None
                )
                region = next(
                    (c["long_name"] for c in address_components if "administrative_area_level_1" in c["types"]),
                    None
                )
                
                loc = Location(
                    name=result["formatted_address"],
                    latitude=location["lat"],
                    longitude=location["lng"],
                    country=country,
                    region=region
                )
                logger.info(f"Geocoded '{location_name}' via Google Maps: {loc.name}")
                _geocoding_cache[location_name_lower] = loc  # Cache the result
                return loc
            else:
                logger.warning(f"No results from Google Maps for '{location_name}'")
                loc = Location(name=location_name, latitude=20.0, longitude=0.0)
                _geocoding_cache[location_name_lower] = loc  # Cache the result
                return loc
        
        except Exception as e:
            logger.error(f"Geocoding error for '{location_name}': {e}. Using fallback.")
            loc = Location(name=location_name, latitude=20.0, longitude=0.0)
            _geocoding_cache[location_name_lower] = loc  # Cache the result
            return loc

geocoding_service = GeocodingService()
