import { useEffect } from 'react';
import {logout} from '../../services/authService'
import { useNavigate } from 'react-router-dom'

const HomePage = () => {
    const navigate = useNavigate();

    // when component mounts, run useEffect which checks for whether or token exists and render home page or redirect to login
    useEffect(()=>{
        const token = localStorage.getItem('access')
        if(!token){
            navigate('/auth')
        }
    }, [navigate])

    return( 
    <div>
        <h1>Logged IN!!!</h1>
        <button onClick={()=>logout(navigate)}>Logout</button>
    </div>
    )
}

export default HomePage;