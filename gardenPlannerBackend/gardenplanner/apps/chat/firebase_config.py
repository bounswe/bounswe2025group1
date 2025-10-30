import firebase_admin
from firebase_admin import credentials, firestore
import os
from django.conf import settings

# Global variable to store the Firebase app instance
_firebase_app = None
_firestore_client = None


def initialize_firebase():
    """
    Initialize Firebase Admin SDK with service account credentials.
    This should be called once during Django app startup.
    """
    global _firebase_app, _firestore_client
    
    if _firebase_app is not None:
        return _firebase_app
    
    try:
        # Get the path to service account key from environment variable
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_KEY')
        
        if not service_account_path:
            print("Warning: FIREBASE_SERVICE_ACCOUNT_KEY not set. Firebase features will be disabled.")
            return None
        
        if not os.path.exists(service_account_path):
            print(f"Warning: Firebase service account key file not found at {service_account_path}")
            return None
        
        # Initialize Firebase Admin SDK
        cred = credentials.Certificate(service_account_path)
        _firebase_app = firebase_admin.initialize_app(cred)
        _firestore_client = firestore.client()
        
        print("Firebase Admin SDK initialized successfully")
        return _firebase_app
    
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        return None


def get_firebase_app():
    """Get the initialized Firebase app instance."""
    global _firebase_app
    if _firebase_app is None:
        initialize_firebase()
    return _firebase_app


def get_firestore_client():
    """Get the Firestore client instance."""
    global _firestore_client
    if _firestore_client is None:
        initialize_firebase()
    return _firestore_client



