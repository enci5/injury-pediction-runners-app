from django.shortcuts import redirect
import requests
from django.conf import settings
from django.http import HttpResponse, JsonResponse, HttpResponseBadRequest
from django.utils.timezone import now, timedelta
from .models import StravaProfile
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.exceptions import AuthenticationFailed

def strava_callback(request):
    jwt_token = request.GET.get('state')
    if not jwt_token:
        return HttpResponseBadRequest("Missing token in state")

    jwt_auth = JWTAuthentication()

    # Manually build an auth header from the token
    request.META['HTTP_AUTHORIZATION'] = f'Bearer {jwt_token}'

    try:
        user_auth_tuple = jwt_auth.authenticate(request)
        if user_auth_tuple is None:
            raise AuthenticationFailed("Token invalid or expired")
        request.user, _ = user_auth_tuple
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=401)
    
    code = request.GET.get('code')  

    if not code:
        return HttpResponseBadRequest("Missing authorization code")
    # Exchange code for token
    response = requests.post("https://www.strava.com/oauth/token", data={
        'client_id': settings.STRAVA_CLIENT_ID,
        'client_secret': settings.STRAVA_CLIENT_SECRET,
        'code': code,
        'grant_type': 'authorization_code'
    })

    token_data = response.json()

    if 'access_token' not in token_data:
        return JsonResponse({'error': 'Failed to retrieve token'}, status=400)

    # Get user & token info
    user = request.user
    access_token = token_data['access_token']
    refresh_token = token_data['refresh_token']
    expires_at = token_data['expires_at']
    athlete = token_data['athlete']

    # Save to StravaProfile model
    StravaProfile.objects.update_or_create(
        user=user,
        defaults={
            'strava_id': athlete['id'],
            'access_token': access_token,
            'refresh_token': refresh_token,
            'token_expires_at': expires_at,
            'firstname': athlete.get('firstname', ''),
            'lastname': athlete.get('lastname', ''),
            'profile_image': athlete.get('profile', ''),
        }
    )

    return redirect('http://localhost:5173/?strava=connected')