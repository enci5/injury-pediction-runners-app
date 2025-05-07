// utils/refreshToken.js

export const refreshToken = async () => {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return null;
  
    try {
      const res = await fetch("http://localhost:8000/api/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
  
      if (!res.ok) {
        throw new Error("Refresh failed");
      }
  
      const data = await res.json();
      localStorage.setItem("access", data.access); // update access token
      return data.access;
    } catch (err) {
      console.error("Token refresh error:", err);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      return null;
    }
  };
  