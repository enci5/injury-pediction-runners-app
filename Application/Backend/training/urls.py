from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.training_summary, name='training_summary'),
    path('recent-sessions/', views.get_recent_sessions, name='recent_sessions'),
    path('total-km/', views.get_total_km, name='total_km'),
    path('add/', views.add_training_day, name='add_training_day'),
    path('calendar/', views.calendar, name='calendar'),
    path("physical_load/", views.physical_load, name="physical_load"),
    path("training_quality/", views.training_quality, name="training_quality"),

]
