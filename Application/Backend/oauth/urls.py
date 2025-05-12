from django.urls import path
from .views import  strava_callback

urlpatterns = [
    path('callback/', strava_callback),
]