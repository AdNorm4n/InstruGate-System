// src/pages/Register.jsx
import React from "react";
import Form from "../components/Form";
import { Stack, Box, Paper } from "@mui/material";
import "../styles/Form.css"; // shared styles
import logo from "../assets/instrugate1.png";
import companylogo from "../assets/companylogo.png"; // optional, like in login

function Register() {
  return (
    <div className="auth-wrapper">
      <Stack direction="row" className="auth-container register-layout">
        <Box className="logo-panel register-logo-panel">
          <img src={logo} alt="Instrugate Logo" className="logo-img" />
          <img src={companylogo} alt="Company Logo" className="partner-logo" />
        </Box>
        <Paper elevation={3} className="form-panel">
          <Form route="/api/users/register/" method="register" />
        </Paper>
      </Stack>
    </div>
  );
}

export default Register;
