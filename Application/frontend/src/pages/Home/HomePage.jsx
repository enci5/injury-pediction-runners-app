import { useEffect, useState } from 'react';
import StravaAuthButton from '../../components/OAuth/StravaAuthButton';
import { useNavigate } from 'react-router-dom';
import AddTrainingDay from '../../components/AddTraining/AddTraining.jsx';
import CalendarComponentComponent from '../../components/CalendarComponent/CalendarComponent.jsx';
import TrainingQualityChart from '../../components/TrainingQuality/TrainingQualityChart.jsx';
import './HomePage.css';
import PhysicalLoadChart from '../../components/PhysicalLoadChart/PhysicalLoadChart.jsx';
import InjuryPrediction from '../../components/InjuryPrediction/InjuryPrediction.jsx';
import { fetchWithAuth } from '../../services/fetchWithAuth.js';

const HomePage = () => {
    const [stravaConnected, setStravaConnected] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [dataUpdated, setDataUpdated] = useState(false);

    // States for fetch training summary
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    const navigate = useNavigate();

    // Check auth & strava connection
    useEffect(() => {
        const token = localStorage.getItem('access');
        if (!token) {
            navigate('/auth');
            return;
        }
        // Check Strava connection
        const params = new URLSearchParams(location.search);
        if (params.get('strava') === 'connected') {
            setStravaConnected(true);
            localStorage.setItem('stravaConnected', 'true');  // Save the connection state
            navigate('/', { replace: true });
        }

        // Restore Strava connection on page refresh
        if (localStorage.getItem('stravaConnected') === 'true') {
            setStravaConnected(true);
        }
    }, [navigate, dataUpdated, stravaConnected]);

    // Fetch training summary from the Django endpoint
    const fetchSummary = async () => {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("access");
        try {
            const res = await fetchWithAuth('http://localhost:8000/api/training/summary/', {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!res.ok) throw new Error(`Status ${res.status}`);
            const json = await res.json();
            setData(json);
            setDataUpdated(prev => !prev);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);

return (
    <div className="dashboard-container">
        <div className="dashboard-grid">
            <div className="dashboard-card activity">
                <h2>Last Week's Activity</h2>
                <PhysicalLoadChart dataUpdated={dataUpdated}/> 
            </div>

            <div className="dashboard-card calendar">
                <h2>Training Calendar</h2>
                <CalendarComponentComponent dataUpdated={dataUpdated}/>
            </div>

            <div className="dashboard-card quality">
                <h2>Training Quality</h2>
                <TrainingQualityChart dataUpdated={dataUpdated}/>
            </div>

            <div className="dashboard-card injury">
                <h2>Injury Risk Visualization</h2>
                <InjuryPrediction />
            </div>

            <div className="dashboard-actions">
                {stravaConnected ? (
                    <>
                        <button 
                            className="action-button" 
                            onClick={fetchSummary} 
                            disabled={loading}
                        >
                            {loading ? 'Loading…' : 'Sync training data'}
                        </button>

                        {error && <p className="error-text">Error: {error}</p>}
                        {data && <pre className="json-output">{JSON.stringify(data, null, 2)}</pre>}
                    </>
                ) : (
                    <StravaAuthButton className='action-button connect'/>
                )}
                
                <button className="action-button" onClick={handleOpenModal}>Add Data</button>
            </div>
        </div>

        {showModal && (
            <div className="modal-backdrop" onClick={handleCloseModal}>
                <div className="modal" onClick={(e) => e.stopPropagation()}>
                    <AddTrainingDay 
                        onClose={() => {
                            handleCloseModal();
                            setDataUpdated(prev => !prev);
                        }}  
                    />
                </div>
            </div>
        )}
    </div>
);
};

export default HomePage;
