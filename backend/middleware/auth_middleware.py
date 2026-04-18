from functools import wraps
from flask import request, jsonify
from services.firebase_service import firebase_service
from utils.logger import logger

def require_auth(f):
    """Decorator to require Firebase authentication."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header:
            return jsonify({'error': 'Missing authorization header'}), 401
        
        try:
            token = auth_header.replace('Bearer ', '')
            decoded_token = firebase_service.verify_id_token(token)
            
            if not decoded_token:
                return jsonify({'error': 'Invalid or expired token'}), 401
            
            # Store user info in request context
            request.user = {
                'uid': decoded_token['uid'],
                'email': decoded_token.get('email', ''),
            }
            
            return f(*args, **kwargs)
        
        except Exception as e:
            logger.error(f"Auth middleware error: {e}")
            return jsonify({'error': 'Authentication failed'}), 401
    
    return decorated_function
