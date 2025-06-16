import { useState } from "react";
import api from "../api";
import {
  Stack,
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  InputAdornment,
} from "@mui/material";
import { Email } from "@mui/icons-material";
import logo from "../assets/instrugate.png";
import companylogo from "../assets/companylogo.png";
import { Link } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [openError, setOpenError] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setOpenError(false);
    setOpenSuccess(false);

    try {
      const response = await api.post("/api/users/forgot-password/", { email });

      if (response.status === 200) {
        setSuccessMessage("Reset link sent to your email.");
        setOpenSuccess(true);
      }
    } catch (error) {
      if (error.response) {
        if (error.response.status === 404) {
          setErrorMessage(
            "No account found with that email. Redirecting to registration..."
          );
          setOpenError(true);
          setTimeout(() => {
            window.location.href = "/register";
          }, 3000);
        } else if (error.response.data?.error) {
          setErrorMessage(error.response.data.error);
          setOpenError(true);
        } else {
          setErrorMessage("Something went wrong. Please try again later.");
          setOpenError(true);
        }
      } else {
        setErrorMessage("Network error. Please try again later.");
        setOpenError(true);
      }
    }
  };

  return (
    <div className="auth-wrapper">
      <Stack direction="row" className="auth-container">
        <Box className="logo-panel">
          <img src={logo} alt="Instrugate Logo" className="logo-img" />
          <img src={companylogo} alt="Company Logo" className="partner-logo" />
        </Box>
        <Paper elevation={3} className="form-panel">
          <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontWeight: "bold",
                color: "#000000",
                fontFamily: "Helvetica, sans-serif",
                textTransform: "uppercase",
                letterSpacing: 0,
                mb: 4,
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Forgot Password
            </Typography>
            <Typography
              variant="body2"
              align="center"
              sx={{ mb: 3, color: "#333", fontSize: "0.875rem" }}
            >
              Enter your registered email address. We’ll send you a link to
              reset your password.
            </Typography>
            <Stack spacing={4} sx={{ mt: 5 }}>
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
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "#333",
                  },
                  "& .MuiInputBase-input": {
                    color: "#333",
                  },
                  "& .MuiInput-underline:before": { borderBottomColor: "#333" },
                  "& .MuiInput-underline:hover:before": {
                    borderBottomColor: "#d6393a",
                  },
                  "& .MuiInput-underline:after": {
                    borderBottomColor: "#d6393a",
                  },
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  backgroundColor: "#d6393a",
                  ":hover": {
                    backgroundColor: "#ffffff",
                    color: "#d6393a",
                    border: "1px solid #d6393a",
                  },
                  fontSize: "0.875rem",
                  textTransform: "uppercase",
                  padding: "0.5rem",
                }}
              >
                Send Reset Link
              </Button>
              <div className="register-link">
                <p>
                  <Link to="/login">Back to Login</Link>
                </p>
              </div>
            </Stack>
          </Box>
        </Paper>
      </Stack>
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
    </div>
  );
}

export default ForgotPassword;
