import json
from django.conf import settings
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
from .models import TrainingDay
from .serialiser import TrainingDaySerialiser
from rest_framework import status

from .models import TrainingDay

HR_ZONES = {
    1: 0.60, 2: 0.70, 3: 0.80,
    4: 0.90, 5: 1.00,
}

def hr_zone_for(hr, max_hr):
    if not max_hr or hr <= 0:
        return 1
    pct = hr / max_hr
    for zone, cutoff in HR_ZONES.items():
        if pct <= cutoff:
            return zone
    return 5


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def training_summary(request):
    profile = request.user.stravaprofile
    max_hr  = getattr(profile, 'max_heartrate', 200)

    # 1) ensure we have a fresh access_token
    token = profile.access_token
    def fetch_activities(tok):
        return requests.get(
            'https://www.strava.com/api/v3/athlete/activities',
            headers={'Authorization': f'Bearer {tok}'},
            params={'after': int((now() - timedelta(days=7)).timestamp()), 'per_page': 200}
        )

    resp = fetch_activities(token)

    # 2) if Strava says 401, auto‐refresh
    if resp.status_code == 401 and hasattr(profile, 'refresh_token'):
        refresh_resp = requests.post(
            'https://www.strava.com/oauth/token',
            data={
                'client_id':     settings.STRAVA_CLIENT_ID,
                'client_secret': settings.STRAVA_CLIENT_SECRET,
                'grant_type':    'refresh_token',
                'refresh_token': profile.refresh_token,
            }
        )
        if refresh_resp.status_code == 200:
            tokj = refresh_resp.json()
            # update profile
            profile.access_token  = tokj['access_token']
            profile.refresh_token = tokj['refresh_token']
            profile.expires_at    = now() + timedelta(seconds=tokj['expires_in'])
            profile.save()
            token = tokj['access_token']
            resp = fetch_activities(token)

    # 3) any other non-200 → error out
    if resp.status_code != 200:
        details = {}
        try:
            details = resp.json()
        except ValueError:
            details = resp.text
        return Response({
            'error':  'Strava API request failed',
            'status': resp.status_code,
            'details': details
        }, status=resp.status_code)

    activities = resp.json()

    # 4) aggregate per‐day
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
        t   = act.get('type')

        if t in ("WeightTraining","Workout","Crossfit"):
            d['strength_training'] = True
            continue
        if t not in ("Run","Ride","Swim"):
            d['hours_alternative'] += act.get('moving_time', 0) / 3600.0
            continue

        # running / riding / swimming
        if t == "Run":
            d['nr_sessions'] += 1
            d['total_km']    += act.get('distance', 0) / 1000.0

            # HR‐stream
            st = requests.get(
                f'https://www.strava.com/api/v3/activities/{act["id"]}/streams',
                headers={'Authorization': f'Bearer {token}'},
                params={'keys':'heartrate,distance','key_by_type':'true'}
            ).json()
            hr   = st.get('heartrate', {}).get('data', [])
            dist = st.get('distance',  {}).get('data', [])
            used = False
            if len(hr)==len(dist)>=2:
                used = True
                for i in range(1, len(dist)):
                    dk = (dist[i] - dist[i-1]) / 1000.0
                    z  = hr_zone_for(hr[i] or 0, max_hr)
                    if z in (3,4): d['km_z3_4']     += dk
                    if z >=5:      d['km_z5_t1_t2'] += dk; d['km_sprinting'] += dk

            # fallback to laps
            if not used and not any((d['km_z3_4'],d['km_z5_t1_t2'],d['km_sprinting'])):
                laps = requests.get(
                    f'https://www.strava.com/api/v3/activities/{act["id"]}/laps',
                    headers={'Authorization':f'Bearer {token}'}
                ).json()
                pzs = [lap.get('pace_zone', 0) for lap in laps]
                top = max(pzs) if pzs else 0
                for lap in laps:
                    km = lap.get('distance',0)/1000.0
                    pz = lap.get('pace_zone',0)
                    if pz in (3,4):      d['km_z3_4']     += km
                    if pz >=5:           d['km_z5_t1_t2'] += km
                    if pz == top:        d['km_sprinting']+= km

    # 5) save to DB
    for date_str, m in daily.items():
        TrainingDay.objects.update_or_create(
            user=request.user,
            date=date_str,
            defaults={
                'nr_sessions':       m['nr_sessions'],
                'total_km':          round(m['total_km'],2),
                'km_z3_4':           round(m['km_z3_4'],2),
                'km_z5_t1_t2':       round(m['km_z5_t1_t2'],2),
                'km_sprinting':      round(m['km_sprinting'],2),
                'strength_training': m['strength_training'],
                'hours_alternative': round(m['hours_alternative'],2),
            }
        )

    # 6) return last 7 days
    cutoff = now().date() - timedelta(days=7)
    qs = TrainingDay.objects.filter(
        user=request.user, date__gte=cutoff
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

@api_view(['GET','PUT'])
@permission_classes([IsAuthenticated])
def training_day_detail(request, date_str):
    """
    GET  /api/training/day/2025-05-12/    → returns the TrainingDay for that date
    PUT  /api/training/day/2025-05-12/    → updates it with whatever fields are sent
    """
    try:
        td = TrainingDay.objects.get(user=request.user, date=date_str)
    except TrainingDay.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = TrainingDaySerialiser(td)
        return Response(serializer.data)

    # PUT
    serializer = TrainingDaySerialiser(td, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)