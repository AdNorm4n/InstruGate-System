import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Fade,
  Container,
  IconButton,
  Snackbar,
  Alert,
  Backdrop,
  Divider,
  TextField,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import RemoveCircleOutline from "@mui/icons-material/RemoveCircleOutline";
import api from "../api";
import { UserContext } from "../contexts/UserContext";
import "../styles/SelectedInstruments.css";

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
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Inter, sans-serif",
  width: "100%",
  boxSizing: "border-box",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Inter, sans-serif",
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

const DangerButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#d6393a",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Inter, sans-serif",
  "&:hover": {
    backgroundColor: "#b32d2e",
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

function SelectedInstruments() {
  const { userRole } = useContext(UserContext);
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [userData, setUserData] = useState({
    username: "",
    first_name: "",
    company: "",
  });
  const [loading, setLoading] = useState(true);
  const [isClicked, setIsClicked] = useState(null);
  const [isImageEnlarged, setIsImageEnlarged] = useState(null);
  const [openConfirmClear, setOpenConfirmClear] = useState(false);

  const baseUrl = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get("/api/users/me/");
        setUserData({
          username: userRes.data.username || "Guest",
          first_name: userRes.data.first_name || "Guest",
          company: userRes.data.company || "Unknown",
        });
        console.log("User data:", userRes.data);

        const cart =
          JSON.parse(localStorage.getItem("selectedInstruments")) || [];
        const updatedCart = cart.map((item) => ({
          ...item,
          quantity: item.quantity || 1,
          totalPrice: item.totalPrice || calculateInstrumentTotalPrice(item),
        }));
        setSelectedInstruments(updatedCart);
        localStorage.setItem(
          "selectedInstruments",
          JSON.stringify(updatedCart)
        );
        console.log("Selected instruments:", updatedCart);
      } catch (err) {
        console.error("Error fetching data:", err);
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const calculateInstrumentTotalPrice = (item) => {
    const priceBreakdown = [
      { value: parseFloat(item.instrument?.base_price || 0) },
      ...Object.values(item.selections || {}).map((opt) => ({
        value: parseFloat(opt?.price || 0),
      })),
      ...(item.selectedAddOns || []).map((addon) => ({
        value: parseFloat(addon?.price || 0),
      })),
    ];
    return priceBreakdown.reduce((sum, item) => sum + item.value, 0);
  };

  const updateInstrumentQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeInstrument(index);
      return;
    }
    const updated = [...selectedInstruments];
    updated[index] = {
      ...updated[index],
      quantity: newQuantity,
      totalPrice: calculateInstrumentTotalPrice(updated[index]) * newQuantity,
    };
    setSelectedInstruments(updated);
    localStorage.setItem("selectedInstruments", JSON.stringify(updated));
    console.log("Updated selectedInstruments:", updated);
  };

  const removeInstrument = (indexToRemove) => {
    const updated = selectedInstruments.filter(
      (_, index) => index !== indexToRemove
    );
    setSelectedInstruments(updated);
    localStorage.setItem("selectedInstruments", JSON.stringify(updated));
    console.log("Removed instrument at index:", indexToRemove);
  };

  const clearAllInstruments = () => {
    setOpenConfirmClear(true);
  };

  const handleConfirmClear = () => {
    setSelectedInstruments([]);
    localStorage.setItem("selectedInstruments", JSON.stringify([]));
    console.log("Cleared all selectedInstruments");
    setOpenConfirmClear(false);
    setIsClicked(null);
  };

  const handleCancelClear = () => {
    console.log("Cart clear canceled");
    setOpenConfirmClear(false);
    setIsClicked(null);
  };

  const handleClick = (action, path = null, state = null) => {
    setIsClicked(action);
    console.log("handleClick called:", { action, path, state });
    setTimeout(() => {
      try {
        if (path) {
          console.log("Navigating to:", path, "with state:", state);
          navigate(path, { state });
        }
        setIsClicked(null);
      } catch (err) {
        console.error("Navigation error:", err);
        alert("Failed to navigate");
        setIsClicked(null);
      }
    }, 300);
  };

  const handleImageClick = (index) => {
    if (selectedInstruments[index]?.instrument?.image) {
      setIsImageEnlarged(index);
      console.log("Image clicked, opening overlay for index:", index);
    }
  };

  const handleCloseOverlay = () => {
    setIsImageEnlarged(null);
    console.log("Closing image overlay");
  };

  // Calculate price breakdown for each instrument
  const getPriceBreakdown = (item) => {
    return [
      {
        label: "Base Price",
        value: parseFloat(item.instrument?.base_price || 0),
      },
      ...(Object.values(item.selections || {}).length > 0
        ? [
            { label: "Selected Requirements:", value: null },
            ...Object.values(item.selections || {}).map((opt) => ({
              label: `${opt.label || "N/A"} (${opt.code || "N/A"})`,
              value: parseFloat(opt?.price || 0),
            })),
          ]
        : []),
      ...(item.selectedAddOns?.length > 0
        ? [
            { label: "Selected Add-ons:", value: null },
            ...Object.entries(
              (item.selectedAddOns || []).reduce((acc, addon) => {
                const typeName = addon.addon_type?.name || "Other";
                if (!acc[typeName]) acc[typeName] = [];
                acc[typeName].push(addon);
                return acc;
              }, {})
            )
              .sort()
              .flatMap(([typeName, addons]) => [
                { label: `${typeName}:`, value: null },
                ...addons.map((addon) => ({
                  label: `${addon.label || "N/A"} (${addon.code || "N/A"})`,
                  value: parseFloat(addon?.price || 0),
                })),
              ]),
          ]
        : []),
    ];
  };

  // Calculate overall total price
  const overallTotalPrice = selectedInstruments.reduce((sum, item) => {
    const totalPrice = getPriceBreakdown(item)
      .filter((pb) => pb.value !== null)
      .reduce((pbSum, pb) => pbSum + pb.value, 0);
    return sum + totalPrice * (item.quantity || 1);
  }, 0);

  if (loading) {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <CircularProgress />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            fontFamily: "Inter, sans-serif",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Loading your cart...
        </Typography>
      </Box>
    );
  }

  if (!userRole) {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <Typography
          variant="h6"
          color="error"
          sx={{
            fontFamily: "Inter, sans-serif",
            fontWeight: "bold",
          }}
        >
          Failed to load user data. Please log in again.
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box
        className="selected-instruments-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
        }}
      >
        <DrawerHeader />

        <main style={{ flex: 1 }}>
          <Container
            maxWidth="lg"
            sx={{
              py: 2,
              px: { xs: 2, sm: 3, md: 4 },
              mx: "auto",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Typography
              variant="h6"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "Inter, sans-serif",
                fontWeight: "bold",
                color: "#000000",
                textTransform: "uppercase",
                mb: 4,
                fontSize: { xs: "1.5rem", md: "2rem" },
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Selected Instruments
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontFamily: "Inter, sans-serif",
                color: "#333",
                mb: 6,
                fontSize: "0.9rem",
              }}
            >
              Review your selected instruments and proceed to quotation.
            </Typography>

            {selectedInstruments.length === 0 ? (
              <ToolCard
                sx={{ textAlign: "center", mt: 8, mb: 6, maxWidth: "100%" }}
              >
                <Typography
                  variant="h6"
                  color="error"
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontWeight: "bold",
                    mb: 4,
                  }}
                >
                  Your cart is empty. Explore our instruments to get started.
                </Typography>
                <CTAButton
                  variant="contained"
                  onClick={() => handleClick("add", "/instruments")}
                  disabled={isClicked === "add"}
                >
                  {isClicked === "add" ? (
                    <CircularProgress size={24} />
                  ) : (
                    "Add Instruments"
                  )}
                </CTAButton>
              </ToolCard>
            ) : (
              <>
                <ToolCard sx={{ mb: 6, maxWidth: "100%" }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 2,
                    }}
                  >
                    <CTAButton
                      variant="contained"
                      onClick={() => handleClick("add", "/instruments")}
                      disabled={isClicked === "add"}
                    >
                      {isClicked === "add" ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Add More"
                      )}
                    </CTAButton>
                    <CTAButton
                      variant="contained"
                      onClick={() =>
                        handleClick("proceed", "/quotation", {
                          selectedInstruments,
                          userData,
                        })
                      }
                      disabled={isClicked === "proceed"}
                    >
                      {isClicked === "proceed" ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Proceed to Quotation"
                      )}
                    </CTAButton>
                    <DangerButton
                      variant="contained"
                      onClick={() => {
                        setIsClicked("clear");
                        clearAllInstruments();
                      }}
                      disabled={isClicked === "clear"}
                    >
                      {isClicked === "clear" ? (
                        <CircularProgress size={24} />
                      ) : (
                        "Clear Cart"
                      )}
                    </DangerButton>
                  </Box>
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        fontFamily: "Inter, sans-serif",
                        color: "#0a5",
                        textTransform: "uppercase",
                      }}
                    >
                      Quotation Summary
                    </Typography>
                    {selectedInstruments.map((item, index) => {
                      const priceBreakdown = getPriceBreakdown(item);
                      const totalPrice = priceBreakdown
                        .filter((pb) => pb.value !== null)
                        .reduce((sum, pb) => sum + pb.value, 0);
                      const totalWithQuantity =
                        totalPrice * (item.quantity || 1);

                      return (
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
                              fontFamily: "Inter, sans-serif",
                              color: "#333",
                            }}
                          >
                            {item.instrument?.name || "Unnamed Instrument"}:{" "}
                            {item.productCode || "N/A"} x {item.quantity || 1}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              fontWeight: "bold",
                              color: "#000000",
                            }}
                          >
                            {formatPrice(totalWithQuantity)}
                          </Typography>
                        </Box>
                      );
                    })}
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Inter, sans-serif",
                          color: "#0a5",
                          textTransform: "uppercase",
                        }}
                      >
                        Grand Total
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Inter, sans-serif",
                          color: "#0a5",
                          textTransform: "uppercase",
                        }}
                      >
                        {formatPrice(overallTotalPrice)}
                      </Typography>
                    </Box>
                  </Box>
                </ToolCard>

                {selectedInstruments.map((item, index) => {
                  const imageUrl = item.instrument?.image
                    ? new URL(item.instrument.image, baseUrl).href
                    : null;
                  const priceBreakdown = getPriceBreakdown(item);
                  const totalPrice = priceBreakdown
                    .filter((pb) => pb.value !== null)
                    .reduce((sum, pb) => sum + pb.value, 0);
                  const totalWithQuantity = totalPrice * (item.quantity || 1);

                  return (
                    <ToolCard
                      key={index}
                      sx={{ mb: 4, maxWidth: "100%", position: "relative" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                          alignItems: "flex-start",
                        }}
                      >
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={item.instrument?.name || "Instrument"}
                            style={{
                              width: "150px",
                              height: "150px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                              cursor: "pointer",
                            }}
                            onClick={() => handleImageClick(index)}
                            onError={(e) => {
                              console.log("Image load error:", imageUrl);
                              e.target.style.display = "none";
                              e.target.nextSibling.style.display = "flex";
                            }}
                          />
                        ) : (
                          <Box
                            sx={{
                              width: "150px",
                              height: "150px",
                              bgcolor: "e0e0e0",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Typography
                              variant="body2"
                              sx={{
                                color: "#666",
                                fontFamily: "Inter, sans-serif",
                              }}
                            >
                              No Image
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "bold",
                              fontFamily: "Inter, sans-serif",
                              color: "#000000",
                              textTransform: "uppercase",
                            }}
                          >
                            {item.instrument?.name || "Unnamed Instrument"}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "bold",
                              fontFamily: "Inter, sans-serif",
                              color: "#0a5",
                              textTransform: "uppercase",
                              mt: 1,
                            }}
                          >
                            Product Code: {item.productCode || "N/A"}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: "bold",
                                fontFamily: "Inter, sans-serif",
                                color: "#0a5",
                                textTransform: "uppercase",
                              }}
                            >
                              Quantity: {item.quantity || 1}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <TextField
                                type="number"
                                value={item.quantity || 1}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value, 10);
                                  if (!isNaN(value) && value >= 1) {
                                    updateInstrumentQuantity(index, value);
                                  }
                                }}
                                variant="outlined"
                                size="medium"
                                sx={{
                                  width: "100px",
                                  "& .MuiInputBase-root": {
                                    fontFamily: "Inter, sans-serif",
                                    fontSize: "1rem",
                                    borderRadius: "12px",
                                  },
                                  "& .MuiInputBase-input": {
                                    padding: "8px 12px",
                                    textAlign: "center",
                                  },
                                  "& .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#0a5",
                                    borderRadius: "12px",
                                  },
                                  "&:hover .MuiOutlinedInput-notchedOutline": {
                                    borderColor: "#087",
                                  },
                                  "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                    {
                                      borderColor: "#087",
                                      borderWidth: "2px",
                                    },
                                }}
                                inputProps={{ min: 1 }}
                              />
                            </Box>
                          </Box>
                          <Divider sx={{ my: 2 }} />
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "bold",
                              fontFamily: "Inter, sans-serif",
                              color: "#000000",
                              textTransform: "uppercase",
                              mb: 1,
                            }}
                          >
                            Selection Summary
                          </Typography>
                          {priceBreakdown.map((pb, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 2,
                                mt: 1,
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "Inter, sans-serif",
                                  color:
                                    pb.label === "Selected Requirements:" ||
                                    pb.label === "Selected Add-ons:" ||
                                    pb.label.endsWith(":")
                                      ? "#000000"
                                      : "#333",
                                  fontWeight:
                                    pb.label === "Selected Requirements:" ||
                                    pb.label === "Selected Add-ons:" ||
                                    pb.label.endsWith(":")
                                      ? "bold"
                                      : "normal",
                                  flex: 1,
                                }}
                              >
                                {pb.label}
                              </Typography>
                              {pb.value !== null && (
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontFamily: "Inter, sans-serif",
                                    fontWeight: "bold",
                                    color: "#000000",
                                    textAlign: "right",
                                    minWidth: "80px",
                                  }}
                                >
                                  {formatPrice(pb.value)}
                                </Typography>
                              )}
                            </Box>
                          ))}
                          <Divider sx={{ my: 2 }} />
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              mt: 1,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: "bold",
                                fontFamily: "Inter, sans-serif",
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
                                fontFamily: "Inter, sans-serif",
                                color: "#0a5",
                                textTransform: "uppercase",
                                textAlign: "right",
                                minWidth: "80px",
                              }}
                            >
                              {formatPrice(totalWithQuantity)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                      <IconButton
                        onClick={() => removeInstrument(index)}
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                          color: "#d6393a",
                          bgcolor: "#ffffff",
                          borderRadius: "50%",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          "&:hover": {
                            bgcolor: "#f5f5f5",
                            color: "#b32d2e",
                          },
                        }}
                        aria-label="Remove instrument"
                      >
                        <RemoveCircleOutline sx={{ color: "#d32f2f" }} />
                      </IconButton>
                    </ToolCard>
                  );
                })}
                {isImageEnlarged !== null && (
                  <Box className="image-overlay" onClick={handleCloseOverlay}>
                    <Box className="enlarged-image-container">
                      <img
                        src={
                          new URL(
                            selectedInstruments[
                              isImageEnlarged
                            ]?.instrument?.image,
                            baseUrl
                          ).href
                        }
                        alt={
                          selectedInstruments[isImageEnlarged]?.instrument
                            ?.name || "Instrument"
                        }
                        className="enlarged-image"
                      />
                      <button
                        className="close-button"
                        onClick={handleCloseOverlay}
                      >
                        ×
                      </button>
                    </Box>
                  </Box>
                )}
                <ToolCard sx={{ mb: 4, maxWidth: "100%" }}>
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        fontFamily: "Inter, sans-serif",
                        color: "#0a5",
                        textTransform: "uppercase",
                      }}
                    >
                      Quotation Summary
                    </Typography>
                    {selectedInstruments.map((item, index) => {
                      const priceBreakdown = getPriceBreakdown(item);
                      const totalPrice = priceBreakdown
                        .filter((pb) => pb.value !== null)
                        .reduce((sum, pb) => sum + pb.value, 0);
                      const totalWithQuantity =
                        totalPrice * (item.quantity || 1);

                      return (
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
                              fontFamily: "Inter, sans-serif",
                              color: "#333",
                            }}
                          >
                            {item.instrument?.name || "Unnamed Instrument"}:{" "}
                            {item.productCode || "N/A"} x {item.quantity || 1}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              fontWeight: "bold",
                              color: "#000000",
                            }}
                          >
                            {formatPrice(totalWithQuantity)}
                          </Typography>
                        </Box>
                      );
                    })}
                    <Divider sx={{ my: 2 }} />
                    <Box
                      sx={{ display: "flex", justifyContent: "space-between" }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Inter, sans-serif",
                          color: "#0a5",
                          textTransform: "uppercase",
                        }}
                      >
                        Grand Total
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Inter, sans-serif",
                          color: "#0a5",
                          textTransform: "uppercase",
                        }}
                      >
                        {formatPrice(overallTotalPrice)}
                      </Typography>
                    </Box>
                  </Box>
                </ToolCard>
              </>
            )}
          </Container>
        </main>

        {/* Confirmation Snackbar */}
        <Box
          sx={{
            position: "fixed",
            top: 20,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            zIndex: 1400,
          }}
        >
          <Backdrop
            sx={{
              bgcolor: "rgba(0, 0, 0, 0.8)",
              zIndex: (theme) => theme.zIndex.modal - 1,
            }}
            open={openConfirmClear}
          />
          <Snackbar
            open={openConfirmClear}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              severity="warning"
              variant="filled"
              sx={{
                width: "100%",
                color: "white",
                backgroundColor: "#d32f2f",
                "& .MuiAlert-icon": {
                  color: "white",
                  svg: {
                    fill: "white",
                  },
                },
                "& .MuiAlert-action": {
                  color: "white",
                  svg: {
                    fill: "white",
                  },
                },
              }}
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleConfirmClear}
                    sx={{ color: "white", fontFamily: "Inter, sans-serif" }}
                  >
                    Confirm
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleCancelClear}
                    sx={{ color: "white", fontFamily: "Inter, sans-serif" }}
                  >
                    Cancel
                  </Button>
                </Box>
              }
            >
              Please confirm to clear selected instruments.
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Fade>
  );
}

export default SelectedInstruments;
