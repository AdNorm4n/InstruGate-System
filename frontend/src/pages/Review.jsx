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
            fontFamily: "Helvetica, sans-serif",
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
            fontFamily: "Helvetica, sans-serif",
            fontWeight: "bold",
          }}
        >
          No configuration data found.
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={500}>
      <Box
        className="configurator-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />

        <main style={{ flex: 1 }}>
          <Container sx={{ py: 4, mt: 12 }}>
            <Box className="configurator-header">
              <Typography
                variant="h5"
                align="center"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 0,
                  textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
                  color: "#000000",
                }}
              >
                Review Your Configuration
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
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
                  borderRadius: 2,
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
              variant="body1"
              align="center"
              sx={{
                mb: 4,
                fontFamily: "Helvetica, sans-serif",
                color: "#000000",
              }}
            >
              {instrument.name}
            </Typography>
            <Typography
              className="product-code"
              variant="body1"
              align="center"
              sx={{
                mb: 6,
                fontWeight: "bold",
                fontFamily: "Helvetica, sans-serif",
                textTransform: "uppercase",
                color: "#0a5",
              }}
            >
              Product Code: {productCode}
            </Typography>

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

            <Box className="review-section">
              <Typography
                variant="subtitle1"
                className="section-heading"
                sx={{
                  mb: 3,
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "#2c3e50",
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
                          fontFamily: "Helvetica, sans-serif",
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
                        fontFamily: "Helvetica, sans-serif",
                        color: "#666",
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            <Box className="review-section">
              <Typography
                variant="subtitle1"
                className="section-heading"
                sx={{
                  mb: 3,
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  color: "#2c3e50",
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
                          fontFamily: "Helvetica, sans-serif",
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
                        fontFamily: "Helvetica, sans-serif",
                        color: "#666",
                      }}
                    />
                  </ListItem>
                )}
              </List>
            </Box>

            <Box
              className={`action-section ${
                isClicked ? "action-section-clicked" : ""
              }`}
            >
              <Button
                className="next-button"
                variant="contained"
                onClick={handleClick}
                disabled={isClicked}
                sx={{
                  fontFamily: "Helvetica, sans-serif",
                  backgroundColor: "#1976d2",
                  color: "white",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                  "&:hover": {
                    backgroundColor: "#34495e",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    transform: "scale(1.05)",
                  },
                  "&.Mui-disabled": {
                    opacity: 0.6,
                    backgroundColor: "#2c3e50",
                    color: "white",
                  },
                }}
              >
                {isClicked ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Add to Quotation"
                )}
              </Button>
            </Box>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default Review;
