import { useEffect, useState } from 'react';
import StravaAuthButton from '../../components/OAuth/StravaAuthButton'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
    const [stravaConnected, setStravaConnected] = useState(false);
    const navigate = useNavigate();

    // when component mounts, run useEffect which checks for whether or token exists and render home page or redirect to login
    useEffect(()=>{
        const token = localStorage.getItem('access')
        if(!token){
            navigate('/auth')
            return
        }
        const params = new URLSearchParams(location.search);
        if (params.get('strava') === 'connected') {
            setStravaConnected(true)
        navigate('/',{replace:true})
        }
    }, [navigate])

    return (
        <div>
          <h1>Welcome to RunSafe</h1>
          {stravaConnected ? (
            <p>✅ Strava Connected!</p>
          ) : (
            <StravaAuthButton />
          )}
        </div>
      )
}

export default HomePage;