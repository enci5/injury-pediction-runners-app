from django.contrib import admin
from .models import TrainingDay

@admin.register(TrainingDay)
class TrainingDayAdmin(admin.ModelAdmin):
    list_display = (
        'user', 
        'date', 
        'total_km', 
        'nr_sessions', 
        'km_z3_4', 
        'km_z5_t1_t2', 
        'km_sprinting', 
        'strength_training', 
        'hours_alternative', 
        'perceived_exertion', 
        'perceived_training_success', 
        'perceived_recovery'
    )
    list_filter = ['user', 'date']
    search_fields = ['user__username', 'date']
