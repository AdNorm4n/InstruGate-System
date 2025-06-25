import { useState, useContext } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Snackbar,
  Alert,
  Backdrop,
} from "@mui/material";
import {
  AccountCircle,
  LockRounded,
  Email,
  Business,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import { UserContext } from "../contexts/UserContext";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openError, setOpenError] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);
  const [openConfirmRegister, setOpenConfirmRegister] = useState(false);
  const navigate = useNavigate();
  const { setUserRole } = useContext(UserContext);

  const name = method === "login" ? "Login" : "Register";
  const description =
    method === "login"
      ? "Enter your credentials to access your account."
      : "Create a new account to get started.";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (method === "register") {
      setOpenConfirmRegister(true);
      return;
    }
    setLoading(true);

    try {
      console.log("Form: Submitting login with username:", username);
      let payload;
      if (method === "login") {
        payload = { username, password };
      } else {
        payload = {
          username,
          password,
          email,
          company,
          first_name: firstName,
          last_name: lastName,
        };
      }

      const res = await api.post(route, payload);
      console.log("Form: Login API response:", res.data);

      if (method === "login") {
        const access = res.data.access;
        const refresh = res.data.refresh;

        localStorage.setItem(ACCESS_TOKEN, access);
        localStorage.setItem(REFRESH_TOKEN, refresh);
        console.log("Form: Stored tokens in localStorage");

        const userProfileRes = await api.get("/api/users/me/");
        const userProfile = userProfileRes.data;
        console.log("Form: User profile fetched:", userProfile);

        const role = userProfile.role;
        if (!role) {
          throw new Error("No role found in user profile");
        }

        localStorage.setItem("user", JSON.stringify({ ...userProfile, role }));
        console.log("Form: Stored user profile with role:", role);

        setUserRole(role);
        console.log("Form: Set UserContext userRole:", role);

        setSuccessMessage("Login successful!");
        setOpenSuccess(true);

        setTimeout(() => {
          console.log("Form: Navigating based on role:", role);
          if (role === "admin") {
            navigate("/admin-panel");
          } else {
            navigate("/");
          }
        }, 500);
      } else {
        setSuccessMessage("Registration successful! Please log in.");
        setOpenSuccess(true);
        setTimeout(() => navigate("/login"), 500);
      }
    } catch (error) {
      console.error("Form: Login error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      let message = "An error occurred. Please try again.";
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.email) {
          message = "Email has already been used.";
        } else if (data.username) {
          message = "Username has already been taken.";
        } else if (typeof data.detail === "string") {
          message = data.detail;
        }
      }
      setErrorMessage(message);
      setOpenError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmRegister = async () => {
    setOpenConfirmRegister(false);
    setLoading(true);

    try {
      console.log("Form: Confirming registration for:", username);
      const payload = {
        username,
        password,
        email,
        company,
        first_name: firstName,
        last_name: lastName,
      };

      const res = await api.post(route, payload);
      console.log("Form: Registration API response:", res.data);

      setSuccessMessage("Registration successful! Please log in.");
      setOpenSuccess(true);
      setTimeout(() => navigate("/login"), 500);
    } catch (error) {
      console.error("Form: Registration error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      let message = "An error occurred. Please try again.";
      if (error.response && error.response.data) {
        const data = error.response.data;
        if (data.email) {
          message = "Email has already been used.";
        } else if (data.username) {
          message = "Username has already been taken.";
        } else if (typeof data.detail === "string") {
          message = data.detail;
        }
      }
      setErrorMessage(message);
      setOpenError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRegister = () => {
    setOpenConfirmRegister(false);
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (e) => e.preventDefault();

  return (
    <>
      <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
        <Typography
          variant="h5"
          align="center"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "#000000",
            fontFamily: "Inter, sans-serif",
            textTransform: "uppercase",
            letterSpacing: 0,
            mb: 4,
            textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          {name}
        </Typography>
        <Typography
          variant="body2"
          align="center"
          sx={{ mb: 3, color: "#333", fontSize: "0.875rem" }}
        >
          {description}
        </Typography>

        <Stack spacing={4} sx={{ mt: 5 }}>
          <TextField
            label="Username"
            variant="standard"
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <AccountCircle sx={{ color: "#333" }} />
                </InputAdornment>
              ),
            }}
            required
          />

          {method === "register" && (
            <>
              <TextField
                label="Email"
                type="email"
                variant="standard"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: "#333" }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
              <Stack direction="row" spacing={2}>
                <TextField
                  label="First Name"
                  variant="standard"
                  fullWidth
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
                <TextField
                  label="Last Name"
                  variant="standard"
                  fullWidth
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Stack>
              <TextField
                label="Company"
                variant="standard"
                fullWidth
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Business sx={{ color: "#333" }} />
                    </InputAdornment>
                  ),
                }}
                required
              />
            </>
          )}

          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            variant="standard"
            fullWidth
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <LockRounded sx={{ color: "#333" }} />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={handleClickShowPassword}
                    onMouseDown={handleMouseDownPassword}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          {loading && (
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CircularProgress />
            </Box>
          )}

          <Button
            variant="contained"
            type="submit"
            fullWidth
            sx={{
              backgroundColor: "#d6393a",
              ":hover": {
                backgroundColor: "#ffffff",
                color: "#d6393a",
                border: "1px solid #d6393a",
              },
            }}
          >
            {name}
          </Button>

          <div className="register-link">
            {method === "register" ? (
              <p>
                Already have an account? <Link to="/login">Login</Link>
              </p>
            ) : (
              <>
                <p>
                  Don't have an account? <Link to="/register">Register</Link>
                </p>
                <p>
                  <Link to="/forgot-password">Forgot Password</Link>
                </p>
              </>
            )}
          </div>
        </Stack>
      </Box>

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
          open={openConfirmRegister}
        />
        <Snackbar
          open={openConfirmRegister}
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
                svg: {
                  fill: "white !important",
                },
              },
              "& .MuiAlert-action": {
                color: "white !important",
                svg: {
                  fill: "white !important",
                },
              },
            }}
            action={
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleConfirmRegister}
                  sx={{ color: "white", fontFamily: "Inter, sans-serif" }}
                >
                  Confirm
                </Button>
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleCancelRegister}
                  sx={{ color: "white", fontFamily: "Inter, sans-serif" }}
                >
                  Cancel
                </Button>
              </Box>
            }
          >
            Please confirm your registration.
          </Alert>
        </Snackbar>
        <Snackbar
          open={openError}
          autoHideDuration={6000}
          onClose={() => setOpenError(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setOpenError(false)}
            severity="error"
            variant="filled"
            sx={{
              width: "100%",
              color: "white",
              backgroundColor: "#d32f2f",
              "& .MuiAlert-icon": {
                color: "white !important",
                svg: {
                  fill: "white !important",
                },
              },
              "& .MuiAlert-action": {
                color: "white !important",
                svg: {
                  fill: "white !important",
                },
              },
            }}
          >
            {errorMessage}
          </Alert>
        </Snackbar>
        <Snackbar
          open={openSuccess}
          autoHideDuration={6000}
          onClose={() => setOpenSuccess(false)}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
          <Alert
            onClose={() => setOpenSuccess(false)}
            severity="success"
            variant="filled"
            sx={{
              width: "100%",
              color: "white",
              backgroundColor: "#28a745",
              "& .MuiAlert-icon": {
                color: "white !important",
                svg: {
                  fill: "white !important",
                },
              },
              "& .MuiAlert-action": {
                color: "white !important",
                svg: {
                  fill: "white !important",
                },
              },
            }}
          >
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
}

export default Form;
