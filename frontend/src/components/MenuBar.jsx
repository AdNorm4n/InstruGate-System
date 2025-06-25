// src/components/Menubar.jsx
import React, { useContext } from "react";
import { AppBar, Toolbar, Box, Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import PersonIcon from "@mui/icons-material/Person";
import { UserContext } from "../contexts/UserContext";
import api from "../api";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import logo from "../assets/ashcroft.png";
import headerBanner from "../assets/menu.png";
import centerLogo from "../assets/instrugate.png";

export default function Menubar() {
  const { loading } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await api.post("/api/users/logout/", {});
    } catch (error) {
      console.error("Logout failed:", error);
    }
    localStorage.removeItem(ACCESS_TOKEN);
    localStorage.removeItem(REFRESH_TOKEN);
    localStorage.removeItem("user");
    navigate("/login");
  };

  if (loading) {
    return (
      <AppBar
        position="sticky"
        sx={{ backgroundColor: "transparent", boxShadow: "none" }}
      >
        <Toolbar
          sx={{ backgroundColor: "#e0f7fa", justifyContent: "space-between" }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <img src={logo} alt="Logo" style={{ height: 28 }} />
            <img src={headerBanner} alt="Banner" style={{ height: 42 }} />
          </Box>
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
            }}
          >
            <img src={centerLogo} alt="Center Logo" style={{ height: 34 }} />
          </Box>
          <Box>
            <CircularProgress size={18} sx={{ color: "#d6393a" }} />
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="sticky"
      sx={{ backgroundColor: "transparent", boxShadow: "none" }}
    >
      <Toolbar
        sx={{ backgroundColor: "#1e1e1e", justifyContent: "space-between" }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img src={logo} alt="Logo" style={{ height: 28 }} />
          <img src={headerBanner} alt="Banner" style={{ height: 42 }} />
        </Box>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <img src={centerLogo} alt="Center Logo" style={{ height: 42 }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            startIcon={<PersonIcon sx={{ color: "#d6393a" }} />}
            onClick={() => navigate("/profile")}
            sx={btnStyle}
          >
            Profile
          </Button>
          <Button
            startIcon={<ExitToAppIcon sx={{ color: "#d6393a" }} />}
            onClick={handleLogout}
            sx={btnStyle}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

const btnStyle = {
  color: "#fff",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.9rem",
  bgcolor: "transparent",
  "&:hover": {
    bgcolor: "#333333",
    transform: "scale(1.05)",
  },
  fontFamily: "'Inter', Helvetica, sans-serif",
  px: 1.5,
  py: 0.75,
  borderRadius: "8px",
};
