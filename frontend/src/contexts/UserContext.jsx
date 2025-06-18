import { createContext, useState, useEffect } from "react";
import api from "../api";
import { ACCESS_TOKEN } from "../constants";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(
    JSON.parse(localStorage.getItem("user"))?.role || null
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      console.log("UserContext: Initial userRole:", userRole);
      const token = localStorage.getItem(ACCESS_TOKEN);
      console.log("UserContext: ACCESS_TOKEN:", token ? "Present" : "Missing");

      if (!token) {
        console.log("UserContext: No token, setting userRole to null");
        setUserRole(null);
        setLoading(false);
        return;
      }

      if (userRole === undefined || userRole === null) {
        try {
          console.log("UserContext: Fetching user role from /api/users/me/");
          const res = await api.get("/api/users/me/");
          const role = res.data.role;
          console.log("UserContext: Fetched role:", role);

          if (!role) {
            console.warn("UserContext: No role in response, clearing tokens");
            localStorage.removeItem(ACCESS_TOKEN);
            localStorage.removeItem("user");
            setUserRole(null);
          } else {
            const user = JSON.parse(localStorage.getItem("user")) || {};
            localStorage.setItem("user", JSON.stringify({ ...user, role }));
            setUserRole(role);
            console.log(
              "UserContext: Updated userRole and localStorage:",
              role
            );
          }
        } catch (err) {
          console.error("UserContext: Failed to fetch user role:", {
            message: err.message,
            status: err.response?.status,
            data: err.response?.data,
          });
          localStorage.removeItem(ACCESS_TOKEN);
          localStorage.removeItem("user");
          setUserRole(null);
        } finally {
          setLoading(false);
          console.log("UserContext: Loading complete, loading:", false);
        }
      } else {
        console.log(
          "UserContext: userRole already set, skipping fetch:",
          userRole
        );
        setLoading(false);
      }
    };

    fetchUserRole();
  }, []);

  return (
    <UserContext.Provider value={{ userRole, setUserRole, loading }}>
      {children}
    </UserContext.Provider>
  );
};
