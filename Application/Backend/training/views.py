import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from django.utils.timezone import now, timedelta
from .models import TrainingDay
from django.contrib.auth.decorators import login_required
from rest_framework.response import Response
from django.http import JsonResponse
import requests
from django.utils import timezone
from collections import defaultdict

HR_ZONES = {
    1: 0.60,
    2: 0.70,
    3: 0.80,
    4: 0.90,
    5: 1.00,
}

def hr_zone_for(hr, max_hr):
    """Return the zone index (1–5) for a given heart‐rate and max_hr."""
    if not max_hr or hr <= 0:
        return 1
    pct = hr / max_hr
    for zone, cutoff in HR_ZONES.items():
        if pct <= cutoff:
            return zone
    return 5

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
    # Should have the user's Strava token saved
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


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_summary(request):
    profile = request.user.stravaprofile
    max_hr  = getattr(profile, 'max_heartrate', 200)

    token   = profile.access_token
    after   = int((now() - timedelta(days=7)).timestamp())
    hdrs    = {'Authorization': f'Bearer {token}'}
    params  = {'after': after, 'per_page': 200}

    activities = requests.get(
        'https://www.strava.com/api/v3/athlete/activities',
        headers=hdrs, params=params
    ).json()

    daily = defaultdict(lambda: {
        'nr_sessions':       0,
        'total_km':          0.0,
        'km_z3_4':           0.0,
        'km_z5_t1_t2':       0.0,
        'km_sprinting':      0.0,
        'strength_training': False,
        'hours_alternative': 0.0,
    })

    for act in activities:
        day = act['start_date_local'][:10]
        d   = daily[day]

        if act['type'] in ("WeightTraining","Workout","Crossfit"):
            d['strength_training'] = True
            continue
        if act['type'] not in ("Run","Ride","Swim"):
            d['hours_alternative'] += act['moving_time'] / 3600.0
            continue

        if act['type'] == "Run":
            d['nr_sessions'] += 1
            d['total_km']    += act['distance'] / 1000.0

            # --- 1) Try HR‐stream bucketing
            st = requests.get(
                f'https://www.strava.com/api/v3/activities/{act["id"]}/streams',
                headers=hdrs,
                params={'keys': 'heartrate,distance', 'key_by_type': 'true'}
            ).json()
            hr_data   = st.get('heartrate', {}).get('data', [])
            dist_data = st.get('distance',  {}).get('data', [])

            used_hr = False
            if len(hr_data)==len(dist_data)>=2:
                used_hr = True
                for i in range(1, len(dist_data)):
                    dk = (dist_data[i] - dist_data[i-1]) / 1000.0
                    z  = hr_zone_for(hr_data[i] or 0, max_hr)
                    if z in (3,4):
                        d['km_z3_4']     += dk
                    if z >= 5:
                        d['km_z5_t1_t2'] += dk
                        d['km_sprinting']+= dk

            # --- 2) FALLBACK to lap‐based pacezones if HR gave nothing
            if not used_hr or (d['km_z3_4']==0 and d['km_z5_t1_t2']==0 and d['km_sprinting']==0):
                laps = requests.get(
                    f'https://www.strava.com/api/v3/activities/{act["id"]}/laps',
                    headers=hdrs
                ).json()
                pzs  = [lap.get('pace_zone',0) for lap in laps]
                top = max(pzs) if pzs else 0
                for lap in laps:
                    km = lap['distance'] / 1000.0
                    pz = lap.get('pace_zone',0)
                    if pz in (3,4):        d['km_z3_4']      += km
                    if pz >= 5:            d['km_z5_t1_t2']  += km
                    if pz == top:          d['km_sprinting'] += km

    # Persist to DB
    for date_str, m in daily.items():
        TrainingDay.objects.update_or_create(
            user=request.user,
            date=date_str,
            defaults={
                'nr_sessions':       m['nr_sessions'],
                'total_km':          round(m['total_km'], 2),
                'km_z3_4':           round(m['km_z3_4'], 2),
                'km_z5_t1_t2':       round(m['km_z5_t1_t2'], 2),
                'km_sprinting':      round(m['km_sprinting'], 2),
                'strength_training': m['strength_training'],
                'hours_alternative': round(m['hours_alternative'], 2),
            }
        )

    # Return the last 7 days
    seven_days_ago = now().date() - timedelta(days=7)
    qs = TrainingDay.objects.filter(
        user=request.user,
        date__gte=seven_days_ago
    ).order_by('-date').values(
        'date','nr_sessions','total_km',
        'km_z3_4','km_z5_t1_t2','km_sprinting',
        'strength_training','hours_alternative'
    )
    return Response(list(qs))


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