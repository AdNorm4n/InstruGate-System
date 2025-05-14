import React from "react";
import { Box, Typography } from "@mui/material";

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: "#d6393a",
        boxShadow: 3,
        textAlign: "center",
        py: 2,
        width: "100%",
        mt: "auto", // important for flex-grow layout
      }}
    >
      <Typography variant="body2" sx={{ color: "#ffffff", fontWeight: 500 }}>
        © {new Date().getFullYear()} Rüeger Malaysia Sdn Bhd, An Ashcroft
        Company. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
