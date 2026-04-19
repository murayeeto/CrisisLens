import firebase_admin
from firebase_admin import credentials, auth, firestore
from utils.logger import logger
import os
from config import config

class FirebaseService:
    _db = None
    _initialized = False

    @classmethod
    def initialize(cls):
        """Initialize Firebase Admin SDK."""
        if cls._initialized:
            return
        
        try:
            cred_path = config.FIREBASE_CREDENTIALS_PATH
            
            if not os.path.exists(cred_path):
                raise FileNotFoundError(f"Firebase credentials not found at {cred_path}")
            
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {
                'projectId': config.FIREBASE_PROJECT_ID,
                'storageBucket': config.FIREBASE_STORAGE_BUCKET,
            })
            
            cls._db = firestore.client()
            cls._initialized = True
            logger.info("Firebase Admin SDK initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            raise

    @classmethod
    def verify_id_token(cls, id_token):
        """Verify Firebase ID token."""
        try:
            if not cls._initialized:
                cls.initialize()
            
            decoded_token = auth.verify_id_token(id_token)
            return decoded_token
        
        except auth.InvalidIdTokenError:
            logger.error("Invalid ID token")
            return None
        except auth.ExpiredIdTokenError:
            logger.error("Expired ID token")
            return None
        except Exception as e:
            logger.error(f"Token verification error: {e}")
            return None

    @classmethod
    def get_user_doc(cls, uid):
        """Get user document from Firestore."""
        try:
            if not cls._initialized:
                cls.initialize()
            
            doc = cls._db.collection('users').document(uid).get()
            return doc.to_dict() if doc.exists else None
        
        except Exception as e:
            logger.error(f"Error fetching user document: {e}")
            return None

    @classmethod
    def set_user_doc(cls, uid, data):
        """Create or update user document in Firestore."""
        try:
            if not cls._initialized:
                cls.initialize()
            
            cls._db.collection('users').document(uid).set(data, merge=True)
            return True
        
        except Exception as e:
            logger.error(f"Error setting user document: {e}")
            return False

    @classmethod
    def update_user_doc(cls, uid, updates):
        """Update user document in Firestore."""
        try:
            if not cls._initialized:
                cls.initialize()
            
            cls._db.collection('users').document(uid).set(updates, merge=True)
            return True
        
        except Exception as e:
            logger.error(f"Error updating user document: {e}")
            return False

    @classmethod
    def add_saved_event(cls, uid, event_id):
        """Add event to user's saved events."""
        try:
            if not cls._initialized:
                cls.initialize()
            
            cls._db.collection('users').document(uid).set({
                'savedEvents': firestore.ArrayUnion([event_id])
            }, merge=True)
            return True
        
        except Exception as e:
            logger.error(f"Error adding saved event: {e}")
            return False

    @classmethod
    def remove_saved_event(cls, uid, event_id):
        """Remove event from user's saved events."""
        try:
            if not cls._initialized:
                cls.initialize()
            
            cls._db.collection('users').document(uid).set({
                'savedEvents': firestore.ArrayRemove([event_id])
            }, merge=True)
            return True
        
        except Exception as e:
            logger.error(f"Error removing saved event: {e}")
            return False

    @classmethod
    def get_db(cls):
        """Return the Firestore client."""
        if not cls._initialized:
            cls.initialize()
        return cls._db

    @classmethod
    def get_document(cls, collection_name, document_id):
        """Fetch an arbitrary document by collection and ID."""
        try:
            if not cls._initialized:
                cls.initialize()

            document = cls._db.collection(collection_name).document(document_id).get()
            return document.to_dict() if document.exists else None
        except Exception as e:
            logger.error(f"Error fetching {collection_name}/{document_id}: {e}")
            return None

    @classmethod
    def set_document(cls, collection_name, document_id, data, merge=True):
        """Create or update an arbitrary document."""
        try:
            if not cls._initialized:
                cls.initialize()

            cls._db.collection(collection_name).document(document_id).set(data, merge=merge)
            return True
        except Exception as e:
            logger.error(f"Error setting {collection_name}/{document_id}: {e}")
            return False

    @classmethod
    def list_documents(cls, collection_name, filters=None):
        """List documents from a collection with optional equality filters."""
        try:
            if not cls._initialized:
                cls.initialize()

            query = cls._db.collection(collection_name)
            for field_name, operator, value in filters or []:
                query = query.where(field_name, operator, value)

            snapshot = query.stream()
            return [
                {
                    "id": document.id,
                    **document.to_dict(),
                }
                for document in snapshot
            ]
        except Exception as e:
            logger.error(f"Error listing documents from {collection_name}: {e}")
            return []

firebase_service = FirebaseService()
