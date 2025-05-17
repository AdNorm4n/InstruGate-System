import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Button,
  TextField,
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/SubmittedQuotations.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function SubmittedQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingQuotationId, setRejectingQuotationId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [isImageEnlarged, setIsImageEnlarged] = useState(null);
  const navigate = useNavigate();

  const baseUrl = "http://127.0.0.1:8000";

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let access = getToken();
        const refresh = getRefreshToken();

        if (!access || !refresh) {
          setError("No access token found. Please log in again.");
          setLoading(false);
          return;
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
        setUserRole(userRes.data.role);
        console.log("User role:", userRes.data.role);

        const endpoint =
          userRes.data.role === "client"
            ? "/api/quotations/submitted/"
            : "/api/quotations/review/";
        const quotationsRes = await api.get(endpoint, {
          headers: { Authorization: `Bearer ${access}` },
        });

        console.log(
          "Quotations data:",
          JSON.stringify(quotationsRes.data, null, 2)
        );
        quotationsRes.data.forEach((q) =>
          console.log(
            `Quotation ${q.id} created_by:`,
            q.created_by,
            typeof q.created_by
          )
        );

        setQuotations(quotationsRes.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          `Failed to fetch quotations. Error: ${
            err?.response?.data?.detail || err.message
          }`
        );
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRejectClick = (quotationId) => {
    setRejectingQuotationId(quotationId);
    setRejectRemarks("");
  };

  const handleConfirmReject = async () => {
    if (!rejectRemarks.trim()) {
      alert("Remarks are required for rejection.");
      return;
    }
    const confirmed = window.confirm(
      "Are you sure you want to reject this quotation?"
    );
    if (!confirmed) return;

    const payload = { status: "rejected", remarks: rejectRemarks };
    console.log("Sending PATCH payload:", JSON.stringify(payload, null, 2));
    try {
      const access = getToken();
      const response = await api.patch(
        `/api/quotations/review/${rejectingQuotationId}/`,
        payload,
        { headers: { Authorization: `Bearer ${access}` } }
      );
      setQuotations((prev) =>
        prev.map((q) =>
          q.id === rejectingQuotationId ? { ...q, ...response.data } : q
        )
      );
      setRejectingQuotationId(null);
      setRejectRemarks("");
      alert("Quotation rejected successfully.");
    } catch (err) {
      console.error("Error rejecting quotation:", err.response?.data || err);
      alert(
        `Failed to reject quotation. Error: ${
          err.response?.data?.detail ||
          err.response?.data?.status?.[0] ||
          err.message
        }`
      );
    }
  };

  const handleApproveClick = async (quotationId) => {
    const confirmed = window.confirm(
      "Are you sure you want to approve this quotation? This will redirect to the purchase order page."
    );
    if (!confirmed) return;

    const payload = { status: "approved", remarks: "" };
    console.log("Sending PATCH payload:", JSON.stringify(payload, null, 2));
    try {
      const access = getToken();
      const response = await api.patch(
        `/api/quotations/review/${quotationId}/`,
        payload,
        { headers: { Authorization: `Bearer ${access}` } }
      );
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? { ...q, ...response.data } : q))
      );
      navigate(`/purchase-order/${quotationId}`);
    } catch (err) {
      console.error("Error approving quotation:", err.response?.data || err);
      alert(
        `Failed to approve quotation. Error: ${
          err.response?.data?.detail ||
          err.response?.data?.status?.[0] ||
          err.message
        }`
      );
    }
  };

  const handleImageClick = (index) => {
    setIsImageEnlarged(index);
    console.log("Image clicked, opening overlay for index:", index);
  };

  const handleCloseOverlay = () => {
    setIsImageEnlarged(null);
    console.log("Closing image overlay");
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return "#28a745"; // Green
      case "rejected":
        return "#dc3545"; // Red
      default:
        return "#ffc107"; // Yellow
    }
  };

  const formatStatusText = (status) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (loading) {
    return (
      <Box className="loading-container">
        <CircularProgress size={48} />
        <Typography variant="h6" className="loading-text">
          Loading quotations...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box className="error-container">
        <Typography variant="h6" className="error-text">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box
        className={`submitted-quotations-page ${
          isImageEnlarged ? "overlay-active" : ""
        }`}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />
        <main className="main-content">
          <Container sx={{ mt: 8 }}>
            <Box className="configurator-header">
              <Typography
                variant="h5"
                align="center"
                gutterBottom
                className="page-title"
                sx={{
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif",
                  textTransform: "uppercase",
                  letterSpacing: 0,
                  textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
                  color: "#000000",
                }}
              >
                {userRole === "client"
                  ? "My Submitted Quotations"
                  : "Quotation Review"}
              </Typography>
            </Box>

            {quotations.length === 0 ? (
              <Typography variant="h6" className="no-quotations-text">
                No quotations available.
              </Typography>
            ) : (
              <Box className="quotations-list">
                {quotations.map((quotation, qIndex) => (
                  <Box
                    key={quotation.id || `quotation-${qIndex}`}
                    className="quotation-card"
                  >
                    <Box className="quotation-details">
                      <Typography
                        variant="h5"
                        fontWeight="bold"
                        className="quotation-title"
                      >
                        Quotation #{quotation.id || "Unknown"}
                      </Typography>
                      <Typography variant="body1" className="quotation-detail">
                        <strong>Submitted by:</strong>{" "}
                        {quotation.created_by || "N/A"}
                      </Typography>
                      <Typography variant="body1" className="quotation-detail">
                        <strong>Company:</strong> {quotation.company || "N/A"}
                      </Typography>
                      <Typography variant="body1" className="quotation-detail">
                        <strong>Project:</strong>{" "}
                        {quotation.project_name || "N/A"}
                      </Typography>
                      <Typography variant="body1" className="quotation-detail">
                        <strong>Submitted at:</strong>{" "}
                        {quotation.submitted_at
                          ? (() => {
                              try {
                                return format(
                                  parseISO(quotation.submitted_at),
                                  "PPp"
                                );
                              } catch {
                                return "Unknown";
                              }
                            })()
                          : "Unknown"}
                      </Typography>
                      {quotation.status === "approved" &&
                        quotation.approved_at && (
                          <Typography
                            variant="body1"
                            className="quotation-detail"
                          >
                            <strong>Approved at:</strong>{" "}
                            {(() => {
                              try {
                                return format(
                                  parseISO(quotation.approved_at),
                                  "PPp"
                                );
                              } catch {
                                return "Unknown";
                              }
                            })()}
                          </Typography>
                        )}
                      {quotation.status === "rejected" &&
                        quotation.rejected_at && (
                          <Typography
                            variant="body1"
                            className="quotation-detail"
                          >
                            <strong>Rejected at:</strong>{" "}
                            {(() => {
                              try {
                                return format(
                                  parseISO(quotation.rejected_at),
                                  "PPp"
                                );
                              } catch {
                                return "Unknown";
                              }
                            })()}
                          </Typography>
                        )}
                      <Typography variant="body1" className="quotation-status">
                        <strong>Status:</strong>{" "}
                        <Typography
                          component="span"
                          className="status-text"
                          sx={{
                            color: getStatusColor(quotation.status),
                            fontWeight: "bold",
                          }}
                        >
                          {formatStatusText(quotation.status)}
                        </Typography>
                      </Typography>
                      {quotation.status === "rejected" && quotation.remarks && (
                        <Typography
                          variant="body1"
                          className="quotation-remarks"
                        >
                          <strong>Remarks:</strong> {quotation.remarks}
                        </Typography>
                      )}
                      {quotation.status === "rejected" &&
                        userRole === "client" && (
                          <Typography
                            variant="body1"
                            className="quotation-instruction"
                          >
                            Please create a new quotation with corrections.
                          </Typography>
                        )}
                    </Box>

                    {rejectingQuotationId === quotation.id && (
                      <Box className="reject-form">
                        <TextField
                          label="Rejection Remarks (Required)"
                          multiline
                          rows={4}
                          value={rejectRemarks}
                          onChange={(e) => setRejectRemarks(e.target.value)}
                          fullWidth
                          className="reject-remarks-input"
                          placeholder="Please provide reasons for rejection"
                          required
                        />
                        <Box className="reject-form-buttons">
                          <Button
                            variant="contained"
                            className="confirm-reject-button"
                            onClick={handleConfirmReject}
                            disabled={!rejectRemarks.trim()}
                          >
                            Confirm Reject
                          </Button>
                          <Button
                            variant="outlined"
                            className="cancel-button"
                            onClick={() => setRejectingQuotationId(null)}
                          >
                            Cancel
                          </Button>
                        </Box>
                      </Box>
                    )}
                    <List className="instruments-list">
                      {quotation.items.map((item, iIndex) => {
                        const imageUrl = item.instrument?.image
                          ? new URL(item.instrument.image, baseUrl).href
                          : null;
                        const imageIndex = `${qIndex}-${iIndex}`;
                        return (
                          <ListItem
                            key={iIndex}
                            className="instrument-item"
                            disablePadding
                          >
                            <Box className="instrument-content">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.instrument.name}
                                  className="instrument-image"
                                  onClick={() => handleImageClick(imageIndex)}
                                />
                              ) : (
                                <Box className="no-image-placeholder">
                                  <Typography variant="body2">
                                    No Image
                                  </Typography>
                                </Box>
                              )}
                              <ListItemText
                                primary={
                                  <>
                                    <strong>Instrument:</strong>{" "}
                                    {item.instrument?.name || "Unknown"}
                                  </>
                                }
                                secondary={
                                  <Box className="instrument-details">
                                    <Typography
                                      variant="body2"
                                      className="instrument-detail"
                                    >
                                      <strong>Product Code:</strong>{" "}
                                      {item.product_code}
                                    </Typography>
                                    <Typography
                                      variant="body2"
                                      className="instrument-detail"
                                    >
                                      <strong>Quantity:</strong>{" "}
                                      {item.quantity || 1}
                                    </Typography>
                                  </Box>
                                }
                                className="instrument-text"
                              />
                            </Box>
                          </ListItem>
                        );
                      })}
                    </List>
                    {["admin", "proposal_engineer"].includes(userRole) &&
                      quotation.status === "pending" && (
                        <Box className="action-buttons">
                          <Button
                            variant="contained"
                            className="approve-button"
                            onClick={() => handleApproveClick(quotation.id)}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="contained"
                            className="reject-button"
                            onClick={() => handleRejectClick(quotation.id)}
                          >
                            Reject
                          </Button>
                        </Box>
                      )}
                  </Box>
                ))}
              </Box>
            )}
            {isImageEnlarged && (
              <Box className="image-overlay" onClick={handleCloseOverlay}>
                {quotations.map((quotation, qIndex) =>
                  quotation.items.map((item, iIndex) => {
                    const imageIndex = `${qIndex}-${iIndex}`;
                    const imageUrl = item.instrument?.image
                      ? new URL(item.instrument.image, baseUrl).href
                      : null;
                    if (imageIndex === isImageEnlarged && imageUrl) {
                      return (
                        <Box
                          key={imageIndex}
                          className="enlarged-image-container"
                        >
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
                      );
                    }
                    return null;
                  })
                )}
              </Box>
            )}
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default SubmittedQuotations;
