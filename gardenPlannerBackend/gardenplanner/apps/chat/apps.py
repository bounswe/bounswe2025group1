from django.apps import AppConfig


class ChatConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chat'
    
    def ready(self):
        """
        Initialize Firebase when the Django app starts.
        """
        from .firebase_config import initialize_firebase
        initialize_firebase()
