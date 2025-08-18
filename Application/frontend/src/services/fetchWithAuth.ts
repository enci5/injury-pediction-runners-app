// fetchWithAuth.js
export async function fetchWithAuth(url: string, 
    options: RequestInit = {}) {
    let access = localStorage.getItem("access");
  
    let headers = {
      ...options.headers,
      Authorization: `Bearer ${access}`,
      "Content-Type": "application/json",
    };
  
    let res = await fetch(url, { ...options, headers });
  
    if (res.status === 401) {
      try {
        const refresh = localStorage.getItem("refresh");
  
        const refreshRes = await fetch("http://localhost:8000/api/auth/refresh/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
  
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem("access", data.access);
  
          // Retry original request with new token
          headers.Authorization = `Bearer ${data.access}`;
          res = await fetch(url, { ...options, headers });
        } else {
          throw new Error("Refresh token expired");
        }
      } catch (err) {
        console.error("Auto refresh failed", err);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        // Optionally redirect to login
      }
    }
  
    return res;
  }
  