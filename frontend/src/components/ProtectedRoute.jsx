import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";
import { useState, useEffect } from "react";

function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem(ACCESS_TOKEN);
      const refresh = localStorage.getItem(REFRESH_TOKEN);

      console.log(
        "ProtectedRoute: ACCESS_TOKEN:",
        token ? "Present" : "Missing"
      );
      console.log(
        "ProtectedRoute: REFRESH_TOKEN:",
        refresh ? "Present" : "Missing"
      );

      if (!token || !refresh) {
        console.error("ProtectedRoute: No tokens found in localStorage");
        setIsAuthorized(false);
        return;
      }

      try {
        const decoded = jwtDecode(token);
        const now = Date.now() / 1000;
        console.log(
          "ProtectedRoute: Token expiry:",
          decoded.exp,
          "Current time:",
          now
        );

        if (decoded.exp < now) {
          console.log("ProtectedRoute: Token expired, attempting refresh...");
          const res = await api.post("/api/token/refresh/", { refresh });
          if (!res.data.access) {
            throw new Error("No access token in refresh response");
          }
          localStorage.setItem(ACCESS_TOKEN, res.data.access);
          console.log("ProtectedRoute: Token refreshed successfully");
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error("ProtectedRoute: Auth error:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthorized === null) {
    return <div>Loading...</div>;
  }

  return isAuthorized ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;
