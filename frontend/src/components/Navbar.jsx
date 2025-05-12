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
import api from "../api";
import headerBanner from "../assets/menu.png";
import logo from "../assets/ashcroft.png";

export default function Navbar({ userRole }) {
  const [instruments, setInstruments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api
      .get("/api/instruments/")
      .then((res) => setInstruments(res.data))
      .catch(() => alert("Failed to load instruments"));
  }, []);

  const menuItems = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    ...(userRole !== "admin"
      ? [
          { text: "About", icon: <InfoIcon />, path: "/about" },
          {
            text: "Products",
            icon: <StorefrontIcon />,
            path: "/instruments",
          },
          {
            text: "Quotations",
            icon: <ArchiveIcon />,
            path: "/quotations/submitted/",
          },
        ]
      : []),
    ...(userRole === "admin"
      ? [
          {
            text: "Admin Panel",
            icon: <AdminPanelSettingsIcon />,
            path: "/admin",
          },
        ]
      : []),
  ];

  return (
    <AppBar position="fixed" sx={{ backgroundColor: "#ffffff", boxShadow: 3 }}>
      {/* Top Banner Section with Logout */}
      <Toolbar
        sx={{
          minHeight: 100,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        {/* Box for logos */}
        <Box sx={{}}>
          {/* First Logo */}
          <img
            src={logo}
            alt="New Logo"
            style={{ height: "30px", paddingBottom: "7px" }}
          />

          {/* Second Logo */}
          <img
            src={headerBanner}
            alt="Header Banner"
            style={{ height: "50px" }}
          />
        </Box>

        {/* Logout Button */}
        <Button
          startIcon={<ExitToAppIcon sx={{ color: "#e4332b" }} />}
          onClick={() => navigate("/logout")}
          sx={{
            color: "#e4332b",
            textTransform: "none",
            fontWeight: 500,
            bgcolor: "#ffffff",
            "&:hover": { bgcolor: "#f5f5f5" },
          }}
        >
          Logout
        </Button>
      </Toolbar>

      {/* Bottom Menu Section */}
      <Toolbar
        sx={{
          minHeight: 64,
          display: "flex",
          justifyContent: "center",
          backgroundColor: "#e4332b",
        }}
      >
        <Box sx={{ display: "flex", gap: 3 }}>
          {menuItems.map((item) => (
            <Button
              key={item.text}
              startIcon={React.cloneElement(item.icon, {
                sx: { color: "#ffffff" },
              })}
              onClick={() => navigate(item.path)}
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
