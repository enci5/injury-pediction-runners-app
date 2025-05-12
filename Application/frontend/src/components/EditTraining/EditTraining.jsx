// components/EditTrainingDay.jsx
import { useState, useEffect } from 'react';
import { fetchTrainingDay, updateTrainingDay } from '../../services/trainingService';

export default function EditTrainingDay({ date, onClose, onSaved }) {
  const [form, setForm]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setNotFound(false);

    fetchTrainingDay(date)
      .then(data => setForm(data))
      .catch(e => {
        if (e.message.includes('Day not found')) {
          setNotFound(true);
        } else {
          setError(e.message);
        }
      })
      .finally(() => setLoading(false));
  }, [date]);

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : parseFloat(value),
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await updateTrainingDay(date, form);
      onSaved();
      onClose();
    } catch (e) {
      alert(`Update failed: ${e.message}`);
    }
  };

  if (loading) return <p>Loading…</p>;
  if (notFound) {
    return (
      <div>
        <p>No training record for <strong>{date}</strong>.</p>
        <p>Please add that day via the “Add Data” button on the Home Page.</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }
  if (error) return <p className="error">Error: {error}</p>;

  return (
    <form className="edit-training-form" onSubmit={handleSubmit}>
      <h3>Edit {date}</h3>

      <label>Number of Sessions</label>
      <input
        type="number" name="nr_sessions"
        value={form.nr_sessions} onChange={handleChange}
      />

      <label>Total KM</label>
      <input
        type="number" step="0.01" name="total_km"
        value={form.total_km} onChange={handleChange}
      />

      <label>KM Z3-4</label>
      <input
        type="number" step="0.01" name="km_z3_4"
        value={form.km_z3_4} onChange={handleChange}
      />

      <label>KM Z5-T1-T2</label>
      <input
        type="number" step="0.01" name="km_z5_t1_t2"
        value={form.km_z5_t1_t2} onChange={handleChange}
      />

      <label>KM Sprinting</label>
      <input
        type="number" step="0.01" name="km_sprinting"
        value={form.km_sprinting} onChange={handleChange}
      />

      <label>Strength Training</label>
      <input
        type="checkbox" name="strength_training"
        checked={form.strength_training} onChange={handleChange}
      />

      <label>Hours Alternative</label>
      <input
        type="number" step="0.1" name="hours_alternative"
        value={form.hours_alternative} onChange={handleChange}
      />

      <label>Perceived Exertion (0.0–1.0; –0.01 for rest)</label>
      <input
        type="number" step="0.01" min="-0.01" max="1" name="perceived_exertion"
        value={form.perceived_exertion} onChange={handleChange}
      />

      <label>Perceived Training Success (0.0–1.0; –0.01 for rest)</label>
      <input
        type="number" step="0.01" min="-0.01" max="1" name="perceived_training_success"
        value={form.perceived_training_success} onChange={handleChange}
      />

      <label>Perceived Recovery (0.0–1.0; –0.01 for rest)</label>
      <input
        type="number" step="0.01" min="-0.01" max="1" name="perceived_recovery"
        value={form.perceived_recovery} onChange={handleChange}
      />

      <button type="submit">Save</button>
    </form>
  );
}
