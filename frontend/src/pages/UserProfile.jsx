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
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/UserProfile.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ProfileCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif !important",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
  },
}));

const ToolCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif !important",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(3),
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  padding: theme.spacing(1.5, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif !important",
  "&:hover": {
    backgroundColor: "#1565c0",
    transform: "scale(1.01)",
  },
  "&.Mui-disabled": {
    backgroundColor: "#e0e0e0",
    color: "#999",
  },
  transition: "all 0.3s ease",
  "& .MuiCircularProgress-root": {
    color: "#ffffff",
  },
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
          "UserProfile: last_name is undefined or null in userRes.data"
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
    setSubmitting(true);

    const confirmed = window.confirm(
      "Are you sure you want to update your profile?"
    );
    if (!confirmed) {
      console.log("UserProfile: Profile update canceled by user.");
      setSubmitting(false);
      return;
    }
    console.log("UserProfile: User confirmed profile update");

    try {
      let access = getToken();
      const refresh = getRefreshToken();

      if (!access) {
        throw new Error("No access token found");
      }

      const decoded = jwtDecode(access);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        console.log(
          "UserProfile: Token expired for update, attempting refresh..."
        );
        const res = await api.post("/api/users/token/", { refresh });
        if (!res.data.access) {
          throw new Error("No access token in refresh response");
        }
        access = res.data.access;
        localStorage.setItem(ACCESS_TOKEN, access);
        console.log("UserProfile: Token refreshed for update");
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
      window.alert("Successfully updated");
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
      <Fade in>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            mt: "20vh",
          }}
        >
          <ToolCard sx={{ maxWidth: "500px", mx: "auto", p: 4 }}>
            <CircularProgress size={48} sx={{ color: "#1976d2" }} />
            <Typography
              variant="h6"
              sx={{
                mt: 2,
                fontFamily: "Helvetica, sans-serif !important",
                fontWeight: "bold",
                color: "#000000",
              }}
            >
              Loading profile...
            </Typography>
          </ToolCard>
        </Box>
      </Fade>
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
          bgcolor: "#f8f9fa",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <Container maxWidth="md" sx={{ py: 6, mt: 8 }}>
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                fontWeight: "bold",
                color: "#000000",
                textTransform: "uppercase",
                mb: 2,
                fontSize: { xs: "1.5rem", md: "2rem" },
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              User Profile
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                color: "#333",
                mb: 6,
                fontSize: "0.9rem",
              }}
            >
              Update your personal information and account settings.
            </Typography>

            {error && (
              <ToolCard sx={{ mb: 4, mx: "auto", maxWidth: "500px" }}>
                <Alert severity="error" sx={{ borderRadius: 2 }}>
                  <Typography
                    variant="body1"
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      fontSize: "0.9rem",
                      lineHeight: 1.6,
                    }}
                  >
                    {error}
                  </Typography>
                </Alert>
              </ToolCard>
            )}

            <ProfileCard component="form" onSubmit={handleSubmit}>
              <TextField
                label="Username"
                value={userData.username}
                disabled
                fullWidth
                margin="normal"
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
              />
              <TextField
                label="Role"
                value={userData.role}
                disabled
                fullWidth
                margin="normal"
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
              />
              <TextField
                label="First Name"
                value={userData.first_name}
                onChange={(e) =>
                  setUserData({ ...userData, first_name: e.target.value })
                }
                fullWidth
                margin="normal"
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
              />
              <TextField
                label="Last Name"
                value={userData.last_name}
                onChange={(e) =>
                  setUserData({ ...userData, last_name: e.target.value })
                }
                fullWidth
                margin="normal"
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
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
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
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
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
              />
              <TextField
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                margin="normal"
                type="password"
                placeholder="Leave blank to keep unchanged"
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
              />
              <TextField
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                margin="normal"
                type="password"
                placeholder="Leave blank to keep unchanged"
                InputLabelProps={{
                  style: { fontFamily: "Helvetica, sans-serif" },
                }}
                InputProps={{ style: { fontFamily: "Helvetica, sans-serif" } }}
              />
              <CTAButton
                type="submit"
                variant="contained"
                disabled={submitting}
                fullWidth
                sx={{ mt: 3 }}
              >
                {submitting ? <CircularProgress size={24} /> : "Update Profile"}
              </CTAButton>
            </ProfileCard>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default UserProfile;
