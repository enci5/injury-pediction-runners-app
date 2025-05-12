// trainingService.js
import {fetchWithAuth} from './fetchWithAuth';

const token = localStorage.getItem("access");
const API_BASE = 'http://localhost:8000/api/training';

export const fetchTrainingDays = async () => {
    try {
        const token = localStorage.getItem("access");
        const res = await fetchWithAuth(`${API_BASE}/calendar/`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.detail || "Failed to fetch training days");
        }

        const data = await res.json();
        // Convert dates to JavaScript Date objects
        return data;
    } catch (error) {
        console.error("Error fetching training days:", error);
        return [];
    }
};

export async function fetchTrainingDay(date) {
  const res = await fetchWithAuth(`${API_BASE}/day/${date}/`, { method: 'GET' });
  if (!res.ok) throw new Error(`Day not found (${res.status})`);
  return await res.json();
}

// Fetch Physical Load Data
export const fetchPhysicalLoad = async () => {
    try {
        const res = await fetchWithAuth(`${API_BASE}/physical_load/`,{ method: 'GET' });
        if (!res.ok) throw new Error("Failed to fetch physical load data");
        return await res.json();
    } catch (error) {
        console.error("Error fetching physical load data:", error);
        return [];
    }
};

// Fetch Training Quality Data
export const fetchTrainingQuality = async () => {
    try {
        const res = await fetchWithAuth("http://localhost:8000/api/training/training_quality/");
        if (!res.ok) throw new Error("Failed to fetch training quality data");
        return await res.json();
    } catch (error) {
        console.error("Error fetching training quality data:", error);
        return [];
    }
};

// Update trainnig day
export async function updateTrainingDay(date, data) {
  const res = await fetchWithAuth(`http://localhost:8000/api/training/day/${date}/`, {
    method: 'PUT',
    headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || 'Update failed');
  }
  return res.json();
}