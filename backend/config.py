import os
from dotenv import load_dotenv

load_dotenv()


def _int_env(name, default):
    raw_value = os.getenv(name)
    if raw_value in (None, ""):
        return default

    try:
        return int(raw_value)
    except (TypeError, ValueError):
        return default


def _float_env(name, default):
    raw_value = os.getenv(name)
    if raw_value in (None, ""):
        return default

    try:
        return float(raw_value)
    except (TypeError, ValueError):
        return default


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
        os.path.dirname(os.path.dirname(__file__)),
        "crisislens-8cb5d-firebase-adminsdk-fbsvc-7f045dabe9.json"
    )
    FIREBASE_PROJECT_ID = "crisislens-8cb5d"
    FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "crisislens-8cb5d.firebasestorage.app")

    # App Settings
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
    EVENT_TARGET_COUNT = _int_env("EVENT_TARGET_COUNT", 200)
    MAX_EVENT_LIMIT = _int_env("MAX_EVENT_LIMIT", 500)
    NEWS_RECENT_WINDOW_DAYS = _int_env("NEWS_RECENT_WINDOW_DAYS", 30)
    NEWS_PRIORITY_WINDOW_DAYS = _int_env("NEWS_PRIORITY_WINDOW_DAYS", 7)
    NEWS_PAGE_SIZE = _int_env("NEWS_PAGE_SIZE", 100)
    NEWS_MAX_PAGES_PER_QUERY = _int_env("NEWS_MAX_PAGES_PER_QUERY", 3)
    NEWS_MAX_RETRIES = _int_env("NEWS_MAX_RETRIES", 3)
    NEWS_BACKOFF_SECONDS = _float_env("NEWS_BACKOFF_SECONDS", 1.25)
    
    # Feature flags
    USE_MOCK_AUTH = os.getenv("USE_MOCK_AUTH", "false").lower() == "true"
    USE_MOCK_DATA = os.getenv("USE_MOCK_DATA", "true").lower() == "true"  # Default to true until valid API keys provided
    ENABLE_TRANSLATIONS = os.getenv("ENABLE_TRANSLATIONS", "false").lower() == "true"  # Translations are slow, disabled by default

config = Config()
