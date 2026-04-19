import requests
from config import config
from models import Location
from utils.logger import logger
from utils.location_parser import clean_location_name

MOCK_LOCATIONS = {
    # California locations
    "california": Location(name="California, USA", latitude=36.1162, longitude=-119.6816, country="USA", region="California"),
    "san francisco": Location(name="San Francisco, CA", latitude=37.7749, longitude=-122.4194, country="USA", region="California"),
    "bay area": Location(name="San Francisco Bay Area, CA", latitude=37.7749, longitude=-122.4194, country="USA", region="California"),
    "oakland": Location(name="Oakland, CA", latitude=37.8044, longitude=-122.2712, country="USA", region="California"),
    
    # Pakistan locations
    "pakistan": Location(name="Pakistan", latitude=30.3753, longitude=69.3451, country="Pakistan", region="Sindh"),
    "sindh": Location(name="Sindh, Pakistan", latitude=24.9056, longitude=67.0822, country="Pakistan", region="Sindh"),
    "karachi": Location(name="Karachi, Pakistan", latitude=24.8607, longitude=67.0011, country="Pakistan", region="Sindh"),
    "indus": Location(name="Indus River, Pakistan", latitude=24.9056, longitude=67.0822, country="Pakistan", region="Sindh"),
    
    # Australia locations
    "australia": Location(name="Australia", latitude=-25.2744, longitude=133.7751, country="Australia", region="Queensland"),
    "sydney": Location(name="Sydney, Australia", latitude=-33.8688, longitude=151.2093, country="Australia", region="NSW"),
    "queensland": Location(name="Queensland, Australia", latitude=-27.4698, longitude=153.0251, country="Australia", region="Queensland"),
    "brisbane": Location(name="Brisbane, Queensland", latitude=-27.4698, longitude=153.0251, country="Australia", region="Queensland"),
    
    # Philippines locations
    "philippines": Location(name="Philippines", latitude=12.8797, longitude=121.7740, country="Philippines", region="Metro Manila"),
    "manila": Location(name="Manila, Philippines", latitude=14.5995, longitude=120.9842, country="Philippines", region="Metro Manila"),
    
    # Indonesia locations
    "indonesia": Location(name="Indonesia", latitude=-0.7893, longitude=113.9213, country="Indonesia", region="Central Java"),
    "java": Location(name="Java, Indonesia", latitude=-7.0675, longitude=110.4126, country="Indonesia", region="Central Java"),
    "merapi": Location(name="Mount Merapi, Indonesia", latitude=7.5426, longitude=110.4420, country="Indonesia", region="Central Java"),
    "jakarta": Location(name="Jakarta, Indonesia", latitude=-6.2088, longitude=106.8456, country="Indonesia", region="Java"),
    
    # USA locations
    "texas": Location(name="Texas, United States", latitude=31.0, longitude=-99.0, country="United States", region="Texas"),
    "camp mystic": Location(name="Hunt, Texas, United States", latitude=30.0741, longitude=-99.3342, country="United States", region="Texas"),
    "oklahoma": Location(name="Oklahoma, USA", latitude=35.5653, longitude=-97.5289, country="USA", region="Oklahoma"),
    "norman": Location(name="Norman, Oklahoma", latitude=35.3395, longitude=-97.4867, country="USA", region="Oklahoma"),
    
    # Nepal locations
    "nepal": Location(name="Nepal", latitude=28.3949, longitude=84.1240, country="Nepal", region="Central"),
    "kathmandu": Location(name="Kathmandu, Nepal", latitude=27.7172, longitude=85.3240, country="Nepal", region="Central"),
    
    # Africa locations
    "ethiopia": Location(name="Ethiopia", latitude=9.1450, longitude=40.4897, country="Ethiopia", region="Addis Ababa"),
    "addis ababa": Location(name="Addis Ababa, Ethiopia", latitude=9.0320, longitude=38.7469, country="Ethiopia", region="Addis Ababa"),
    "horn of africa": Location(name="Horn of Africa", latitude=9.1450, longitude=40.4897, country="Multi-country", region="Horn of Africa"),
    "somalia": Location(name="Somalia", latitude=5.1521, longitude=46.1996, country="Somalia", region="Mogadishu"),
    "mogadishu": Location(name="Mogadishu, Somalia", latitude=2.0469, longitude=45.3182, country="Somalia", region="Mogadishu"),
    "kenya": Location(name="Kenya", latitude=-0.0236, longitude=37.9062, country="Kenya", region="Nairobi"),
    "nairobi": Location(name="Nairobi, Kenya", latitude=-1.2862, longitude=36.8172, country="Kenya", region="Nairobi"),
    
    # Brazil locations
    "brazil": Location(name="Brazil", latitude=-14.2350, longitude=-51.9253, country="Brazil", region="São Paulo"),
    "são paulo": Location(name="São Paulo, Brazil", latitude=-23.5505, longitude=-46.6333, country="Brazil", region="São Paulo"),
    "cubatão": Location(name="Cubatão, São Paulo", latitude=-23.8844, longitude=-46.4228, country="Brazil", region="São Paulo"),
    
    # European locations
    "scotland": Location(name="Scotland", latitude=56.4907, longitude=-4.2026, country="United Kingdom", region="Scotland"),
    "edinburgh": Location(name="Edinburgh, Scotland", latitude=55.9533, longitude=-3.1883, country="United Kingdom", region="Scotland"),
    "uk": Location(name="United Kingdom", latitude=55.3781, longitude=-3.4360, country="United Kingdom", region="Scotland"),
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
