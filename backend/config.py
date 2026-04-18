import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    MAPS_API_KEY = os.getenv("MAPS_API_KEY", "")  # Google Maps or Mapbox
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")
    
    # App Settings
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Feature flags
    USE_MOCK_AUTH = os.getenv("USE_MOCK_AUTH", "true").lower() == "true"
    USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "false").lower() == "true"

config = Config()
