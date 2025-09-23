from django.contrib import admin
from .models import Profile, Garden, GardenMembership, CustomTaskType, Task

# Register your models here.
admin.site.register(Profile)
admin.site.register(Garden)
admin.site.register(GardenMembership)
admin.site.register(CustomTaskType)
admin.site.register(Task)
