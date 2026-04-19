import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # API Keys
    NEWS_API_KEY = os.getenv("NEWS_API_KEY", "")
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    MAPS_API_KEY = os.getenv("MAPS_API_KEY", "")  # Google Maps or Mapbox
    FIREBASE_API_KEY = os.getenv("FIREBASE_API_KEY", "")
    STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
    STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY", "")
    STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
    APP_BASE_URL = os.getenv("APP_BASE_URL", "http://localhost:5173")
    RELIEF_REVIEWER_EMAILS = [
        email.strip().lower()
        for email in os.getenv("RELIEF_REVIEWER_EMAILS", "").split(",")
        if email.strip()
    ]

    # Firebase Admin SDK
    FIREBASE_CREDENTIALS_PATH = os.path.join(
        os.path.dirname(__file__),
        "crisislens-8cb5d-firebase-adminsdk-fbsvc-7f045dabe9.json"
    )
    FIREBASE_PROJECT_ID = "crisislens-8cb5d"
    FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "crisislens-8cb5d.firebasestorage.app")

    # App Settings
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    
    # Feature flags
    USE_MOCK_AUTH = os.getenv("USE_MOCK_AUTH", "false").lower() == "true"
    USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true").lower() == "true"  # Default to true until valid API keys provided

config = Config()
