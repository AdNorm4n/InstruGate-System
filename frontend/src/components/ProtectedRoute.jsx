import { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";
import { REFRESH_TOKEN, ACCESS_TOKEN } from "../constants";

function ProtectedRoute({ children }) {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = async () => {
      console.log("ProtectedRoute: Starting authentication check...");
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
        console.log("ProtectedRoute: No tokens found, unauthorized");
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
          try {
            const res = await api.post("/api/token/refresh/", { refresh });
            if (!res.data.access) {
              throw new Error("No access token in refresh response");
            }
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            console.log("ProtectedRoute: Token refreshed successfully");
            setIsAuthorized(true);
          } catch (refreshError) {
            console.error("ProtectedRoute: Token refresh failed:", {
              message: refreshError.message,
              response: refreshError.response?.data,
              status: refreshError.response?.status,
            });
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem(REFRESH_TOKEN);
            setIsAuthorized(false);
            return;
          }
        } else {
          console.log("ProtectedRoute: Token valid, authorized");
          setIsAuthorized(true);
        }
      } catch (err) {
        console.error("ProtectedRoute: Token decode error:", {
          message: err.message,
        });
        localStorage.removeItem(ACCESS_TOKEN);
        localStorage.removeItem(REFRESH_TOKEN);
        setIsAuthorized(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthorized === null) {
    console.log("ProtectedRoute: Authentication check pending");
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    console.log("ProtectedRoute: Unauthorized, redirecting to /login");
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;
