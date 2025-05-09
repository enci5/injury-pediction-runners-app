import { useEffect, useState } from 'react';
import StravaAuthButton from '../../components/OAuth/StravaAuthButton'
import { useNavigate } from 'react-router-dom'
import AddTrainingDay from '../../components/AddTraining/AddTraining.jsx'
import CalendarComponentComponent from '../../components/CalendarComponent/CalendarComponent.jsx';
import TrainingQualityChart from '../../components/TrainingQuality/TrainingQualityChart.jsx';
import './HomePage.css'
import PhysicalLoadChart from '../../components/PhysicalLoadChart/PhysicalLoadChart.jsx';
import InjuryPrediction from '../../components/InjuryPrediction/InjuryPrediction.jsx';

const HomePage = () => {
    const [stravaConnected, setStravaConnected] = useState(false);
    const [showModal, setShowModal] = useState(false);

    const handleOpenModal = () => setShowModal(true);
    const handleCloseModal = () => setShowModal(false);
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
      <div className="dashboard-container">
          <div className="dashboard-grid">
              <div className="dashboard-card large">
                  <h2>Last Week's Activity</h2>
                  <PhysicalLoadChart /> 
              </div>

              <div className="dashboard-card">
                  <h2>Training Calendar</h2>
                  <CalendarComponentComponent />
              </div>

              <div className="dashboard-card large">
                  <h2>Training Quality</h2>
                  <TrainingQualityChart />
              </div>

              <div className="dashboard-card">
                  <h2>Injury Risk Visualization</h2>
                  <InjuryPrediction />
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
                      <AddTrainingDay onClose={handleCloseModal} />
                  </div>
              </div>
          )}
      </div>
  );
};

export default HomePage;