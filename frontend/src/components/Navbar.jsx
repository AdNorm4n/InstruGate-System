import * as React from "react";
import { useContext } from "react";
import { Box, AppBar, Toolbar, Button, CircularProgress } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ArchiveIcon from "@mui/icons-material/Archive";
import InfoIcon from "@mui/icons-material/Info";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import PersonIcon from "@mui/icons-material/Person";
import api from "../api";
import headerBanner from "../assets/menu.png";
import logo from "../assets/ashcroft.png";
import centerLogo from "../assets/instrugate.png";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import { UserContext } from "../contexts/UserContext";

export default function Navbar() {
  const { userRole, loading } = useContext(UserContext);
  const navigate = useNavigate();

  const handleAdminPanel = () => {
    navigate("/admin-panel");
  };

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

  const menuItems = [
    { text: "Home", fontWeight: "bold", icon: <HomeIcon />, path: "/" },
    ...(userRole !== "admin"
      ? [
          {
            text: "About",
            fontWeight: "bold",
            icon: <InfoIcon />,
            path: "/about",
          },
          {
            text: "Tools",
            fontWeight: "bold",
            icon: <HomeRepairServiceIcon />,
            path: "/tools",
          },
          {
            text: "Products",
            fontWeight: "bold",
            icon: <StorefrontIcon />,
            path: "/instruments",
          },
          {
            text: "Quotations",
            fontWeight: "bold",
            icon: <ArchiveIcon />,
            path: "/quotations/submitted/",
          },
        ]
      : []),
    ...(userRole === "admin"
      ? [
          {
            text: "Admin Panel",
            fontWeight: "bold",
            icon: <AdminPanelSettingsIcon />,
            action: handleAdminPanel,
          },
        ]
      : []),
  ];

  if (loading) {
    return (
      <AppBar
        position="relative"
        sx={{
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "transparent",
          width: "100%",
          maxWidth: "100vw",
          boxSizing: "border-box",
          zIndex: 1100,
        }}
      >
        <Toolbar
          sx={{
            minHeight: 80,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#e0f7fa",
            px: { xs: 1.5, sm: 2 },
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box>
              <img
                src={logo}
                alt="New Logo"
                style={{ height: "25px", paddingBottom: "5px" }}
              />
              <img
                src={headerBanner}
                alt="Header Banner"
                style={{ height: "40px" }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              position: "absolute",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src={centerLogo}
              alt="Center Logo"
              style={{ height: "32px" }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 1.5 }}>
            <CircularProgress size={16} sx={{ color: "#d6393a" }} />
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="relative"
      sx={{
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        backgroundColor: "transparent",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 80,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1e1e1e",
          px: { xs: 1.5, sm: 2 },
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box>
            <img
              src={logo}
              alt="New Logo"
              style={{ height: "25px", paddingBottom: "5px" }}
            />
            <img
              src={headerBanner}
              alt="Header Banner"
              style={{ height: "40px" }}
            />
          </Box>
        </Box>
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
          }}
        >
          <img src={centerLogo} alt="Center Logo" style={{ height: "32px" }} />
        </Box>
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Button
            startIcon={<PersonIcon sx={{ color: "#d6393a" }} />}
            onClick={() => navigate("/profile")}
            sx={{
              color: "#d6393a",
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "0.85rem",
              bgcolor: "transparent",
              "&:hover": { bgcolor: "#333333" },
              fontFamily: "'Inter', Helvetica, sans-serif",
              px: 1,
            }}
          >
            Profile
          </Button>
          <Button
            startIcon={<ExitToAppIcon sx={{ color: "#d6393a" }} />}
            onClick={handleLogout}
            sx={{
              color: "#d6393a",
              textTransform: "none",
              fontWeight: "bold",
              fontSize: "0.85rem",
              bgcolor: "transparent",
              "&:hover": { bgcolor: "#333333" },
              fontFamily: "'Inter', Helvetica, sans-serif",
              px: 1,
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
      <Toolbar
        sx={{
          minHeight: 56,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#d6393a",
          px: { xs: 1.5, sm: 2 },
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", gap: 2 }}>
          {menuItems.map((item) => (
            <Button
              key={item.text}
              startIcon={React.cloneElement(item.icon, {
                sx: { color: "#ffffff", fontSize: "1.1rem" },
              })}
              onClick={item.action || (() => navigate(item.path))}
              sx={{
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 500,
                fontSize: "0.85rem",
                "&:hover": { bgcolor: "#b32b2e" },
                fontFamily: "'Inter', Helvetica, sans-serif",
                px: 1,
              }}
            >
              {item.text}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
}
