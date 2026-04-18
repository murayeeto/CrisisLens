import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    MAPS_API_KEY = os.getenv("MAPS_API_KEY", "")  # Google Maps or Mapbox
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")
    
    # Firebase Admin SDK
    FIREBASE_CREDENTIALS_PATH = os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "crisislens-8cb5d-firebase-adminsdk-fbsvc-7f045dabe9.json"
    )
    FIREBASE_PROJECT_ID = "crisislens-8cb5d"
    
    # App Settings
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Feature flags
    USE_MOCK_AUTH = os.getenv("USE_MOCK_AUTH", "false").lower() == "true"
    USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true").lower() == "true"  # Default to true until valid API keys provided

config = Config()
