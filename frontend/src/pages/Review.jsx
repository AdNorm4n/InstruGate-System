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
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Review.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ToolCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif !important",
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif",
  "&:hover": {
    backgroundColor: "#1565c0",
    transform: "scale(1.05)",
  },
  "&.Mui-disabled": {
    backgroundColor: "#e0e0e0",
    color: "#999",
  },
  transition: "all 0.3s ease",
  "& .MuiCircularProgress-root": {
    color: "#ffffff",
  },
}));

function Review() {
  const location = useLocation();
  const navigate = useNavigate();
  const { instrument, selections, selectedAddOns, productCode } =
    location.state || {};
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClicked, setIsClicked] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

  const baseUrl = "http://127.0.0.1:8000";
  const imageUrl = instrument?.image
    ? new URL(instrument.image, baseUrl).href
    : null;

  console.log("Review image:", instrument?.image, "Full URL:", imageUrl);

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

  const handleClick = () => {
    setIsClicked(true);
    console.log("Adding to cart:", {
      instrument,
      selections,
      selectedAddOns,
      productCode,
    });
    setTimeout(() => {
      try {
        const existingCart =
          JSON.parse(localStorage.getItem("selectedInstruments")) || [];

        const newInstrument = {
          instrument,
          selections,
          selectedAddOns,
          productCode,
        };

        const updatedCart = [...existingCart, newInstrument];
        localStorage.setItem(
          "selectedInstruments",
          JSON.stringify(updatedCart)
        );
        console.log("Updated cart:", updatedCart);

        navigate("/selected-instruments");
      } catch (err) {
        console.error("Add to cart error:", err);
        alert("Failed to add to quotation");
        setIsClicked(false);
      }
    }, 100);
  };

  const handleImageClick = () => {
    if (imageUrl) {
      setIsImageEnlarged(true);
      console.log("Image clicked, opening overlay");
    }
  };

  const handleCloseOverlay = () => {
    setIsImageEnlarged(false);
    console.log("Closing image overlay");
  };

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <CircularProgress />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            fontFamily: "Helvetica, sans-serif !important",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Loading review...
        </Typography>
      </Box>
    );
  }

  if (!instrument) {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <Typography
          variant="h6"
          color="error"
          sx={{
            fontFamily: "Helvetica, sans-serif !important",
            fontWeight: "bold",
          }}
        >
          No configuration data found.
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box
        className="review-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />

        <main style={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 6, mt: 8 }}>
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                fontWeight: "bold",
                color: "#000000",
                textTransform: "uppercase",
                mb: 4,
                fontSize: { xs: "1.5rem", md: "2rem" },
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Review Your Configuration
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                color: "#333",
                mb: 6,
                fontSize: "0.9rem",
              }}
            >
              Confirm your instrument selections and add-ons.
            </Typography>

            <ToolCard sx={{ mb: 6 }}>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={instrument.name}
                    className="instrument-image"
                    onClick={handleImageClick}
                    onError={(e) => {
                      console.log("Image load error:", imageUrl);
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                    style={{ cursor: "pointer" }}
                  />
                ) : null}
                <Box
                  className="image-fallback"
                  sx={{
                    width: 150,
                    height: 150,
                    bgcolor: "#e0e0e0",
                    borderRadius: "8px",
                    display: imageUrl ? "none" : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No Image
                  </Typography>
                </Box>
              </Box>
              <Typography
                variant="h6"
                align="center"
                sx={{
                  mb: 2,
                  fontFamily: "Helvetica, sans-serif !important",
                  fontWeight: "bold",
                  color: "#000000",
                  textTransform: "uppercase",
                }}
              >
                {instrument.name}
              </Typography>
              <Typography
                className="product-code"
                variant="body1"
                align="center"
                sx={{
                  mb: 4,
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif !important",
                  textTransform: "uppercase",
                  color: "#0a5",
                }}
              >
                Product Code: {productCode}
              </Typography>
            </ToolCard>

            {isImageEnlarged && (
              <Box className="image-overlay" onClick={handleCloseOverlay}>
                <Box className="enlarged-image-container">
                  <img
                    src={imageUrl}
                    alt={instrument.name}
                    className="enlarged-image"
                  />
                  <button className="close-button" onClick={handleCloseOverlay}>
                    ×
                  </button>
                </Box>
              </Box>
            )}

            <ToolCard sx={{ mb: 6 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 3,
                  fontFamily: "Helvetica, sans-serif !important",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "#00000",
                }}
              >
                Requirements Selected
              </Typography>
              <List className="review-list">
                {Object.values(selections).length > 0 ? (
                  Object.values(selections).map((selection, idx) => (
                    <ListItem key={idx} className="review-item">
                      <ListItemText
                        primary={`[${selection.code}] ${selection.label}`}
                        primaryTypographyProps={{
                          fontFamily: "Helvetica, sans-serif !important",
                          color: "#333",
                        }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem className="review-item">
                    <ListItemText
                      primary="No requirements selected."
                      primaryTypographyProps={{
                        fontFamily: "Helvetica, sans-serif !important",
                        color: "#666",
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </ToolCard>

            <ToolCard sx={{ mb: 6 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  mb: 3,
                  fontFamily: "Helvetica, sans-serif !important",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "#00000",
                }}
              >
                Optional Add-Ons Selected
              </Typography>
              <List className="review-list">
                {selectedAddOns.length > 0 ? (
                  selectedAddOns.map((addon, idx) => (
                    <ListItem key={idx} className="review-item">
                      <ListItemText
                        primary={`[${addon.code}] ${addon.label} (${addon.addon_type.name})`}
                        primaryTypographyProps={{
                          fontFamily: "Helvetica, sans-serif !important",
                          color: "#333",
                        }}
                      />
                    </ListItem>
                  ))
                ) : (
                  <ListItem className="review-item">
                    <ListItemText
                      primary="No add-ons selected."
                      primaryTypographyProps={{
                        fontFamily: "Helvetica, sans-serif !important",
                        color: "#666",
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </ToolCard>

            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <CTAButton
                variant="contained"
                onClick={handleClick}
                disabled={isClicked}
              >
                {isClicked ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Add to Quotation"
                )}
              </CTAButton>
            </Box>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default Review;
