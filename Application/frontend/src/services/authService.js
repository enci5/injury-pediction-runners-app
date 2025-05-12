// src/services/authService.js
export const loginUser = async ({ username, password }) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if(!res.ok){
        return {
          success: false,
          message: data.detail || "Login failed",
          data,
        };
      }
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);  
      return { success: res.ok, data };

    } catch (err) {
      return { success: false, data: { message: 'Network error' } };
    }
  };
  
  export const signupUser = async ({username, email, password }) => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/register/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({username, email, password }),
      });
      const data = await res.json();
      return { success: res.ok, data };
    } catch (err) {
      return { success: false, data: { message: 'Network error' } };
    }
  };
  
  export const logout = (navigate)=>{
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('stravaConnected')
    navigate('/auth')
  }