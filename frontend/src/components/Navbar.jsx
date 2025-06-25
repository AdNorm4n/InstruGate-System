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
import headerBanner from "../assets/companylogo.png";
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
    {
      text: "Home",
      fontWeight: "bold",
      icon: <HomeIcon sx={{ color: "#333333" }} />,
      path: "/",
    },
    ...(userRole !== "admin"
      ? [
          {
            text: "About",
            fontWeight: "bold",
            icon: <InfoIcon sx={{ color: "#333333" }} />,
            path: "/about",
          },
          {
            text: "Tools",
            fontWeight: "bold",
            icon: <HomeRepairServiceIcon sx={{ color: "#333333" }} />,
            path: "/tools",
          },
          {
            text: "Products",
            fontWeight: "bold",
            icon: <StorefrontIcon sx={{ color: "#333333" }} />,
            path: "/instruments",
          },
          {
            text: "Quotations",
            fontWeight: "bold",
            icon: <ArchiveIcon sx={{ color: "#333333" }} />,
            path: "/quotations/submitted/",
          },
        ]
      : []),
    ...(userRole === "admin"
      ? [
          {
            text: "Admin Panel",
            fontWeight: "bold",
            icon: <AdminPanelSettingsIcon sx={{ color: "#333333" }} />,
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
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
          backgroundColor: "transparent",
          width: "100%",
          maxWidth: "100vw",
          boxSizing: "border-box",
          zIndex: 1200,
        }}
      >
        <Toolbar
          sx={{
            minHeight: 64,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#e0f7fa",
            px: { xs: 2, sm: 3 },
            width: "100%",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <img src={logo} alt="New Logo" style={{ height: "28px" }} />
              <img
                src={headerBanner}
                alt="Header Banner"
                style={{ height: "42px" }}
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
              style={{ height: "34px" }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <CircularProgress size={18} sx={{ color: "#d6393a" }} />
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="relative"
      sx={{
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        backgroundColor: "transparent",
        width: "100%",
        maxWidth: "100vw",
        boxSizing: "border-box",
        zIndex: 1200,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 64,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#1e1e1e",
          px: { xs: 2, sm: 3 },
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <img src={logo} alt="New Logo" style={{ height: "28px" }} />
            <img
              src={headerBanner}
              alt="Header Banner"
              style={{ height: "42px" }}
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
          <img src={centerLogo} alt="Center Logo" style={{ height: "42px" }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            startIcon={
              <PersonIcon sx={{ color: "#d6393a", fontSize: "1.2rem" }} />
            }
            onClick={() => navigate("/profile")}
            sx={{
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              bgcolor: "transparent",
              "&:hover": {
                bgcolor: "#333333",
              },
              fontFamily: "'Inter', Helvetica, sans-serif",
              px: 1.5,
              py: 0.75,
              borderRadius: "8px",
            }}
          >
            Profile
          </Button>
          <Button
            startIcon={
              <ExitToAppIcon sx={{ color: "#d6393a", fontSize: "1.2rem" }} />
            }
            onClick={handleLogout}
            sx={{
              color: "#ffffff",
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
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
      <Toolbar
        sx={{
          minHeight: 48,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#d6393a",
          px: { xs: 2, sm: 3 },
          width: "100%",
          maxWidth: "100%",
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: 2.5,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          {menuItems.map((item) => (
            <Button
              key={item.text}
              startIcon={React.cloneElement(item.icon, {
                sx: { fontSize: "1.2rem" },
              })}
              onClick={item.action || (() => navigate(item.path))}
              sx={{
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 600,
                fontSize: "0.9rem",
                "&:hover": {
                  bgcolor: "#b32b2e",
                  transform: "scale(1.05)",
                },
                fontFamily: "'Inter', Helvetica, sans-serif",
                px: 1.5,
                py: 0.75,
                borderRadius: "8px",
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
