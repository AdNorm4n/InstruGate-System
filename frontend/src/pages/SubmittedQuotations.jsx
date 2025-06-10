import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Fade,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import DownloadIcon from "@mui/icons-material/Download";
import jsPDF from "jspdf";
import api from "../api";
import Navbar from "../components/Navbar";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/SubmittedQuotations.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const QuotationCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  backgroundColor: "#ffffff",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif !important",
  width: "100%",
  margin: 0,
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
  width: "100%",
  margin: 0,
}));

const StatusButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiToggleButton-root": {
    textTransform: "none",
    fontWeight: 600,
    fontFamily: "Helvetica, sans-serif",
    padding: theme.spacing(1.5, 4),
    borderRadius: "8px",
    border: "1px solid #e0e0e0",
    "&.Mui-selected": {
      backgroundColor: "#d6393a",
      color: "#fff",
      "&:hover": {
        backgroundColor: "#b83031",
      },
    },
    "&:hover": {
      backgroundColor: "#f0f0f0",
    },
  },
}));

const CTAButton = styled(Button)(({ theme, colorType }) => ({
  backgroundColor:
    colorType === "approve"
      ? "#28a745"
      : colorType === "reject"
      ? "#d6393a"
      : "#e0e0e0",
  color: colorType === "cancel" ? "#333" : "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif",
  "&:hover": {
    backgroundColor:
      colorType === "approve"
        ? "#218838"
        : colorType === "reject"
        ? "#b83031"
        : "#d0d0d0",
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
  const [pageLoaded, setPageLoaded] = useState(false);
  const navigate = useNavigate();

  const baseUrl = "http://127.0.0.1:8000";

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  const handleDownloadPDF = (quotation) => {
    try {
      console.log("Generating PDF for quotation:", quotation.id);
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const lineHeight = 10;
      let y = 40;

      // Add Letterhead
      console.log("Adding letterhead image");
      doc.addImage("/images/letterhead.jpg", "JPEG", 0, 0, 210, 297);

      // White background
      doc.setFillColor(255, 255, 255);
      doc.rect(margin, y - 10, pageWidth - 2 * margin, 230, "F");

      // Title
      doc.setFont("times", "bold");
      doc.setFontSize(18);
      doc.text(
        `Purchase Order Quotation #${quotation.id || "Unknown"}`,
        margin,
        y
      );
      y += lineHeight;

      // Status
      doc.setFont("times", "normal");
      doc.setFontSize(12);
      doc.text(`Status: Approved`, margin, y);
      y += 15;

      // Separator Line
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Details Section
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("Details", margin, y);
      y += 10;

      // Gray background for Details
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, y - 8, pageWidth - 2 * margin, 50, "F");

      doc.setFont("times", "normal");
      doc.setFontSize(12);
      const details = [
        {
          label: "Submitted by:",
          value: quotation.created_by_first_name || "N/A",
        },
        { label: "Company:", value: quotation.company || "N/A" },
        { label: "Project:", value: quotation.project_name || "N/A" },
        {
          label: "Submitted at:",
          value: quotation.submitted_at
            ? (() => {
                try {
                  return format(parseISO(quotation.submitted_at), "PPp");
                } catch {
                  return "Unknown";
                }
              })()
            : "Unknown",
        },
        {
          label: "Approved at:",
          value: quotation.approved_at
            ? (() => {
                try {
                  return format(parseISO(quotation.approved_at), "PPp");
                } catch {
                  return "Unknown";
                }
              })()
            : "N/A",
        },
      ];

      details.forEach((item) => {
        doc.text(`${item.label} ${item.value}`, margin + 5, y);
        y += lineHeight;
      });
      y += 5;

      // Separator Line
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Instruments Section
      doc.setFont("times", "bold");
      doc.setFontSize(14);
      doc.text("Instruments", margin, y);
      y += 15;

      // Instruments List
      doc.setFontSize(12);
      quotation.items.forEach((item, index) => {
        console.log("Adding instrument:", item.instrument?.name || "N/A");
        // Gray background for each item
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, y - 8, pageWidth - 2 * margin, 38, "F");

        // Item Number
        doc.setFont("times", "bold");
        doc.text(`Item #${index + 1}`, margin, y);
        y += lineHeight;

        // Item Details
        doc.setFont("times", "normal");
        doc.text(
          `Instrument Name: ${item.instrument?.name || "N/A"}`,
          margin + 5,
          y
        );
        y += lineHeight;
        doc.text(`Product Code: ${item.product_code || "N/A"}`, margin + 5, y);
        y += lineHeight;
        doc.text(`Quantity: ${item.quantity || "1"}`, margin + 5, y);
        y += 10;

        // Separator Line
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.5);
        doc.line(margin, y - 5, pageWidth - margin, y - 5);
        y += 5;
      });

      // Page Number
      doc.setFont("times", "italic");
      doc.setFontSize(10);
      doc.text(
        `Page 1 of ${doc.internal.getNumberOfPages()}`,
        pageWidth - margin,
        pageHeight - 10,
        { align: "right" }
      );

      // Save PDF
      console.log("Saving PDF");
      doc.save(`Purchase_Order_Quotation_${quotation.id || ""}.pdf`);
    } catch (err) {
      console.error("Error generating PDF:", err);
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const fetchData = async () => {
    try {
      let access = getToken();
      const refresh = getRefreshToken();

      if (!access) {
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
      setPageLoaded(true);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        `Failed to fetch quotations. Error: ${
          err?.response?.data?.detail || err.message
        }`
      );
      setLoading(false);
      setPageLoaded(true);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
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
      fetchData();
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
      "Are you sure to approve this quotation? Clients will be able to download the purchase order quotation sheet."
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
      fetchData();
      alert("Quotation has been approved.");
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
        return "#28a745";
      case "rejected":
        return "#dc3545";
      default:
        return "#ffc107";
    }
  };

  const formatStatusText = (status) => {
    if (!status) return "Pending";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const filteredQuotations =
    statusFilter === "all"
      ? quotations
      : quotations.filter((q) => q.status === statusFilter);

  if (!pageLoaded) {
    return null;
  }

  return (
    <Fade in={pageLoaded} timeout={800}>
      <Box
        className="submitted-quotations-page"
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
              Quotations Dashboard
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
              Review and manage your submitted quotations with real-time
              updates.
            </Typography>

            <ToolCard sx={{ mb: 6, p: 4 }}>
              <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} md={8}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      fontWeight: "bold",
                      mb: 3,
                      textAlign: "center",
                      color: "#333",
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
                </Grid>
              </Grid>
            </ToolCard>

            <ToolCard sx={{ p: 4 }}>
              <StatusButtonGroup
                value={statusFilter}
                exclusive
                onChange={handleStatusFilter}
                aria-label="status filter"
                sx={{ display: "flex", justifyContent: "center", mb: 3 }}
              >
                <ToggleButton value="all">All</ToggleButton>
                <ToggleButton value="pending">Pending</ToggleButton>
                <ToggleButton value="rejected">Rejected</ToggleButton>
                <ToggleButton value="approved">Approved</ToggleButton>
              </StatusButtonGroup>

              {filteredQuotations.length === 0 ? (
                <Typography
                  variant="h6"
                  sx={{
                    textAlign: "center",
                    fontFamily: "Helvetica, sans-serif !important",
                    color: "#666",
                    py: 4,
                  }}
                >
                  No quotations available for this status.
                </Typography>
              ) : (
                <Box sx={{ width: "100%" }}>
                  {filteredQuotations.map((quotation, qIndex) => (
                    <Box
                      key={quotation.id || `quotation-${qIndex}`}
                      sx={{ mb: 8 }}
                    >
                      <QuotationCard>
                        <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              mb: 4,
                            }}
                          >
                            <Typography
                              variant="h6"
                              fontWeight="bold"
                              sx={{
                                fontFamily: "Helvetica, sans-serif !important",
                                textTransform: "uppercase",
                                color: "#333",
                                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                              }}
                            >
                              Quotation #{quotation.id || "Unknown"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                  color: getStatusColor(quotation.status),
                                  textTransform: "uppercase",
                                  bgcolor: `${getStatusColor(
                                    quotation.status
                                  )}22`,
                                  px: 3,
                                  py: 1,
                                  borderRadius: "12px",
                                  fontSize: { xs: "0.9rem", sm: "1rem" },
                                }}
                              >
                                {formatStatusText(quotation.status)}
                              </Typography>
                              {quotation.status === "approved" &&
                                userRole === "client" && (
                                  <IconButton
                                    onClick={() => handleDownloadPDF(quotation)}
                                    sx={{
                                      ml: 2,
                                      color: "#28a745",
                                      "&:hover": {
                                        color: "#218838",
                                      },
                                    }}
                                    aria-label="Download Quotation PDF"
                                  >
                                    <DownloadIcon />
                                  </IconButton>
                                )}
                            </Box>
                          </Box>
                          <Divider sx={{ mb: 4, bgcolor: "#e0e0e0" }} />
                          <Grid container spacing={5}>
                            <Grid item xs={12}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                  color: "#555",
                                  mb: 2,
                                  textTransform: "uppercase",
                                  fontSize: "1rem",
                                }}
                              >
                                Details
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <Box
                                  sx={{
                                    width: { xs: "100%", sm: "400px" },
                                    minWidth: { sm: "400px" },
                                    maxWidth: { sm: "400px" },
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 2,
                                    bgcolor: "#fafafa",
                                    p: 3,
                                    borderRadius: "8px",
                                    border: "1px solid #e0e0e0",
                                  }}
                                >
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily:
                                        "Helvetica, sans-serif !important",
                                      color: "#333",
                                      fontSize: "1rem",
                                    }}
                                  >
                                    <strong>Submitted by:</strong>{" "}
                                    {quotation.created_by_first_name || "N/A"}
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily:
                                        "Helvetica, sans-serif !important",
                                      color: "#333",
                                      fontSize: "1rem",
                                    }}
                                  >
                                    <strong>Company:</strong>{" "}
                                    {quotation.company || "N/A"}
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily:
                                        "Helvetica, sans-serif !important",
                                      color: "#333",
                                      fontSize: "1rem",
                                    }}
                                  >
                                    <strong>Project:</strong>{" "}
                                    {quotation.project_name || "N/A"}
                                  </Typography>
                                  <Typography
                                    variant="body1"
                                    sx={{
                                      fontFamily:
                                        "Helvetica, sans-serif !important",
                                      color: "#333",
                                      fontSize: "1rem",
                                    }}
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
                                        sx={{
                                          fontFamily:
                                            "Helvetica, sans-serif !important",
                                          color: "#333",
                                          fontSize: "1rem",
                                        }}
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
                                        sx={{
                                          fontFamily:
                                            "Helvetica, sans-serif !important",
                                          color: "#333",
                                          fontSize: "1rem",
                                        }}
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
                                  {quotation.status === "rejected" &&
                                    quotation.remarks && (
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontFamily:
                                            "Helvetica, sans-serif !important",
                                          color: "#dc3545",
                                          fontSize: "1rem",
                                        }}
                                      >
                                        <strong>Remarks:</strong>{" "}
                                        {quotation.remarks}
                                      </Typography>
                                    )}
                                  {quotation.status === "rejected" &&
                                    userRole === "client" && (
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontFamily:
                                            "Helvetica, sans-serif !important",
                                          color: "#dc3545",
                                          fontWeight: "bold",
                                          fontSize: "1rem",
                                        }}
                                      >
                                        Please create a new quotation with
                                        corrections.
                                      </Typography>
                                    )}
                                </Box>
                              </Box>
                            </Grid>
                            <Grid item xs={12}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                  color: "#555",
                                  mb: 2,
                                  textTransform: "uppercase",
                                  fontSize: "1rem",
                                }}
                              >
                                Instruments
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: 2,
                                }}
                              >
                                {quotation.items.map((item, iIndex) => {
                                  const imageUrl = item.instrument?.image
                                    ? new URL(item.instrument.image, baseUrl)
                                        .href
                                    : null;
                                  const imageIndex = `${qIndex}-${iIndex}`;
                                  return (
                                    <Box
                                      key={imageIndex}
                                      sx={{
                                        display: "flex",
                                        alignItems: "center",
                                        p: 2,
                                        bgcolor: "#f9fafb",
                                        borderRadius: "8px",
                                        border: "1px solid #e0e0e0",
                                        transition: "all 0.2s ease",
                                        "&:hover": {
                                          bgcolor: "#f1f3f5",
                                          borderColor: "#d6393a",
                                        },
                                      }}
                                    >
                                      {imageUrl ? (
                                        <img
                                          src={imageUrl}
                                          alt={
                                            item.instrument?.name ||
                                            "Instrument"
                                          }
                                          style={{
                                            width: "80px",
                                            height: "80px",
                                            objectFit: "cover",
                                            borderRadius: "8px",
                                            marginRight: "20px",
                                            cursor: "pointer",
                                            boxShadow:
                                              "0 2px 4px rgba(0,0,0,0.1)",
                                          }}
                                          onClick={() =>
                                            handleImageClick(imageIndex)
                                          }
                                          onError={(e) => {
                                            e.target.style.display = "none";
                                            e.target.nextSibling.style.display =
                                              "flex";
                                          }}
                                        />
                                      ) : (
                                        <Box
                                          sx={{
                                            width: "80px",
                                            height: "80px",
                                            bgcolor: "#e0e0e0",
                                            borderRadius: "8px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            mr: 2.5,
                                          }}
                                        >
                                          <Typography
                                            variant="body2"
                                            color="text.secondary"
                                            sx={{
                                              fontFamily:
                                                "Helvetica, sans-serif !important",
                                              fontSize: "0.9rem",
                                            }}
                                          >
                                            No Image
                                          </Typography>
                                        </Box>
                                      )}
                                      <Box sx={{ flex: 1 }}>
                                        <Typography
                                          variant="body1"
                                          sx={{
                                            fontFamily:
                                              "Helvetica, sans-serif !important",
                                            fontWeight: "600",
                                            color: "#333",
                                            mb: 1,
                                            fontSize: "1rem",
                                          }}
                                        >
                                          {item.instrument?.name || "N/A"}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontFamily:
                                              "Helvetica, sans-serif !important",
                                            color: "#666",
                                            fontSize: "0.95rem",
                                          }}
                                        >
                                          Product Code:{" "}
                                          {item.product_code || "N/A"}
                                        </Typography>
                                        <Typography
                                          variant="body2"
                                          sx={{
                                            fontFamily:
                                              "Helvetica, sans-serif !important",
                                            color: "#666",
                                            fontSize: "0.95rem",
                                          }}
                                        >
                                          Quantity: {item.quantity || "1"}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  );
                                })}
                              </Box>
                            </Grid>
                          </Grid>
                          {rejectingQuotationId === quotation.id && (
                            <Box sx={{ mt: 5 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                  color: "#555",
                                  mb: 2,
                                  textTransform: "uppercase",
                                  fontSize: "1rem",
                                }}
                              >
                                Rejection Remarks
                              </Typography>
                              <TextField
                                label="Remarks (Required)"
                                multiline
                                rows={5}
                                value={rejectRemarks}
                                onChange={(e) =>
                                  setRejectRemarks(e.target.value)
                                }
                                fullWidth
                                placeholder="Please provide reasons for rejection"
                                required
                                sx={{
                                  mb: 3,
                                  "& .MuiInputBase-root": {
                                    fontFamily:
                                      "Helvetica, sans-serif !important",
                                    borderRadius: "8px",
                                    fontSize: "1rem",
                                  },
                                  "& .MuiInputLabel-root": {
                                    fontFamily:
                                      "Helvetica, sans-serif !important",
                                    fontSize: "0.95rem",
                                  },
                                }}
                              />
                              <Box
                                sx={{
                                  display: "flex",
                                  gap: 2,
                                  justifyContent: "flex-end",
                                }}
                              >
                                <CTAButton
                                  colorType="reject"
                                  onClick={handleConfirmReject}
                                  disabled={!rejectRemarks.trim()}
                                >
                                  Confirm Reject
                                </CTAButton>
                                <CTAButton
                                  colorType="cancel"
                                  onClick={() => setRejectingQuotationId(null)}
                                >
                                  Cancel
                                </CTAButton>
                              </Box>
                            </Box>
                          )}
                          {["admin", "proposal_engineer"].includes(userRole) &&
                            quotation.status === "pending" && (
                              <Box
                                sx={{
                                  mt: 5,
                                  display: "flex",
                                  gap: 2,
                                  justifyContent: "flex-end",
                                }}
                              >
                                <CTAButton
                                  colorType="approve"
                                  onClick={() =>
                                    handleApproveClick(quotation.id)
                                  }
                                >
                                  Approve
                                </CTAButton>
                                <CTAButton
                                  colorType="reject"
                                  onClick={() =>
                                    handleRejectClick(quotation.id)
                                  }
                                >
                                  Reject
                                </CTAButton>
                              </Box>
                            )}
                        </CardContent>
                      </QuotationCard>
                    </Box>
                  ))}
                </Box>
              )}
            </ToolCard>

            {isImageEnlarged && (
              <Box
                className="image-overlay"
                sx={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgcolor: "rgba(0, 0, 0, 0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1200,
                }}
              >
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
                          sx={{
                            p: 3,
                            bgcolor: "#f9fafb",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              bgcolor: "#f1f3f5",
                              borderColor: "#d6393a",
                            },
                            position: "relative",
                            maxWidth: "80vw",
                            maxHeight: "80vh",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <img
                            src={imageUrl}
                            alt={item.instrument?.name || "Instrument"}
                            style={{
                              maxWidth: "100%",
                              maxHeight: "70vh",
                              borderRadius: "8px",
                              objectFit: "contain",
                            }}
                          />
                          <Button
                            onClick={handleCloseOverlay}
                            sx={{
                              position: "absolute",
                              top: -25,
                              right: -25,
                              color: "#fff",
                              fontSize: "1.5rem",
                              fontFamily: "Helvetica, sans-serif !important",
                              "&:hover": {
                                color: "#d6393a",
                              },
                            }}
                          >
                            ×
                          </Button>
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
