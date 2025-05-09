from django.contrib import admin
from .models import StravaProfile

@admin.register(StravaProfile)
class StravaProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'strava_id', 'firstname', 'lastname']
    search_fields = ['user__username', 'strava_id']
