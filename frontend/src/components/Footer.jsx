import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#d6393a",
        boxShadow: "0 -2px 8px rgba(0, 0, 0, 0.1)",
        textAlign: "center",
        py: 2,
        width: "100%", // Full width
        maxWidth: "100vw", // Prevent overflow
        boxSizing: "border-box", // Include padding in width
        mt: "auto", // Push to bottom in flex layout
        position: "relative", // Ensure it stays in flow
        zIndex: 1000, // Below navbar (zIndex: 1100)
      }}
    >
      <Typography
        variant="body2"
        sx={{
          color: "#ffffff",
          fontWeight: 500,
          fontFamily: "'Inter', sans-serif",
          px: { xs: 2, sm: 3 }, // Consistent padding with content
        }}
      >
        © {new Date().getFullYear()} Rüeger Malaysia Sdn Bhd, An Ashcroft
        Company. All rights reserved. Developed by Adrian Norman Khusairi,
        Software Engineering student at Universiti Teknologi Malaysia.
      </Typography>
    </Box>
  );
};

export default Footer;
