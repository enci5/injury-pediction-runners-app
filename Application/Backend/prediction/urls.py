from django.urls import path
from .views import predict_injury

urlpatterns = [
    path('', predict_injury),
]
