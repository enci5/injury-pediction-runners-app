import { refreshToken } from '../../utils/refreshToken';

const STRAVA_CLIENT_ID = '158117';
const REDIRECT_URI = 'http://localhost:8000/api/strava/callback/';
const SCOPE = 'read,activity:read';

const StravaAuthButton = () => {
  const handleClick = async () => {
    let token = localStorage.getItem('access');

    // Try a protected ping to see if token is still valid
    const res = await fetch('http://localhost:8000/api/auth/verify/', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (res.status === 401) {
      token = await refreshToken();  // RefreshToken util handles storage
    }

    if (!token) {
      alert("Could not authenticate. Please log in again.");
      return;
    }

    // Construct the Strava auth URL
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=auto&scope=${SCOPE}&state=${token}`;
    
    window.location.href = authUrl;
  };

  return <button onClick={handleClick}>Connect with Strava</button>;
};

export default StravaAuthButton;