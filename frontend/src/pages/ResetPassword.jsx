import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { LockRounded } from "@mui/icons-material";
import logo from "../assets/instrugate.png";
import companylogo from "../assets/companylogo.png";
import axios from "axios";

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function ResetPassword() {
  const query = useQuery();
  const token = query.get("token");
  const uid = query.get("uid");

  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [openError, setOpenError] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setOpenError(false);
    setOpenSuccess(false);

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setOpenError(true);
      return;
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/reset-password/`,
        {
          uid,
          token,
          password,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.status === 200) {
        setSuccessMessage(
          "Password has been reset successfully. Redirecting to login..."
        );
        setOpenSuccess(true);

        setTimeout(() => {
          navigate("/login");
        }, 3000);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.error || "Something went wrong.");
      setOpenError(true);
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
              Reset Password
            </Typography>
            <Stack spacing={4} sx={{ mt: 5 }}>
              <TextField
                label="New Password"
                type="password"
                variant="standard"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRounded sx={{ color: "#333" }} />
                    </InputAdornment>
                  ),
                }}
                required
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "#333",
                  },
                  "& .MuiInputLabel-shrink": {
                    color: "#333",
                  },
                  "& .MuiInputBase-input": {
                    color: "#333",
                    fontSize: "0.875rem",
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
              <TextField
                label="Confirm Password"
                type="password"
                variant="standard"
                fullWidth
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRounded sx={{ color: "#333" }} />
                    </InputAdornment>
                  ),
                }}
                required
                sx={{
                  "& .MuiInputLabel-root": {
                    color: "#333",
                  },
                  "& .MuiInputLabel-shrink": {
                    color: "#333",
                  },
                  "& .MuiInputBase-input": {
                    color: "#333",
                    fontSize: "0.875rem",
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
                Reset Password
              </Button>
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
            {successMessage}
          </Alert>
        </Snackbar>
      </Box>
    </div>
  );
}

export default ResetPassword;
