from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class StravaProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    strava_id = models.CharField(max_length=64, unique=True)
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expires_at = models.BigIntegerField()  # UNIX timestamp
    firstname = models.CharField(max_length=100, blank=True)
    lastname = models.CharField(max_length=100, blank=True)
    profile_image = models.URLField(blank=True)

    def __str__(self):
        return f"StravaProfile({self.firstname} {self.lastname})"