from config import config
from models import AuthUser
from utils.logger import logger
from firebase_admin import auth as firebase_auth

# Mock user for testing
MOCK_USER = AuthUser(
    user_id="test-user-123",
    email="test@example.com",
    display_name="Test User"
)

class AuthService:
    @staticmethod
    def verify_token(token: str) -> AuthUser:
        """
        Verify Firebase token or mock token.
        """
        if config.USE_MOCK_AUTH:
            logger.info("Using mock auth mode")
            return MOCK_USER
        
        try:
            from services.firebase_service import firebase_service
            
            decoded_token = firebase_service.verify_id_token(token)
            
            if not decoded_token:
                logger.error("Token verification failed")
                return None
            
            user = AuthUser(
                user_id=decoded_token.get('uid'),
                email=decoded_token.get('email', ''),
                display_name=decoded_token.get('name', '')
            )
            
            return user
        
        except Exception as e:
            logger.error(f"Auth verification error: {e}")
            return None
    
    @staticmethod
    def get_current_user(authorization_header: str = None) -> AuthUser:
        """Get current user from authorization header."""
        if config.USE_MOCK_AUTH:
            return MOCK_USER
        
        if not authorization_header:
            return None
        
        try:
            token = authorization_header.replace("Bearer ", "")
            return AuthService.verify_token(token)
        except Exception as e:
            logger.error(f"Error extracting user from header: {e}")
            return None

auth_service = AuthService()
