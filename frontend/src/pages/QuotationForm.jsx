import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/QuotationForm.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function QuotationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [userData, setUserData] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isClicked, setIsClicked] = useState(false);
  const [error, setError] = useState(null);
  const [projectName, setProjectName] = useState("");

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

        // Check token expiration
        const decoded = jwtDecode(access);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          const res = await api.post("/api/token/refresh/", { refresh });
          access = res.data.access;
          localStorage.setItem(ACCESS_TOKEN, access);
          console.log("Token refreshed:", access);
        }

        // Fetch user data from API
        const userRes = await api.get("/api/users/me/", {
          headers: { Authorization: `Bearer ${access}` },
        });
        console.log(
          "Full user data response:",
          JSON.stringify(userRes.data, null, 2)
        );
        setUserData(userRes.data);
        setUserRole(userRes.data.role);
        console.log("User role:", userRes.data.role);

        // Set selected instruments
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

    const confirmed = window.confirm("Are you sure you want to submit?");
    if (!confirmed) {
      console.log("Submission canceled by user");
      return;
    }

    console.log("User confirmed submission");
    console.log("Project Name:", projectName);
    console.log(
      "Selected Instruments:",
      JSON.stringify(selectedInstruments, null, 2)
    );

    setIsClicked(true);
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
      alert("Quotation submitted successfully!");
      navigate("/");
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
          background: "linear-gradient(to bottom, #f5f5f5, #e9ecef)",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />

        <main style={{ flex: 1 }}>
          <Container maxWidth="xl" sx={{ py: 4, mt: 12 }}>
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
                mb: 6,
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
              }}
            >
              Quotation Summary
            </Typography>

            <Box
              className={`user-info-box action-section ${
                isClicked ? "action-section-clicked" : ""
              }`}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 4,
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                transition: "all 0.3s ease",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                },
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

            {userRole !== "client" && (
              <Typography
                variant="body1"
                color="error"
                sx={{
                  mb: 4,
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                Only clients can submit quotations.
              </Typography>
            )}

            {selectedInstruments.length === 0 ? (
              <Typography
                variant="h6"
                align="center"
                sx={{
                  mt: 4,
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  color: "error",
                }}
              >
                No instruments selected.
              </Typography>
            ) : (
              <Box sx={{ spaceY: 4 }}>
                {selectedInstruments.map((item, index) => {
                  const imageUrl = item.instrument?.image
                    ? new URL(item.instrument.image, baseUrl).href
                    : null;
                  return (
                    <Box
                      key={index}
                      className="instrument-box"
                      sx={{
                        mb: 4,
                        p: 3,
                        border: "4px solid #e0e0e0",
                        borderRadius: "8px",
                        backgroundColor: "#fff",
                        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                        },
                      }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.instrument.name}
                          style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                            marginBottom: "16px",
                            cursor: "pointer",
                          }}
                          onClick={() => handleImageClick(index)}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100px",
                            height: "100px",
                            backgroundColor: "#e0e0e0",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            mb: 2,
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
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Helvetica, sans-serif",
                          color: "#000000",
                          mb: 1,
                        }}
                      >
                        {item.instrument.name}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          color: "#0a5",
                          mb: 1,
                        }}
                      >
                        <strong>Product Code:</strong> {item.productCode}
                      </Typography>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          color: "#0a5",
                          mb: 2,
                        }}
                      >
                        <strong>Quantity:</strong> {item.quantity || 1}
                      </Typography>

                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Helvetica, sans-serif",
                          color: "#000000",
                          mb: 1,
                        }}
                      >
                        Requirements
                      </Typography>
                      <List>
                        {Object.values(item.selections).map((sel, idx) => (
                          <ListItem key={idx} disablePadding>
                            <ListItemText
                              primary={`[${sel.code}] ${sel.label}`}
                              sx={{
                                fontFamily: "Helvetica, sans-serif",
                                color: "#333",
                              }}
                            />
                          </ListItem>
                        ))}
                      </List>

                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: "bold",
                          fontFamily: "Helvetica, sans-serif",
                          color: "#000000",
                          mb: 1,
                        }}
                      >
                        Add-Ons
                      </Typography>
                      <List>
                        {item.selectedAddOns.length > 0 ? (
                          item.selectedAddOns.map((addon, idx) => (
                            <ListItem key={idx} disablePadding>
                              <ListItemText
                                primary={`[${addon.code}] ${addon.label} (${addon.addon_type.name})`}
                                sx={{
                                  fontFamily: "Helvetica, sans-serif",
                                  color: "#333",
                                }}
                              />
                            </ListItem>
                          ))
                        ) : (
                          <ListItem disablePadding>
                            <ListItemText
                              primary="No Add-Ons selected"
                              sx={{
                                fontFamily: "Helvetica, sans-serif",
                                color: "#333",
                              }}
                            />
                          </ListItem>
                        )}
                      </List>
                    </Box>
                  );
                })}
              </Box>
            )}

            <Box className="action-section" sx={{ mt: 4 }}>
              <Button
                className="primary-button"
                variant="contained"
                onClick={handleSubmit}
                disabled={isSubmitDisabled}
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
      </Box>
    </Fade>
  );
}

export default QuotationForm;
