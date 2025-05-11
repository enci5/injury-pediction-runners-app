import { useEffect, useState } from 'react';
import StravaAuthButton from '../../components/OAuth/StravaAuthButton'
import { useNavigate } from 'react-router-dom'
import AddTrainingDay from '../../components/AddTraining/AddTraining.jsx'
import CalendarComponentComponent from '../../components/CalendarComponent/CalendarComponent.jsx';
import TrainingQualityChart from '../../components/TrainingQuality/TrainingQualityChart.jsx';
import './HomePage.css'
import PhysicalLoadChart from '../../components/PhysicalLoadChart/PhysicalLoadChart.jsx';
import InjuryPrediction from '../../components/InjuryPrediction/InjuryPrediction.jsx';
import { fetchWithAuth } from '../../services/fetchWithAuth.js';

const HomePage = () => {
    const [stravaConnected, setStravaConnected] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [dataUpdated, setDataUpdated] = useState(false);

    // states for fetch training summary
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState(null);
    const [data,    setData]    = useState(null);

    const navigate = useNavigate();

    // check auth & strava connection
    useEffect(()=>{
        const token = localStorage.getItem('access');
        if(!token){
            navigate('/auth');
            return;
        }
        const params = new URLSearchParams(location.search);
        if (params.get('strava') === 'connected') {
            setStravaConnected(true);
            navigate('/', { replace: true });
        }
    }, [navigate, dataUpdated]);

    // fetch training summary from the Django endpoint
    // TODO: Extract to service
    const fetchSummary = async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("access");
      try {
        const res = await fetchWithAuth('http://localhost:8000/api/training/summary/', {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        setData(json);
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
              <div className="dashboard-card large">
                  <h2>Last Week's Activity</h2>
                  <PhysicalLoadChart dataUpdated={dataUpdated}/> 
              </div>

              <div className="dashboard-card">
                  <h2>Training Calendar</h2>
                  <CalendarComponentComponent />
              </div>

              <div className="dashboard-card large">
                  <h2>Training Quality</h2>
                  <TrainingQualityChart dataUpdated={dataUpdated}/>
              </div>

              <div className="dashboard-card">
                  <h2>Injury Risk Visualization</h2>
                  <InjuryPrediction />
              </div>

              {/* TODO: NEW: Training Summary Card */}
              <div className="dashboard-card large">
                  <h2>Training Summary</h2>
                  <button 
                    className="action-button" 
                    onClick={fetchSummary} 
                    disabled={loading}
                  >
                    {loading ? 'Loading…' : 'Fetch Training Summary'}
                  </button>

                  {error && (
                    <p className="error-text">Error: {error}</p>
                  )}

                  {data && (
                    <pre className="json-output">
                      {JSON.stringify(data, null, 2)}
                    </pre>
                  )}
              </div>

              <div className="dashboard-actions">
                  {stravaConnected ? (
                      <button className="action-button connected">Strava Connected</button>
                  ) : (
                      <StravaAuthButton />
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
                        }}  />
                  </div>
              </div>
          )}
      </div>
    );
};

export default HomePage;
