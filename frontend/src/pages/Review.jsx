import React, { useEffect, useState, useContext } from "react";
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
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import { UserContext } from "../contexts/UserContext";
import "../styles/Review.css";

// Utility function to format price as RM10,000.00
const formatPrice = (price) => {
  if (price == null || isNaN(price)) return "RM0.00";
  return `RM${Number(price).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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
  fontFamily: "Helvetica, sans-serif",
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
  const { userRole } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const { instrument, selections, selectedAddOns, productCode, totalPrice } =
    location.state || {};
  const [loading, setLoading] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);

  const baseUrl = "http://127.0.0.1:8000";
  const imageUrl = instrument?.image
    ? new URL(instrument.image, baseUrl).href
    : null;

  console.log("Review image:", instrument?.image, "Full URL:", imageUrl);

  console.log("Review state:", {
    instrument,
    selections,
    selectedAddOns,
    productCode,
    totalPrice,
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
          totalPrice,
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

  // Calculate price breakdown for summary, matching Configurator.jsx
  const priceBreakdown = [
    { label: "Base Price", value: parseFloat(instrument?.base_price || 0) },
    { label: "Selected Requirements:", value: null },
    ...Object.values(selections || {}).map((opt) => ({
      label: `${opt.label} (${opt.code})`,
      value: parseFloat(opt?.price || 0),
    })),
    ...(selectedAddOns?.length > 0
      ? [
          { label: "Selected Add-ons:", value: null },
          ...Object.entries(
            selectedAddOns.reduce((acc, addon) => {
              const typeName = addon.addon_type.name;
              if (!acc[typeName]) acc[typeName] = [];
              acc[typeName].push(addon);
              return acc;
            }, {})
          )
            .sort()
            .flatMap(([typeName, addons]) => [
              { label: `${typeName}:`, value: null },
              ...addons.map((addon) => ({
                label: `${addon.label} (${addon.code})`,
                value: parseFloat(addon?.price || 0),
              })),
            ]),
        ]
      : []),
  ];

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
        <DrawerHeader />

        <main style={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 6, mt: 8 }}>
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "Helvetica, sans-serif",
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
                fontFamily: "Helvetica, sans-serif",
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
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  color: "#000000",
                  textTransform: "uppercase",
                }}
              >
                {instrument.name}
              </Typography>
              <Typography
                className="product-code"
                variant="subtitle1"
                align="center"
                sx={{
                  mb: 4,
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif",
                  textTransform: "uppercase",
                  color: "#0a5",
                }}
              >
                Product Code: {productCode}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif",
                    color: "#000000",
                    textTransform: "uppercase",
                  }}
                >
                  Selection Summary
                </Typography>
                {priceBreakdown.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Helvetica, sans-serif",
                        color:
                          item.label === "Selected Requirements:" ||
                          item.label === "Selected Add-ons:" ||
                          item.label.endsWith(":")
                            ? "#000000"
                            : "#333",
                        fontWeight:
                          item.label === "Selected Requirements:" ||
                          item.label === "Selected Add-ons:" ||
                          item.label.endsWith(":")
                            ? "bold"
                            : "normal",
                      }}
                    >
                      {item.label}
                    </Typography>
                    {item.value !== null && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          fontWeight: "bold",
                          color: "#000000",
                        }}
                      >
                        {formatPrice(item.value)}
                      </Typography>
                    )}
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Helvetica, sans-serif",
                      color: "#0a5",
                      textTransform: "uppercase",
                    }}
                  >
                    Total Price
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Helvetica, sans-serif",
                      color: "#0a5",
                      textTransform: "uppercase",
                    }}
                  >
                    {formatPrice(parseFloat(totalPrice || 0))}
                  </Typography>
                </Box>
              </Box>
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
