from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/predict/', include('prediction.urls')),
    path('api/auth/', include('authentication.urls')),
    path('api/strava/', include('oauth.urls'))
]

