// components/ToolbarMenu.jsx
import React from "react";
import { Toolbar, Box, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import ArchiveIcon from "@mui/icons-material/Archive";
import InfoIcon from "@mui/icons-material/Info";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import HomeRepairServiceIcon from "@mui/icons-material/HomeRepairService";

export default function ToolbarMenu({ userRole }) {
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
    <Toolbar
      sx={{
        position: "sticky", // stays under AppBar
        top: 0,
        backgroundColor: "#d6393a",
        zIndex: 1200,
        transition: "top 0.3s ease",
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
        {menuItems.map((item) => (
          <Button
            key={item.text}
            startIcon={React.cloneElement(item.icon, {
              sx: { color: "#fff", fontSize: "1.2rem" },
            })}
            onClick={() => navigate(item.path)}
            sx={{
              color: "#fff",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              fontFamily: "'Inter', sans-serif",
              "&:hover": {
                bgcolor: "#b32b2e",
                transform: "scale(1.05)",
                transition: "all 0.2s ease",
              },
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
  );
}
