import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Configurator.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function Review() {
  const location = useLocation();
  const navigate = useNavigate();
  const { instrument, selections, selectedAddOns, productCode } =
    location.state || {};
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const userRes = await api.get("/api/users/me/");
        setUserRole(userRes.data.role);
        console.log("User role:", userRes.data.role);
      } catch (err) {
        console.error("Failed to fetch user role:", err);
        setUserRole("error");
      } finally {
        setLoading(false);
      }
    };
    fetchUserRole();
  }, []);

  console.log("Review state:", {
    instrument,
    selections,
    selectedAddOns,
    productCode,
  });

  const handleAddToCart = () => {
    const existingCart =
      JSON.parse(localStorage.getItem("selectedInstruments")) || [];

    const newInstrument = {
      instrument,
      selections,
      selectedAddOns,
      productCode,
    };

    const updatedCart = [...existingCart, newInstrument];
    localStorage.setItem("selectedInstruments", JSON.stringify(updatedCart));
    console.log("Updated cart:", updatedCart);

    navigate("/selected-instruments");
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading review...
        </Typography>
      </div>
    );
  }

  if (!instrument) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <Typography variant="h6" color="error">
          No configuration data found.
        </Typography>
      </div>
    );
  }

  return (
    <div
      className="configurator-page"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Navbar userRole={userRole} />
      <DrawerHeader />

      <main style={{ flex: 1 }}>
        <Container maxWidth="xl" sx={{ py: 4, mt: 10 }}>
          <Typography
            variant="h5"
            align="center"
            gutterBottom
            sx={{
              fontWeight: "bold",
              color: "#000000",
              fontFamily: "Helvetica, sans-serif",
              textTransform: "uppercase",
              letterSpacing: 0,
              mb: 4,
              textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
            }}
          >
            Review Your Configuration
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{ mb: 4, color: "text.secondary" }}
          >
            {instrument.name}
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 6, fontWeight: "bold" }}
          >
            Product Code: {productCode}
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 4, fontWeight: "bold" }}>
              Requirements Selected
            </Typography>
            <List>
              {Object.values(selections).length > 0 ? (
                Object.values(selections).map((selection, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemText
                      primary={`[${selection.code}] ${selection.label}`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem disablePadding>
                  <ListItemText primary="No requirements selected." />
                </ListItem>
              )}
            </List>
          </Box>

          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
              Optional Add-Ons Selected
            </Typography>
            <List>
              {selectedAddOns.length > 0 ? (
                selectedAddOns.map((addon, idx) => (
                  <ListItem key={idx} disablePadding>
                    <ListItemText
                      primary={`[${addon.code}] ${addon.label} (${addon.addon_type.name})`}
                    />
                  </ListItem>
                ))
              ) : (
                <ListItem disablePadding>
                  <ListItemText primary="No Add-Ons selected." />
                </ListItem>
              )}
            </List>
          </Box>

          <Button
            variant="contained"
            color="primary"
            onClick={handleAddToCart}
            sx={{ mt: 2, borderRadius: 2 }}
          >
            Add to Quotation
          </Button>
        </Container>
      </main>
    </div>
  );
}

export default Review;
