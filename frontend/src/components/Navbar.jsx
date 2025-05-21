import * as React from "react";
import { useEffect, useState } from "react";
import { Box, AppBar, Toolbar, Button } from "@mui/material";
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

export default function Navbar({ userRole }) {
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
    localStorage.clear();
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
          maxHeight: hideTopToolbar ? 0 : 100,
          opacity: hideTopToolbar ? 0 : 1,
          overflow: "hidden",
          transition: "max-height 0.3s ease, opacity 0.3s ease",
          backgroundColor: "#ffffff",
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
              "&:hover": { bgcolor: "#f5f5f5" },
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
              "&:hover": { bgcolor: "#f5f5f5" },
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
