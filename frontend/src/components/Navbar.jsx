import * as React from "react";
import { useState, useEffect, useContext } from "react";
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
  const [instruments, setInstruments] = useState([]);
  const [hideTopToolbar, setHideTopToolbar] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setHideTopToolbar(true);
      } else if (currentScrollY < lastScrollY || currentScrollY <= 50) {
        setHideTopToolbar(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  useEffect(() => {
    api
      .get("/api/instruments/")
      .then((res) => setInstruments(res.data))
      .catch(() => alert("Failed to load instruments"));
  }, []);

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
        position="fixed"
        sx={{
          boxShadow: 0,
          transition: "all 0.3s ease",
          backgroundColor: "transparent",
        }}
      >
        <Toolbar
          sx={{
            minHeight: 100,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            position: "relative",
            backgroundColor: "#e0f7fa",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Box sx={{}}>
              <img
                src={logo}
                alt="New Logo"
                style={{ height: "30px", paddingBottom: "7px" }}
              />
              <img
                src={headerBanner}
                alt="Header Banner"
                style={{ height: "50px" }}
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
              style={{ height: "40px" }}
            />
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <CircularProgress size={20} sx={{ color: "#d6393a" }} />
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        backgroundColor: "transparent",
        width: "100%", // Full width
        maxWidth: "100vw", // Prevent overflow
        boxSizing: "border-box",
      }}
    >
      <Toolbar
        sx={{
          minHeight: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "relative",
          maxHeight: hideTopToolbar ? 0 : 100,
          opacity: hideTopToolbar ? 0 : 1,
          overflow: "hidden",
          transition: "max-height 0.3s ease, opacity 0.3s ease",
          backgroundColor: "#ffffff",
          px: { xs: 2, sm: 3 }, // Consistent padding
          width: "100%", // Ensure full width
          maxWidth: "100%", // Prevent overflow
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Box sx={{}}>
            <img
              src={logo}
              alt="New Logo"
              style={{ height: "30px", paddingBottom: "7px" }}
            />
            <img
              src={headerBanner}
              alt="Header Banner"
              style={{ height: "50px" }}
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
          <img src={centerLogo} alt="Center Logo" style={{ height: "40px" }} />
        </Box>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            startIcon={<PersonIcon sx={{ color: "#d6393a" }} />}
            onClick={() => navigate("/profile")}
            sx={{
              color: "#d6393a",
              textTransform: "none",
              fontWeight: "bold",
              bgcolor: "#ffffff",
              "&:hover": { bgcolor: "#e0e0e0" },
              fontFamily: "'Inter', Helvetica, sans-serif",
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
              bgcolor: "#ffffff",
              "&:hover": { bgcolor: "#e0e0e0" },
              fontFamily: "'Inter', Helvetica, sans-serif",
            }}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
      <Toolbar
        sx={{
          minHeight: 64,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#d6393a",
          transform: hideTopToolbar ? "translateY(-64px)" : "translateY(0)",
          transition: "transform 0.3s ease",
          zIndex: 1100,
          px: { xs: 2, sm: 3 }, // Consistent padding
          width: "100%",
          maxWidth: "100%", // Prevent overflow
          boxSizing: "border-box",
        }}
      >
        <Box sx={{ display: "flex", gap: 3 }}>
          {menuItems.map((item) => (
            <Button
              key={item.text}
              startIcon={React.cloneElement(item.icon, {
                sx: { color: "#ffffff" },
              })}
              onClick={item.action || (() => navigate(item.path))}
              sx={{
                color: "#ffffff",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": { bgcolor: "#b32b2e" },
                fontFamily: "'Inter', Helvetica, sans-serif",
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
