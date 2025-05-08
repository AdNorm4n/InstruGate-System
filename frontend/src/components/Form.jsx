// src/components/Form.jsx
import { useState } from "react";
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
} from "@mui/material";
import {
  AccountCircle,
  LockRounded,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";

function Form({ route, method }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [company, setCompany] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const name = method === "login" ? "Login" : "Register";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      if (method === "login") {
        const access = res.data.access;
        const refresh = res.data.refresh;

        localStorage.setItem(ACCESS_TOKEN, access);
        localStorage.setItem(REFRESH_TOKEN, refresh);

        const decoded = jwtDecode(access);
        const role = decoded?.role;

        const userProfileRes = await api.get("/api/users/me/");
        const userProfile = userProfileRes.data;

        localStorage.setItem("user", JSON.stringify(userProfile));

        if (role === "admin") {
          window.location.href = "/admin";
        } else {
          navigate("/");
        }
      } else {
        alert("Registration successful! Please log in.");
        navigate("/login");
      }
    } catch (error) {
      alert(method === "login" ? "Login failed." : "Registration failed.");
      console.error("Auth error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => setShowPassword((show) => !show);
  const handleMouseDownPassword = (e) => e.preventDefault();

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      <Typography variant="h4" align="center" gutterBottom>
        {name}
      </Typography>

      <Stack spacing={4}>
        <TextField
          label="Username"
          variant="standard"
          fullWidth
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <AccountCircle />
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
            />
            <TextField
              label="First Name"
              variant="standard"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            <TextField
              label="Last Name"
              variant="standard"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            <TextField
              label="Company"
              variant="standard"
              fullWidth
              value={company}
              onChange={(e) => setCompany(e.target.value)}
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
                <LockRounded />
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
            backgroundColor: "#033f63",
            ":hover": {
              backgroundColor: "#ffffff",
              color: "#033f63",
              border: "1px solid #033f63",
            },
          }}
        >
          {name}
        </Button>

        {method === "register" ? (
          <div className="register-link">
            <p>
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>
        ) : (
          <div className="register-link">
            <p>
              Don't have an account? <Link to="/register">Register</Link>
            </p>
          </div>
        )}
      </Stack>
    </Box>
  );
}

export default Form;
