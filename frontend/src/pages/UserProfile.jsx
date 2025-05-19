import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Fade,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/UserProfile.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function UserProfile() {
  const [userData, setUserData] = useState({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    role: "",
  });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  const fetchUserData = async () => {
    try {
      let access = getToken();
      const refresh = getRefreshToken();

      console.log("UserProfile: ACCESS_TOKEN:", access ? "Present" : "Missing");
      console.log(
        "UserProfile: REFRESH_TOKEN:",
        refresh ? "Present" : "Missing"
      );

      if (!access || !refresh) {
        throw new Error("No tokens found in localStorage");
      }

      const decoded = jwtDecode(access);
      const now = Date.now() / 1000;
      console.log(
        "UserProfile: Token expiry:",
        decoded.exp,
        "Current time:",
        now
      );

      if (decoded.exp < now) {
        console.log("UserProfile: Token expired, attempting refresh...");
        try {
          const res = await api.post("/api/users/token/", { refresh });
          if (!res.data.access) {
            throw new Error("No access token in refresh response");
          }
          access = res.data.access;
          localStorage.setItem(ACCESS_TOKEN, access);
          console.log("UserProfile: Token refreshed successfully");
        } catch (refreshErr) {
          console.error("UserProfile: Token refresh failed:", {
            message: refreshErr.message,
            response: refreshErr.response?.data,
            status: refreshErr.response?.status,
          });
          throw new Error("Failed to refresh token");
        }
      }

      const userRes = await api.get("/api/users/me/", {
        headers: { Authorization: `Bearer ${access}` },
      });
      console.log(
        "UserProfile: GET /api/users/me/ response:",
        JSON.stringify(userRes.data, null, 2)
      );
      console.log(
        "UserProfile: last_name in response:",
        userRes.data.last_name
      );
      if (
        userRes.data.last_name === undefined ||
        userRes.data.last_name === null
      ) {
        console.warn(
          "UserProfile: last_name is undefined or null in GET response"
        );
      }

      const newUserData = {
        username: userRes.data.username || "",
        first_name: userRes.data.first_name || "",
        last_name: userRes.data.last_name || "",
        email: userRes.data.email || "",
        company: userRes.data.company || "",
        role: userRes.data.role || "",
      };
      console.log(
        "UserProfile: Setting userData:",
        JSON.stringify(newUserData, null, 2)
      );
      setUserData(newUserData);
      setUserRole(userRes.data.role);
      setLoading(false);
    } catch (err) {
      console.error("UserProfile: Error fetching user data:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError("Failed to load profile. Please try again or log in.");
      setLoading(false);
      navigate("/login");
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);

    const confirmed = window.confirm(
      "Are you sure you want to update your profile?"
    );
    if (!confirmed) {
      console.log("UserProfile: Profile update canceled by user");
      setSubmitting(false);
      return;
    }
    console.log("UserProfile: User confirmed profile update");

    try {
      let access = getToken();
      const refresh = getRefreshToken();

      if (!access || !refresh) {
        throw new Error("No access token found");
      }

      const decoded = jwtDecode(access);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        console.log(
          "UserProfile: Token expired for submit, attempting refresh..."
        );
        const res = await api.post("/api/users/token/", { refresh });
        if (!res.data.access) {
          throw new Error("No access token in refresh response");
        }
        access = res.data.access;
        localStorage.setItem(ACCESS_TOKEN, access);
        console.log("UserProfile: Token refreshed for submit");
      }

      const payload = {
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        company: userData.company,
      };

      if (password) {
        payload.password = password;
        payload.confirm_password = confirmPassword;
      }

      console.log(
        "UserProfile: Submitting payload:",
        JSON.stringify(payload, null, 2)
      );

      const response = await api.put("/api/users/me/update/", payload, {
        headers: { Authorization: `Bearer ${access}` },
      });

      console.log(
        "UserProfile: PUT /api/users/me/update/ response:",
        JSON.stringify(response.data, null, 2)
      );
      console.log(
        "UserProfile: last_name in PUT response:",
        response.data.last_name
      );

      setUserData({
        ...userData,
        first_name: response.data.first_name || userData.first_name,
        last_name: response.data.last_name || userData.last_name,
        email: response.data.email || userData.email,
        company: response.data.company || userData.company,
      });
      setPassword("");
      setConfirmPassword("");
      setSuccess("Profile updated successfully!");
    } catch (err) {
      console.error("UserProfile: Error updating profile:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(
        `Failed to update profile. Error: ${
          err.response?.data?.detail ||
          err.response?.data?.non_field_errors?.[0] ||
          Object.values(err.response?.data)?.[0] ||
          err.message
        }`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isAdminOrEngineer = ["admin", "proposal_engineer"].includes(userRole);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <CircularProgress size={48} sx={{ color: "#d6393a" }} />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            fontFamily: "Helvetica, sans-serif",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Loading profile...
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box
        className="user-profile-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #f5f5f5, #e9ecef)",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <Container maxWidth="sm" sx={{ py: 4, mt: 12, mb: 8 }}>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontWeight: "bold",
                fontFamily: "Helvetica, sans-serif",
                textTransform: "uppercase",
                letterSpacing: 0,
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
                color: "#000000",
                mb: 6,
              }}
            >
              User Profile
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              <TextField
                label="Username"
                value={userData.username}
                disabled
                fullWidth
                margin="normal"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <TextField
                label="Role"
                value={userData.role}
                disabled
                fullWidth
                margin="normal"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <TextField
                label="First Name"
                value={userData.first_name}
                onChange={(e) =>
                  setUserData({ ...userData, first_name: e.target.value })
                }
                fullWidth
                margin="normal"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <TextField
                label="Last Name"
                value={userData.last_name}
                onChange={(e) =>
                  setUserData({ ...userData, last_name: e.target.value })
                }
                fullWidth
                margin="normal"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <TextField
                label="Email"
                value={userData.email}
                onChange={(e) =>
                  setUserData({ ...userData, email: e.target.value })
                }
                disabled={isAdminOrEngineer}
                fullWidth
                margin="normal"
                type="email"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <TextField
                label="Company"
                value={userData.company}
                onChange={(e) =>
                  setUserData({ ...userData, company: e.target.value })
                }
                disabled={isAdminOrEngineer}
                fullWidth
                margin="normal"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <TextField
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                type="password"
                placeholder="Leave blank to keep unchanged"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <TextField
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                margin="normal"
                type="password"
                placeholder="Leave blank to keep unchanged"
                sx={{ fontFamily: "Helvetica, sans-serif" }}
              />
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                fullWidth
                sx={{
                  mt: 3,
                  fontFamily: "Helvetica, sans-serif",
                  bgcolor: "#d6393a",
                  "&:hover": { bgcolor: "#b53031" },
                }}
              >
                {submitting ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Update Profile"
                )}
              </Button>
            </Box>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default UserProfile;
