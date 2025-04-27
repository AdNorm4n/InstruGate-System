import React from "react";
import Form from "../components/Form";
import { Stack, Box, Paper } from "@mui/material";
import "../styles/Login.css";
import logo from "../assets/instrugate.png";

function Login() {
  return (
    <Stack direction="row" justifyContent="center">
      <Box className="logo">
        <img src={logo} alt="Logo" style={{ height: 200, width: 200 }} />
      </Box>

      <Paper elevation={3} className="border-box">
        <Form route="/api/token/" method="login" />
      </Paper>
    </Stack>
  );
}

export default Login;
