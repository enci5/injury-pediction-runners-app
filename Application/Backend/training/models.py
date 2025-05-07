from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class TrainingDay(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date = models.DateField()
    nr_sessions = models.IntegerField(default=0)
    total_km = models.FloatField(default=0.0)
    km_z3_4 = models.FloatField(default=0.0)
    km_z5_t1_t2 = models.FloatField(default=0.0)
    km_sprinting = models.FloatField(default=0.0)
    strength_training = models.BooleanField(default=False)
    hours_alternative = models.FloatField(default=0.0)
    perceived_exertion = models.FloatField(default=-0.01)
    perceived_training_success = models.FloatField(default=-0.01)
    perceived_recovery = models.FloatField(default=-0.01)

    def __str__(self):
        return f"{self.user.username} - {self.date}"

    class Meta:
        unique_together = ('user', 'date')
        ordering = ['-date']
