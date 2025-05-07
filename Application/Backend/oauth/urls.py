from django.urls import path
from .views import recent_running_distance, strava_callback

urlpatterns = [
    path('callback/', strava_callback),
    path('weekly-distance/', recent_running_distance),
]