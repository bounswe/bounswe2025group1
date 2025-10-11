from django.apps import AppConfig


class GardenConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'garden'
    verbose_name = 'Garden Planner'

    def ready(self):
        import garden.signals # Import signals to ensure they are registered