import React, { useEffect, useState, useContext } from "react";
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
  Snackbar,
  Backdrop,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import { UserContext } from "../contexts/UserContext";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/UserProfile.css";

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
  const { userRole, loading } = useContext(UserContext);
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openError, setOpenError] = useState(false);
  const [openConfirmUpdate, setOpenConfirmUpdate] = useState(false);
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
    } catch (err) {
      console.error("UserProfile: Error fetching user data:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError("Failed to load profile. Please try again or log in.");
      setOpenError(true);
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

    setOpenConfirmUpdate(true);
    console.log("UserProfile: Showing confirmation Snackbar");
  };

  const handleConfirmUpdate = async () => {
    setOpenConfirmUpdate(false);
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
      setOpenSuccess(true);
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
      setOpenError(true);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelUpdate = () => {
    setOpenConfirmUpdate(false);
    setSubmitting(false);
    console.log("UserProfile: Profile update canceled by user.");
  };

  const handleCloseSuccess = () => {
    setOpenSuccess(false);
  };

  const handleCloseError = () => {
    setOpenError(false);
    setError("");
  };

  const isAdminOrEngineer = ["admin", "proposal_engineer"].includes(userRole);

  if (loading) {
    return (
      <Fade in>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "100vh",
            bgcolor: "#f8f9fa",
            fontFamily: "Helvetica, sans-serif !important",
          }}
        >
          <CircularProgress size={48} sx={{ color: "#1976d2" }} />
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
          fontFamily: "Helvetica, sans-serif !important",
        }}
      >
        <main style={{ flex: 1 }}>
          <Container maxWidth="md" sx={{ py: 2, mt: 4 }}>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                fontWeight: "bold",
                color: "#000000",
                textTransform: "uppercase",
                mb: 2,
                fontSize: "1.5rem",
              }}
            >
              User Profile
            </Typography>
            <Typography
              variant="body2"
              align="center"
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                color: "#333",
                mb: 4,
                fontSize: "0.9rem",
              }}
            >
              Update your personal information and account settings.
            </Typography>

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

            {/* Snackbar Messages */}
            <Box
              sx={{
                position: "fixed",
                top: 20,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                zIndex: 1400,
              }}
            >
              <Backdrop
                sx={{
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  zIndex: (theme) => theme.zIndex.modal - 1,
                }}
                open={openConfirmUpdate}
              />
              <Snackbar
                open={openConfirmUpdate}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  severity="warning"
                  variant="filled"
                  sx={{
                    width: "100%",
                    color: "white",
                    backgroundColor: "#d32f2f",
                    "& .MuiAlert-icon": {
                      color: "white !important",
                      svg: { fill: "white !important" },
                    },
                    "& .MuiAlert-action": {
                      color: "white !important",
                      svg: { fill: "white !important" },
                    },
                  }}
                  action={
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        color="inherit"
                        size="small"
                        onClick={handleConfirmUpdate}
                        sx={{
                          color: "white",
                          fontFamily: "Helvetica, sans-serif",
                        }}
                      >
                        Confirm
                      </Button>
                      <Button
                        color="inherit"
                        size="small"
                        onClick={handleCancelUpdate}
                        sx={{
                          color: "white",
                          fontFamily: "Helvetica, sans-serif",
                        }}
                      >
                        Cancel
                      </Button>
                    </Box>
                  }
                >
                  Are you sure you want to update your profile?
                </Alert>
              </Snackbar>
              <Snackbar
                open={openSuccess}
                autoHideDuration={6000}
                onClose={handleCloseSuccess}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  onClose={handleCloseSuccess}
                  severity="success"
                  variant="filled"
                  sx={{
                    width: "100%",
                    color: "white",
                    backgroundColor: "#28a745",
                    "& .MuiAlert-icon": {
                      color: "white !important",
                      svg: { fill: "white !important" },
                    },
                    "& .MuiAlert-action": {
                      color: "white !important",
                      svg: { fill: "white !important" },
                    },
                  }}
                >
                  Successfully updated!
                </Alert>
              </Snackbar>
              <Snackbar
                open={openError}
                autoHideDuration={6000}
                onClose={handleCloseError}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
              >
                <Alert
                  onClose={handleCloseError}
                  severity="error"
                  variant="filled"
                  sx={{
                    width: "100%",
                    color: "white",
                    backgroundColor: "#d32f2f",
                    "& .MuiAlert-icon": {
                      color: "white !important",
                      svg: { fill: "white !important" },
                    },
                    "& .MuiAlert-action": {
                      color: "white !important",
                      svg: { fill: "white !important" },
                    },
                  }}
                >
                  {error}
                </Alert>
              </Snackbar>
            </Box>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default UserProfile;
