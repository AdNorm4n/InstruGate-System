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
            fontFamily: "Helvetica, sans-serif",
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
            fontFamily: "Roboto, sans-serif",
            fontWeight: "bold",
            fontSize: "1.5rem",
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
          background: "linear-gradient(to bottom, #f5f5f5, #e9ecef)",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />

        <main style={{ flex: 1 }}>
          <Container sx={{ py: 4, mt: 12 }}>
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
              selected instruments
            </Typography>

            {selectedInstruments.length === 0 ? (
              <Box
                className="action-section"
                sx={{ textAlign: "center", mt: 20 }}
              >
                <Typography
                  variant="h6"
                  color="error"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: "bold",
                  }}
                >
                  Your cart is empty. Explore our instruments to get started.
                </Typography>
                <Button
                  className="primary-button"
                  variant="contained"
                  onClick={() => handleClick("add", "/instruments")}
                  disabled={isClicked === "add"}
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
                  {isClicked === "add" ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Add Instruments"
                  )}
                </Button>
              </Box>
            ) : (
              <>
                <Box
                  className={`action-section ${
                    isClicked ? "action-section-clicked" : ""
                  }`}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 8,
                    px: 4, // optional padding
                  }}
                >
                  {/* Left Button */}
                  <Button
                    className="primary-button"
                    variant="contained"
                    onClick={() => handleClick("add", "/instruments")}
                    disabled={isClicked === "add"}
                    sx={{
                      fontFamily: "Helvetica, sans-serif",
                      "&.Mui-disabled": { opacity: 0.6 },
                    }}
                  >
                    {isClicked === "add" ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                      "Add More"
                    )}
                  </Button>

                  {/* Center Button */}
                  <Button
                    className="primary-button"
                    variant="contained"
                    onClick={() =>
                      handleClick("proceed", "/quotation", {
                        selectedInstruments,
                        userData,
                      })
                    }
                    disabled={isClicked === "proceed"}
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
                    {isClicked === "proceed" ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                      "Proceed to Quotation"
                    )}
                  </Button>

                  {/* Right Button */}
                  <Button
                    className="danger-button"
                    variant="contained"
                    onClick={() => {
                      setIsClicked("clear");
                      setTimeout(() => {
                        clearAllInstruments();
                      }, 300);
                    }}
                    disabled={isClicked === "clear"}
                    sx={{
                      fontFamily: "Helvetica, sans-serif",
                      backgroundColor: "#d6393a",
                      color: "white",
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
                      "&:hover": {
                        backgroundColor: "#d6393a",
                        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                        transform: "scale(1.05)",
                      },
                      "&.Mui-disabled": {
                        opacity: 0.6,
                        backgroundColor: "#d6393a",
                        color: "white",
                      },
                    }}
                  >
                    {isClicked === "clear" ? (
                      <CircularProgress size={24} sx={{ color: "white" }} />
                    ) : (
                      "Clear Cart"
                    )}
                  </Button>
                </Box>

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
