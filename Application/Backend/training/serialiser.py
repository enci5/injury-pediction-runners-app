# training/serializers.py

from rest_framework import serializers
from .models import TrainingDay

class TrainingDaySerialiser(serializers.ModelSerializer):
    class Meta:
        model = TrainingDay
        # Expose all daily metrics (but not the User FK)
        fields = [
            'date',
            'nr_sessions',
            'total_km',
            'km_z3_4',
            'km_z5_t1_t2',
            'km_sprinting',
            'strength_training',
            'hours_alternative',
            'perceived_exertion',
            'perceived_training_success',
            'perceived_recovery',
        ]
        # Take date from the URL on GET/PUT
        read_only_fields = ['date']
