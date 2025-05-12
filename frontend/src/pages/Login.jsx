import React from "react";
import Form from "../components/Form";
import { Stack, Box, Paper, Typography } from "@mui/material";
import logo from "../assets/instrugate.png";
import companylogo from "../assets/companylogo.png"; // Ensure this logo is correct

function Login() {
  return (
    <div className="auth-wrapper">
      <Stack direction="row" className="auth-container">
        <Box className="logo-panel">
          <img src={logo} alt="Instrugate Logo" className="logo-img" />
          <img src={companylogo} alt="Company Logo" className="partner-logo" />
        </Box>
        <Paper elevation={3} className="form-panel">
          <Form route="/api/token/" method="login" />
        </Paper>
      </Stack>
    </div>
  );
}

export default Login;
