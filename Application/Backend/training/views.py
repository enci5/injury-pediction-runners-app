import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now, timedelta
from .models import TrainingDay
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
import requests
from django.utils import timezone
from collections import defaultdict

def get_total_km(request):
    access_token = request.user.stravaprofile.access_token
    after = int((now() - timedelta(days=7)).timestamp())
    url = 'https://www.strava.com/api/v3/athlete/activities'
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'after': after, 'per_page': 200}

    response = requests.get(url, headers=headers, params=params)
    activities = response.json()

    # Sum total distance for all runs
    total_distance = sum(a['distance'] for a in activities if a['type'] == 'Run')

    # Convert meters to kilometers
    total_km = round(total_distance / 1000, 2)

    return JsonResponse({'total_km': total_km})

def get_recent_sessions(request):
    # You should have the user's Strava token saved
    access_token = request.user.stravaprofile.access_token
    after = int((now() - timedelta(days=7)).timestamp())
    url = 'https://www.strava.com/api/v3/athlete/activities'
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'after': after, 'per_page': 200}  # Fetch up to 200 activities

    response = requests.get(url, headers=headers, params=params)
    activities = response.json()

    # Count only "Run" activities
    sessions_count = len([a for a in activities if a['type'] == 'Run'])

    return JsonResponse({'nr_sessions': sessions_count})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_training_summary(request):
    # 1. Pull the recent activities
    access_token = request.user.stravaprofile.access_token
    after = int((now() - timedelta(days=7)).timestamp())
    url = 'https://www.strava.com/api/v3/athlete/activities'
    headers = {'Authorization': f'Bearer {access_token}'}
    params = {'after': after, 'per_page': 200}

    resp = requests.get(url, headers=headers, params=params)
    activities = resp.json()

    # 2. bucket runs by local date
    daily = defaultdict(lambda: {
        'nr_sessions':   0,
        'total_km':      0.0,
        'km_z3_4':       0.0,
        'km_z5_t1_t2':   0.0,
        'km_sprinting':  0.0,
        'strength_training': False,
        'hours_alternative': 0.0,
    })

    for act in activities:
        # iso-date string “YYYY-MM-DD”
        day = act['start_date_local'][:10]
        d = daily[day]

        # Check if this is a strength training activity
        if act['type'] in ("WeightTraining", "Workout", "Crossfit"):
            d['strength_training'] = True
            continue  # don't count as a run

        # Check for alternative training (non-run, non-ride, non-swim)
        if act['type'] not in ("Run", "Ride", "Swim"):
            d['hours_alternative'] += act['moving_time'] / 3600.0
            continue  # don't count as a run

        # If this is a run, count it
        if act.get('type') == 'Run':
            d['nr_sessions']  += 1
            d['total_km']     += act['distance'] / 1000.0

            # 3. fetch laps to get pace_zones
            laps_url = f'https://www.strava.com/api/v3/activities/{act["id"]}/laps'
            laps = requests.get(laps_url, headers=headers).json()

            # find this run’s top pace-zone for “sprinting”
            zones = [lap.get('pace_zone', 0) for lap in laps if lap.get('pace_zone') is not None]
            top_zone = max(zones) if zones else 0

            for lap in laps:
                dist_km = lap['distance'] / 1000.0
                pz = lap.get('pace_zone', 0)

                if pz in (3, 4):
                    d['km_z3_4'] += dist_km
                if pz >= 5:
                    d['km_z5_t1_t2'] += dist_km
                if pz == top_zone:
                    d['km_sprinting'] += dist_km

    # 4. write out one TrainingDay per date
    for date_str, metrics in daily.items():
        TrainingDay.objects.update_or_create(
            user=request.user,
            date=date_str,
            defaults=metrics
        )

    return JsonResponse({
        'message': 'Training summaries updated',
        'days_processed': len(daily)
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_training_day(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        
        TrainingDay.objects.update_or_create(
            user=request.user,
            date=data['date'],
            defaults={
                'nr_sessions': data.get('nr_sessions', 0),
                'total_km': data.get('total_km', 0.0),
                'km_z3_4': data.get('km_z3_4', 0.0),
                'km_z5_t1_t2': data.get('km_z5_t1_t2', 0.0),
                'km_sprinting': data.get('km_sprinting', 0.0),
                'strength_training': data.get('strength_training', False),
                'hours_alternative': data.get('hours_alternative', 0.0),
                'perceived_exertion': data.get('perceived_exertion', -0.01),
                'perceived_training_success': data.get('perceived_training_success', -0.01),
                'perceived_recovery': data.get('perceived_recovery', -0.01),
            }
        )

        return JsonResponse({'message': 'Training day added successfully'})

    return JsonResponse({'error': 'Invalid method'}, status=405)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def calendar(request):
    if request.method == 'GET':

        training_days = list(TrainingDay.objects.values('date', 'nr_sessions'))
        return JsonResponse(training_days, safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def physical_load(request):
    today = timezone.now().date()
    last_week = today - timedelta(days=7)

    # Fetch data for the last 7 days
    training_days = TrainingDay.objects.filter(date__range=(last_week, today)).values(
        'date', 'total_km', 'km_z3_4', 'km_z5_t1_t2', 'km_sprinting', 'nr_sessions'
    )

    # Convert QuerySet to list
    data = list(training_days)
    return JsonResponse(data, safe=False)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_quality(request):
    today = timezone.now().date()
    last_week = today - timedelta(days=7)

    # Fetch data for the last 7 days
    training_days = TrainingDay.objects.filter(date__range=(last_week, today)).values(
        'date', 'perceived_exertion', 'perceived_training_success', 'perceived_recovery'
    )

    # Convert QuerySet to list
    data = list(training_days)
    return JsonResponse(data, safe=False)