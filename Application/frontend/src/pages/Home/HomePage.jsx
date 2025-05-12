import { useEffect, useState } from 'react'
import { useNavigate }       from 'react-router-dom'
import StravaAuthButton      from '../../components/OAuth/StravaAuthButton'
import AddTrainingDay        from '../../components/AddTraining/AddTraining.jsx'
import CalendarComponent     from '../../components/CalendarComponent/CalendarComponent.jsx'
import EditTraining       from '../../components/EditTraining/EditTraining.jsx'
import PhysicalLoadChart     from '../../components/PhysicalLoadChart/PhysicalLoadChart.jsx'
import TrainingQualityChart  from '../../components/TrainingQuality/TrainingQualityChart.jsx'
import InjuryPrediction      from '../../components/InjuryPrediction/InjuryPrediction.jsx'
import { fetchWithAuth }     from '../../services/fetchWithAuth.js'
import './HomePage.css'

const HomePage = () => {
  const [stravaConnected, setStravaConnected] = useState(false)
  const [dataUpdated, setDataUpdated]         = useState(false)
  const [showAddModal, setShowAddModal]       = useState(false)
  const [editDate, setEditDate]               = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (!token) { navigate('/auth'); return }

    if (localStorage.getItem('stravaConnected') === 'true') {
      setStravaConnected(true)
    }
    const params = new URLSearchParams(location.search)
    if (params.get('strava') === 'connected') {
      localStorage.setItem('stravaConnected','true')
      setStravaConnected(true)
      navigate('/', { replace: true })
    }
  }, [navigate, dataUpdated])

  const fetchSummary = async () => {
    try {
      await fetchWithAuth('http://localhost:8000/api/training/summary/', { method: 'GET' })
      setDataUpdated(u => !u)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-grid">
        <div className="dashboard-card large">
          <PhysicalLoadChart dataUpdated={dataUpdated}/>
        </div>

        <div className="dashboard-card">
          <h2>Training Calendar</h2>
          <CalendarComponent
            dataUpdated={dataUpdated}
            onDateSelect={date => {
            const y = date.getFullYear()
            const m = String(date.getMonth() + 1).padStart(2, '0')
            const d = String(date.getDate()       ).padStart(2, '0')
            setEditDate(`${y}-${m}-${d}`)
            }}
          />
        </div>

        <div className="dashboard-card large">
          <TrainingQualityChart dataUpdated={dataUpdated}/>
        </div>

        <div className="dashboard-card">
          <h2>Injury Risk Visualisation</h2>
          <InjuryPrediction/>
        </div>

        <div className="dashboard-actions">
          {stravaConnected ? (
            <>
              <button className="action-button" onClick={fetchSummary}>
                Sync training data
              </button>
              <button className="action-button" onClick={()=>setShowAddModal(true)}>
                Add Data
              </button>
            </>
          ) : (
            <StravaAuthButton className="action-button connect"/>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="modal-backdrop" onClick={()=>setShowAddModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <AddTrainingDay
              onClose={()=>{
                setShowAddModal(false)
                setDataUpdated(u=>!u)
              }}
            />
          </div>
        </div>
      )}

      {editDate && (
        <div className="modal-backdrop" onClick={()=>setEditDate(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <EditTraining
              date={editDate}
              onClose={()=>setEditDate(null)}
              onSaved={()=>setDataUpdated(u=>!u)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage
