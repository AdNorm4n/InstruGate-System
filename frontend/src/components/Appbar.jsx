// components/AppBar.jsx
import React from "react";
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

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: "transparent",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          backgroundColor: "#1e1e1e",
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
                startIcon={
                  <PersonIcon sx={{ color: "#d6393a", fontSize: "1.2rem" }} />
                }
                sx={btnStyle}
              >
                Profile
              </Button>
              <Button
                onClick={handleLogout}
                startIcon={
                  <ExitToAppIcon
                    sx={{ color: "#d6393a", fontSize: "1.2rem" }}
                  />
                }
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
  color: "#ffffff",
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.9rem",
  bgcolor: "transparent",
  "&:hover": {
    bgcolor: "#333333",
    transform: "scale(1.05)",
    transition: "all 0.2s ease",
  },
  fontFamily: "'Inter', Helvetica, sans-serif",
  px: 1.5,
  py: 0.75,
  borderRadius: "8px",
};
