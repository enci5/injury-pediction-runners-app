from django.urls import path
from . import views

urlpatterns = [
    path('summary/', views.training_summary, name='training_summary'),
    path('add/', views.add_training_day, name='add_training_day'),
    path('calendar/', views.calendar, name='calendar'),
    path('physical_load/', views.physical_load, name='physical_load'),
    path('training_quality/', views.training_quality, name='training_quality'),
    path('day/<str:date_str>/', views.training_day_detail, name='training-day-detail'),
]
