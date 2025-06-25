// components/AppBar.jsx
import React, { useEffect, useState } from "react";
import { AppBar, Toolbar, Box, Button, CircularProgress } from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import logo from "../assets/ashcroft.png";
import headerBanner from "../assets/menu.png";
import centerLogo from "../assets/instrugate.png";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import api from "../api";

export default function AppBarTop({ loading }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [lastScroll, setLastScroll] = useState(0);

  const handleLogout = async () => {
    try {
      await api.post("/api/users/logout/", {});
    } catch (e) {
      console.error("Logout error", e);
    }
    localStorage.clear();
    navigate("/login");
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setVisible(currentScroll < lastScroll || currentScroll <= 5);
      setLastScroll(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScroll]);

  return (
    <AppBar
      position="fixed"
      sx={{
        top: visible ? 0 : "-64px", // hide AppBar on scroll down
        transition: "top 0.3s ease",
        backgroundColor: "#1e1e1e",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        zIndex: 1300,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          display: "flex",
          justifyContent: "space-between",
          px: 3,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <img src={logo} alt="Logo" style={{ height: 28 }} />
          <img src={headerBanner} alt="Header" style={{ height: 42 }} />
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
          {loading ? (
            <CircularProgress size={18} sx={{ color: "#d6393a" }} />
          ) : (
            <>
              <Button
                onClick={() => navigate("/profile")}
                startIcon={<PersonIcon sx={{ color: "#d6393a" }} />}
                sx={btnStyle}
              >
                Profile
              </Button>
              <Button
                onClick={handleLogout}
                startIcon={<ExitToAppIcon sx={{ color: "#d6393a" }} />}
                sx={btnStyle}
              >
                Logout
              </Button>
            </>
          )}
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
  fontFamily: "'Inter', sans-serif",
  "&:hover": {
    bgcolor: "#333",
    transform: "scale(1.05)",
    transition: "all 0.2s ease",
  },
};
