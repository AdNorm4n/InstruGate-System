import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Fade,
  Container,
  Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import AddCircleOutline from "@mui/icons-material/AddCircleOutline";
import api from "../api";
import Navbar from "../components/Navbar";
import InstrumentCard from "../components/InstrumentCard";
import "../styles/SelectedInstruments.css";

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

const DangerButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#d6393a",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif",
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
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [userData, setUserData] = useState({
    username: "",
    first_name: "",
    company: "",
  });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClicked, setIsClicked] = useState(null);
  const [isImageEnlarged, setIsImageEnlarged] = useState(null);

  const baseUrl = "http://127.0.0.1:8000";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get("/api/users/me/");
        setUserRole(userRes.data.role);
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
        }));
        setSelectedInstruments(updatedCart);
        localStorage.setItem(
          "selectedInstruments",
          JSON.stringify(updatedCart)
        );
        console.log("Selected instruments:", updatedCart);
      } catch (err) {
        console.error("Error fetching data:", err);
        setUserRole("error");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const updateInstrumentQuantity = (index, newQuantity) => {
    if (newQuantity <= 0) {
      removeInstrument(index);
      return;
    }
    const updated = [...selectedInstruments];
    updated[index] = { ...updated[index], quantity: newQuantity };
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
    const confirmed = window.confirm(
      "Are you sure you want to clear your cart?"
    );
    if (confirmed) {
      setSelectedInstruments([]);
      localStorage.setItem("selectedInstruments", JSON.stringify([]));
      console.log("Cleared all selectedInstruments");
    } else {
      console.log("Cart clear canceled");
      setIsClicked(null);
    }
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
          Loading your cart...
        </Typography>
      </Box>
    );
  }

  if (userRole === "error") {
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
              Selected Instruments
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
              Review your selected instruments and proceed to quotation.
            </Typography>

            {selectedInstruments.length === 0 ? (
              <ToolCard sx={{ textAlign: "center", mt: 8, mb: 6 }}>
                <Typography
                  variant="h6"
                  color="error"
                  sx={{
                    fontFamily: "Helvetica, sans-serif !important",
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
                <ToolCard sx={{ mb: 6 }}>
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
                        setTimeout(() => {
                          clearAllInstruments();
                        }, 300);
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
                </ToolCard>

                <Grid container spacing={4}>
                  {selectedInstruments.map((item, index) => {
                    const imageUrl = item.instrument?.image
                      ? new URL(item.instrument.image, baseUrl).href
                      : null;
                    return (
                      <Grid item xs={12} sm={6} md={4} key={index}>
                        <InstrumentCard
                          instrument={item.instrument}
                          userRole={userRole}
                          configData={null}
                          productCode={item.productCode}
                          requirements={Object.values(item.selections)}
                          addOns={item.selectedAddOns}
                          quantity={item.quantity}
                          onQuantityChange={(newQuantity) =>
                            updateInstrumentQuantity(index, newQuantity)
                          }
                          onRemove={() => removeInstrument(index)}
                          onImageClick={() => handleImageClick(index)}
                          isSelectedInstrument
                        />
                        {isImageEnlarged === index && (
                          <Box
                            className="image-overlay"
                            onClick={handleCloseOverlay}
                          >
                            <Box className="enlarged-image-container">
                              <img
                                src={imageUrl}
                                alt={item.instrument.name}
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
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            )}
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default SelectedInstruments;
