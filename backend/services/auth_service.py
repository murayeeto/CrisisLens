from config import config
from models import AuthUser
from utils.logger import logger

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
        In production, this would verify with Firebase.
        """
        if config.USE_MOCK_AUTH:
            logger.info("Using mock auth mode")
            return MOCK_USER
        
        try:
            # TODO: Implement real Firebase verification
            # This is a stub for the hackathon
            logger.warning("Real Firebase auth not yet implemented")
            return MOCK_USER
        
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
