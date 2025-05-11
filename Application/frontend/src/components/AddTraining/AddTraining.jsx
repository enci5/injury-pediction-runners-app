import { useState } from 'react';
import { fetchWithAuth } from '../../services/fetchWithAuth';
import './AddTraining.css';

const AddTrainingDay = ({ onClose }) => {
    const [formData, setFormData] = useState({
    date: '',
    nr_sessions: 0,
    total_km: 0,
    km_z3_4: 0,
    km_z5_t1_t2: 0,
    km_sprinting: 0,
    strength_training: false,
    hours_alternative: 0,
    perceived_exertion: -0.01,
    perceived_training_success: -0.01,
    perceived_recovery: -0.01,
    });

    const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
        ...formData,
        [name]: type === 'checkbox' ? checked : value,
    });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if the date is in the future
        const today = new Date().toISOString().split("T")[0];
        if (formData.date > today) {
            alert("Date cannot be in the future!");
            return;
        }

        try {
            const res = await fetchWithAuth('http://localhost:8000/api/training/add/', {
                method: 'POST',
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                alert("Training day added successfully!");
                setFormData({
                    date: '',
                    nr_sessions: 0,
                    total_km: 0,
                    km_z3_4: 0,
                    km_z5_t1_t2: 0,
                    km_sprinting: 0,
                    strength_training: false,
                    hours_alternative: 0,
                    perceived_exertion: -0.01,
                    perceived_training_success: -0.01,
                    perceived_recovery: -0.01,
                });
                onClose();
            } else {
                const errorData = await res.json();
                alert(`Failed to add training day: ${errorData.detail || 'Unknown error'}`);
            }
        } catch (err) {
            console.error("Network error:", err);
            alert("Failed to add training day. Please try again later.");
        }
    };

return (
    <>
        <div className="modal-header">
            <h2 className="modal-title">Add Training</h2>
        </div>

        <form className="add-training-form" onSubmit={handleSubmit}>
            <label>Date</label>
            <input type="date" name="date" value={formData.date} onChange={handleChange} required max={new Date().toISOString().split("T")[0]} />

            <label>Number of Sessions</label>
            <input type="number" name="nr_sessions" value={formData.nr_sessions} onChange={handleChange} />

            <label>Total KM</label>
            <input type="number" name="total_km" value={formData.total_km} onChange={handleChange} />

            <label>KM Z3-4</label>
            <input type="number" name="km_z3_4" value={formData.km_z3_4} onChange={handleChange} />

            <label>KM Z5-T1-T2</label>
            <input type="number" name="km_z5_t1_t2" value={formData.km_z5_t1_t2} onChange={handleChange} />

            <label>KM Sprinting</label>
            <input type="number" name="km_sprinting" value={formData.km_sprinting} onChange={handleChange} />

            <label>Hours Alternative</label>
            <input type="number" name="hours_alternative" value={formData.hours_alternative} onChange={handleChange} />

            <label>Perceived Exertion</label>
            <input type="number" name="perceived_exertion" value={formData.perceived_exertion} onChange={handleChange} />

            <label>Perceived Training Success</label>
            <input type="number" name="perceived_training_success" value={formData.perceived_training_success} onChange={handleChange} />

            <label>Perceived Recovery</label>
            <input type="number" name="perceived_recovery" value={formData.perceived_recovery} onChange={handleChange} />

            <div className="checkbox-container">
                <label>Strength Training</label>
                <input type="checkbox" name="strength_training" checked={formData.strength_training} onChange={handleChange} />
            </div>

            <button type="submit">Add Training Day</button>
        </form>
    </>
);
};

export default AddTrainingDay;