from django.apps import AppConfig


class GardenConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'gardenplanner.apps.garden'
    verbose_name = 'Garden Planner'

    def ready(self):
        from . import signals # Import signals to ensure they are registered