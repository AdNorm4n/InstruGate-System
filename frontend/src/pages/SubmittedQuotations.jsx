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
  Grid,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import api from "../api";
import Navbar from "../components/Navbar";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/SubmittedQuotations.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const StatusButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiToggleButton-root": {
    textTransform: "none",
    fontWeight: "bold",
    fontFamily: "Helvetica, sans-serif",
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: "#fff",
    },
  },
}));

function SubmittedQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingQuotationId, setRejectingQuotationId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [isImageEnlarged, setIsImageEnlarged] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [chartData, setChartData] = useState({
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
        hoverBackgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
      },
    ],
  });
  const navigate = useNavigate();

  const baseUrl = "http://127.0.0.1:8000";

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

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
          `Quotation ${q.id} created_by_first_name:`,
          q.created_by_first_name,
          typeof q.created_by_first_name
        )
      );

      setQuotations(quotationsRes.data);

      // Update chart data
      const pending = quotationsRes.data.filter(
        (q) => q.status === "pending"
      ).length;
      const approved = quotationsRes.data.filter(
        (q) => q.status === "approved"
      ).length;
      const rejected = quotationsRes.data.filter(
        (q) => q.status === "rejected"
      ).length;
      setChartData({
        labels: ["Pending", "Approved", "Rejected"],
        datasets: [
          {
            data: [pending, approved, rejected],
            backgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
            hoverBackgroundColor: ["#FFCE56", "#36A2EB", "#FF6384"],
          },
        ],
      });

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10 seconds
    return () => clearInterval(interval); // Clean up on unmount
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
      fetchData(); // Refresh data immediately after rejection
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
      fetchData(); // Refresh data immediately after approval
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

  const handleStatusFilter = (event, newStatus) => {
    if (newStatus !== null) {
      setStatusFilter(newStatus);
    }
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

  // Filter quotations based on status
  const filteredQuotations =
    statusFilter === "all"
      ? quotations
      : quotations.filter((q) => q.status === statusFilter);

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
            {/* Page Title */}
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
                mb: 3, // Spacing below title
              }}
            >
              Quotation Dashboard
            </Typography>

            {/* Pie Chart */}
            <Grid container spacing={4} sx={{ mb: 8 }} justifyContent="center">
              <Grid item xs={12} md={8}>
                <Paper sx={{ p: 3, textAlign: "center" }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Helvetica, sans-serif",
                      fontWeight: "bold",
                      mb: 2,
                    }}
                  >
                    Total Quotations: {quotations.length}
                  </Typography>
                  <Box sx={{ maxWidth: 600, mx: "auto" }}>
                    <Pie
                      data={chartData}
                      options={{
                        responsive: true,
                        plugins: {
                          legend: { position: "top" },
                          tooltip: {
                            callbacks: {
                              label: (context) =>
                                `${context.label}: ${context.raw}`,
                            },
                          },
                        },
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            {/* Quotation List with Status Filter */}
            <Box>
              <StatusButtonGroup
                value={statusFilter}
                exclusive
                onChange={handleStatusFilter}
                aria-label="status filter"
                sx={{ display: "flex", justifyContent: "center", mb: 4 }}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="pending">Pending</ToggleButton>
                <ToggleButton value="approved">Approved</ToggleButton>
                <ToggleButton value="rejected">Rejected</ToggleButton>
              </StatusButtonGroup>

              {filteredQuotations.length === 0 ? (
                <Typography
                  variant="h6"
                  className="no-quotations-text"
                  sx={{ textAlign: "center" }}
                >
                  No quotations available for this status.
                </Typography>
              ) : (
                <Box className="quotations-list">
                  {filteredQuotations.map((quotation, qIndex) => (
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
                        <Typography
                          variant="body1"
                          className="quotation-detail"
                        >
                          <strong>Submitted by:</strong>{" "}
                          {quotation.created_by_first_name || "N/A"}
                        </Typography>
                        <Typography
                          variant="body1"
                          className="quotation-detail"
                        >
                          <strong>Company:</strong> {quotation.company || "N/A"}
                        </Typography>
                        <Typography
                          variant="body1"
                          className="quotation-detail"
                        >
                          <strong>Project:</strong>{" "}
                          {quotation.project_name || "N/A"}
                        </Typography>
                        <Typography
                          variant="body1"
                          className="quotation-detail"
                        >
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
                        <Typography
                          variant="body1"
                          className="quotation-status"
                        >
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
                        {quotation.status === "rejected" &&
                          quotation.remarks && (
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
            </Box>
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
