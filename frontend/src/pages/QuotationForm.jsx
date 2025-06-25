import React, { useEffect, useState, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  CircularProgress,
  Fade,
  TextField,
  Snackbar,
  Alert,
  Backdrop,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import { UserContext } from "../contexts/UserContext";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/QuotationForm.css";

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
  fontFamily: "Helvetica, sans-serif",
  width: "100%",
  boxSizing: "border-box",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

function QuotationForm() {
  const { userRole } = useContext(UserContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isClicked, setIsClicked] = useState(false);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState("");
  const [openConfirmSubmit, setOpenConfirmSubmit] = useState(false);
  const [openSuccess, setOpenSuccess] = useState(false);

  const baseUrl = "http://127.0.0.1:8000";

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let access = getToken();
        const refresh = getRefreshToken();

        if (!access || !refresh) {
          throw new Error("No tokens found");
        }

        const decoded = jwtDecode(access);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          const res = await api.post("/api/token/refresh/", { refresh });
          access = res.data.access;
          localStorage.setItem(ACCESS_TOKEN, access);
          console.log("Token refreshed:", access);
        }

        const userRes = await api.get("/api/users/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });
        console.log(
          "Full user data response:",
          JSON.stringify(userRes.data, null, 2)
        );
        setUserData(userRes.data);
        console.log("User data:", userRes.data);

        setSelectedInstruments(location.state?.selectedInstruments || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load data. Please log in again.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [location.state, navigate]);

  const handleImageClick = (index) => {
    if (selectedInstruments[index]?.instrument?.image) {
      // Handle image click if needed
    }
  };

  const handleSubmit = async () => {
    if (!projectName.trim()) {
      alert("Project Name is required.");
      return;
    }

    if (userRole !== "client") {
      alert("Only clients can submit quotations.");
      return;
    }

    if (!userData.id || !userData.company) {
      alert("User data incomplete. Please log in again.");
      navigate("/login");
      return;
    }

    setOpenConfirmSubmit(true);
  };

  const handleConfirmSubmit = async () => {
    console.log("User confirmed submission");
    console.log("Project Name:", projectName);
    console.log(
      "Selected Instruments:",
      JSON.stringify(selectedInstruments, null, 2)
    );

    setIsClicked(true);
    setOpenConfirmSubmit(false);
    try {
      let access = getToken();
      const refresh = getRefreshToken();

      if (!access || !refresh) {
        throw new Error("No access token or refresh token found");
      }

      const decoded = jwtDecode(access);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        const res = await api.post("/api/token/refresh/", { refresh });
        access = res.data.access;
        localStorage.setItem(ACCESS_TOKEN, access);
        console.log("Token refreshed:", access);
      }

      if (
        !selectedInstruments ||
        !Array.isArray(selectedInstruments) ||
        selectedInstruments.length === 0
      ) {
        throw new Error("No valid instruments selected");
      }

      const payload = {
        created_by_id: userData.id,
        company: userData.company,
        project_name: projectName,
        items: selectedInstruments.map((instrumentData, index) => {
          if (!instrumentData.instrument?.id || !instrumentData.productCode) {
            throw new Error(
              `Invalid instrument data at index ${index}: ${JSON.stringify(
                instrumentData
              )}`
            );
          }
          return {
            product_code: instrumentData.productCode,
            instrument_id: Number(instrumentData.instrument.id),
            quantity: Number(instrumentData.quantity || 1),
            selections: Object.values(instrumentData.selections || {})
              .filter((sel) => sel && sel.id)
              .map((sel) => ({ field_option_id: Number(sel.id) })),
            addons: (instrumentData.selectedAddOns || [])
              .filter((addon) => addon && addon.id)
              .map((addon) => ({ addon_id: Number(addon.id) })),
          };
        }),
      };

      console.log("Submitting payload:", JSON.stringify(payload, null, 2));

      const response = await api.post("/api/quotations/", payload, {
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
      });

      console.log("Submission response:", response.data);
      localStorage.removeItem("selectedInstruments");
      setOpenSuccess(true);
      setTimeout(() => navigate("/quotations/submitted"), 1500);
    } catch (error) {
      console.error("Submission failed:", error);
      console.error(
        "Full error response:",
        JSON.stringify(error.response?.data, null, 2)
      );
      const errorMessage = error.response?.data
        ? JSON.stringify(error.response.data, null, 2)
        : error.message;
      alert(`Failed to submit quotation. Error: ${errorMessage}`);
    } finally {
      setTimeout(() => setIsClicked(false), 300);
    }
  };

  const handleCancelSubmit = () => {
    console.log("Submission canceled by user");
    setOpenConfirmSubmit(false);
  };

  const handleCloseSuccess = () => {
    setOpenSuccess(false);
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
        <CircularProgress size={48} sx={{ color: "#007bff" }} />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            fontFamily: "Helvetica, sans-serif",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Loading quotation...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <Typography
          variant="h6"
          color="error"
          sx={{
            fontFamily: "Helvetica, sans-serif",
            fontWeight: "bold",
            fontSize: "1.5rem",
          }}
        >
          {error}
        </Typography>
      </Box>
    );
  }

  const isSubmitDisabled =
    isClicked || !projectName.trim() || userRole !== "client";

  return (
    <Fade in timeout={800}>
      <Box
        className="quotation-form-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "#f8f9fa",
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
                fontFamily: "Helvetica, sans-serif !important",
                fontWeight: "bold",
                color: "#000000",
                textTransform: "uppercase",
                mb: 3,
                fontSize: { xs: "1.5rem", md: "2rem" },
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Quotation Submission
            </Typography>
            <Typography
              variant="body1"
              align="center"
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                color: "#333",
                mb: 4,
                fontSize: "0.9rem",
              }}
            >
              Review and submit your quotation details.
            </Typography>

            <ToolCard sx={{ mb: 4, maxWidth: "100%" }}>
              <Box
                className={`user-info-box ${
                  isClicked ? "action-section-clicked" : ""
                }`}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  p: 3,
                  borderRadius: "8px",
                }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: "medium",
                    color: "#333",
                  }}
                >
                  <strong>Name:</strong> {userData.first_name || "N/A"}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: "medium",
                    color: "#333",
                  }}
                >
                  <strong>Company:</strong> {userData.company || "N/A"}
                </Typography>
                <TextField
                  label="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  variant="outlined"
                  required
                  error={!projectName.trim() && isClicked}
                  helperText={
                    !projectName.trim() && isClicked
                      ? "Project Name is required"
                      : ""
                  }
                  sx={{
                    width: "200px",
                    "& .MuiInputBase-root": {
                      fontFamily: "Helvetica, sans-serif",
                    },
                    "& .MuiInputLabel-root": {
                      fontFamily: "Helvetica, sans-serif",
                    },
                  }}
                />
              </Box>
            </ToolCard>

            {userRole !== "client" && (
              <Typography
                variant="body1"
                color="error"
                sx={{
                  mb: 4,
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  textAlign: "center",
                  maxWidth: "100%",
                }}
              >
                Only clients can submit quotations.
              </Typography>
            )}

            {selectedInstruments.length === 0 ? (
              <ToolCard sx={{ textAlign: "center", mb: 4, maxWidth: "100%" }}>
                <Typography
                  variant="h6"
                  align="center"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: "bold",
                    color: "error",
                  }}
                >
                  No instruments selected.
                </Typography>
              </ToolCard>
            ) : (
              <>
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
                    <ToolCard key={index} sx={{ mb: 4, maxWidth: "100%" }}>
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
                            alt={item.instrument.name || "Instrument"}
                            className="instrument-image"
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
                              bgcolor: "#e0e0e0",
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
                                fontFamily: "Helvetica, sans-serif",
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
                              fontFamily: "Helvetica, sans-serif",
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
                              fontFamily: "Helvetica, sans-serif",
                              color: "#0a5",
                              textTransform: "uppercase",
                              mt: 1,
                            }}
                          >
                            Product Code: {item.productCode || "N/A"}
                          </Typography>
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "bold",
                              fontFamily: "Helvetica, sans-serif",
                              color: "#0a5",
                              textTransform: "uppercase",
                              mt: 1,
                            }}
                          >
                            Quantity: {item.quantity || 1}
                          </Typography>
                          <Divider sx={{ my: 2 }} />
                          <Typography
                            variant="subtitle1"
                            sx={{
                              fontWeight: "bold",
                              fontFamily: "Helvetica, sans-serif",
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
                                  fontFamily: "Helvetica, sans-serif",
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
                                    fontFamily: "Helvetica, sans-serif",
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
                                textAlign: "right",
                                minWidth: "80px",
                              }}
                            >
                              {formatPrice(totalWithQuantity)}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </ToolCard>
                  );
                })}
                <ToolCard sx={{ mb: 4, maxWidth: "100%" }}>
                  <Box sx={{ mt: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: "bold",
                        fontFamily: "Helvetica, sans-serif",
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
                              fontFamily: "Helvetica, sans-serif",
                              color: "#333",
                            }}
                          >
                            {item.instrument?.name || "Unnamed Instrument"}:{" "}
                            {item.productCode || "N/A"} x {item.quantity || 1}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Helvetica, sans-serif",
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
                          fontFamily: "Helvetica, sans-serif",
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
                          fontFamily: "Helvetica, sans-serif",
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

            <Box
              className="action-section"
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <Button
                className="primary-button"
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
                sx={{
                  backgroundColor: "#1976d2",
                  color: "#ffffff",
                  padding: "8px 24px",
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
                }}
              >
                {isClicked ? (
                  <CircularProgress size={24} sx={{ color: "white" }} />
                ) : (
                  "Submit Quotation"
                )}
              </Button>
            </Box>
          </Container>
        </main>

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
            open={openConfirmSubmit}
          />
          <Snackbar
            open={openConfirmSubmit}
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
                  color: "white !important",
                  svg: {
                    fill: "white !important",
                  },
                },
                "& .MuiAlert-action": {
                  color: "white !important",
                  svg: {
                    fill: "white !important",
                  },
                },
              }}
              action={
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleConfirmSubmit}
                    sx={{ color: "white", fontFamily: "Helvetica, sans-serif" }}
                  >
                    Confirm
                  </Button>
                  <Button
                    color="inherit"
                    size="small"
                    onClick={handleCancelSubmit}
                    sx={{ color: "white", fontFamily: "Helvetica, sans-serif" }}
                  >
                    Cancel
                  </Button>
                </Box>
              }
            >
              Please confirm your submission.
            </Alert>
          </Snackbar>
          <Snackbar
            open={openSuccess}
            autoHideDuration={6000}
            onClose={handleCloseSuccess}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
          >
            <Alert
              onClose={handleCloseSuccess}
              severity="success"
              variant="filled"
              sx={{
                width: "100%",
                color: "white",
                backgroundColor: "#28a745",
                "& .MuiAlert-icon": {
                  color: "white !important",
                  svg: {
                    fill: "white !important",
                  },
                },
                "& .MuiAlert-action": {
                  color: "white !important",
                  svg: {
                    fill: "white !important",
                  },
                },
              }}
            >
              Quotation submitted successfully!
            </Alert>
          </Snackbar>
        </Box>
      </Box>
    </Fade>
  );
}

export default QuotationForm;
