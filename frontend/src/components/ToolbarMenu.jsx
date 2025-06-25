// components/ToolbarMenu.jsx
import React, { useEffect, useState } from "react";
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
  const [hidden, setHidden] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  const handleScroll = () => {
    const currentScroll = window.scrollY;
    if (currentScroll > lastScrollY) {
      setHidden(true); // scrolling down
    } else {
      setHidden(false); // scrolling up
    }
    setLastScrollY(currentScroll);
  };

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

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
        minHeight: 48,
        backgroundColor: "#d6393a",
        position: "relative",
        top: hidden ? "-48px" : "0px",
        transition: "top 0.3s ease",
        justifyContent: "center",
        px: 3,
        zIndex: 1000,
      }}
    >
      <Box sx={{ display: "flex", gap: 2.5, flexWrap: "wrap" }}>
        {menuItems.map((item) => (
          <Button
            key={item.text}
            onClick={() => navigate(item.path)}
            startIcon={React.cloneElement(item.icon, {
              sx: { color: "#ffffff", fontSize: "1.2rem" },
            })}
            sx={{
              color: "#ffffff",
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.9rem",
              "&:hover": {
                bgcolor: "#b32b2e",
                transform: "scale(1.05)",
                transition: "all 0.2s ease",
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
  );
}
