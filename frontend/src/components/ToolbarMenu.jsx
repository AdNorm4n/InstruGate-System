// src/components/ToolbarMenu.jsx
import React, { useContext } from "react";
import { Toolbar, Box, Button, AppBar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ArchiveIcon from "@mui/icons-material/Archive";
import InfoIcon from "@mui/icons-material/Info";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";
import { UserContext } from "../contexts/UserContext";

export default function ToolbarMenu() {
  const { userRole } = useContext(UserContext);
  const navigate = useNavigate();

  const menuItems = [
    { text: "Home", icon: <HomeIcon />, path: "/" },
    ...(userRole !== "admin"
      ? [
          { text: "About", icon: <InfoIcon />, path: "/about" },
          { text: "Tools", icon: <HomeRepairServiceIcon />, path: "/tools" },
          { text: "Products", icon: <StorefrontIcon />, path: "/instruments" },
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
            path: "/admin-panel",
          },
        ]
      : []),
  ];

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "#d6393a",
        top: 0,
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          minHeight: 48,
          justifyContent: "center",
          px: { xs: 2, sm: 3 },
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
                sx: { color: "#fff" },
              })}
              onClick={() => navigate(item.path)}
              sx={{
                color: "#fff",
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
