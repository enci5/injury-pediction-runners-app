// src/services/authService.js

export const loginUser = async ({ email, password }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, data: { message: 'Network error' } };
    }
  };
  
  export const signupUser = async ({ email, password }) => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, data: { message: 'Network error' } };
    }
  };
  