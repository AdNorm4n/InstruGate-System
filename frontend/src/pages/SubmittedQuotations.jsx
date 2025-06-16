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
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Snackbar,
  Alert,
  Backdrop,
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
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
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
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
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
        backgroundColor: ["#fbc02d", "#388e3c", "#d32f2f"],
        hoverBackgroundColor: ["#fbc02d", "#388e3c", "#d32f2f"],
      },
    ],
  });
  const [openRemarksDialog, setOpenRemarksDialog] = useState(false);
  const [selectedRemarks, setSelectedRemarks] = useState("");
  const [openSuccess, setOpenSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [openError, setOpenError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [openConfirmApprove, setOpenConfirmApprove] = useState(null);
  const [openConfirmReject, setOpenConfirmReject] = useState(null);
  const navigate = useNavigate();

  const baseUrl = "http://127.0.0.1:8000";

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  const truncateRemarks = (text, maxLength = 50) => {
    if (!text) return "N/A";
    if (text.length <= maxLength) return text;
    return `${text.substring(0, maxLength - 3)}...`;
  };

  const handleOpenRemarksDialog = (remarks) => {
    setSelectedRemarks(remarks || "N/A");
    setOpenRemarksDialog(true);
  };

  const handleCloseRemarksDialog = () => {
    setOpenRemarksDialog(false);
    setSelectedRemarks("");
  };

  const handleCloseSuccess = () => {
    setOpenSuccess(false);
    setSuccessMessage("");
  };

  const handleCloseError = () => {
    setOpenError(false);
    setErrorMessage("");
  };

  const handleDownloadPDF = (quotation) => {
    try {
      console.log("Generating PDF for quotation:", quotation.id);
      console.log("Quotation items:", JSON.stringify(quotation.items, null, 2));
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 5;
      let y = 40; // Top padding for title

      // Add Letterhead
      try {
        doc.addImage("/images/letterhead.jpg", "JPEG", 0, 0, 210, 297);
      } catch (imgError) {
        console.warn("Letterhead image failed to load:", imgError);
      }

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(
        `Purchase Order Quotation #${quotation.id || "Unknown"}`,
        margin,
        y
      );
      console.log("Added title at y:", y);
      y += lineHeight + 2;

      // Status
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Status: Approved`, margin, y);
      console.log("Added status at y:", y);
      y += lineHeight + 4;

      // Separator Line
      doc.setDrawColor(100, 100, 100);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      console.log("Added separator at y:", y);
      y += lineHeight + 2;

      // Details Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Details", margin, y);
      console.log("Added Details header at y:", y);
      y += lineHeight + 8;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
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
            ? format(parseISO(quotation.submitted_at), "MMM dd, yyyy, h:mm a")
            : "Unknown",
        },
        {
          label: "Approved at:",
          value: quotation.approved_at
            ? format(parseISO(quotation.approved_at), "MMM dd, yyyy, h:mm a")
            : "N/A",
        },
      ];

      // Two-column layout for Details
      const colWidth = 90;
      const indent = 5;
      console.log("Adding Details content at y:", y);
      const midPoint = Math.ceil(details.length / 2);
      details.slice(0, midPoint).forEach((item, index) => {
        doc.text(
          `${item.label} ${item.value}`,
          margin + indent,
          y + index * (lineHeight + 1)
        );
      });
      details.slice(midPoint).forEach((item, index) => {
        doc.text(
          `${item.label} ${item.value}`,
          margin + colWidth + indent,
          y + index * (lineHeight + 1)
        );
      });
      y += Math.max(midPoint, details.length - midPoint) * (lineHeight + 1) + 8;

      // Instruments Section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("Instruments", margin, y);
      console.log("Added Instruments header at y:", y);
      y += lineHeight + 8;

      // Instruments List
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const items = Array.isArray(quotation.items) ? quotation.items : [];
      if (items.length === 0) {
        console.warn("No instruments found for quotation:", quotation.id);
        doc.text("No instruments listed.", margin + indent, y);
        y += lineHeight + 8;
      } else {
        items.forEach((item, index) => {
          const itemHeight = 4 * (lineHeight + 1) + 8;
          if (y + itemHeight > pageHeight - margin) {
            doc.addPage();
            try {
              doc.addImage("/images/letterhead.jpg", "JPEG", 0, 0, 210, 40);
            } catch (imgError) {
              console.warn(
                "Letterhead image failed to load on new page:",
                imgError
              );
            }
            y = 40;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text("Instruments (Continued)", margin, y);
            y += lineHeight + 8;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            console.log("Added new page for Instruments at y:", y);
          }
          const instrumentName =
            item.instrument?.name || item.name || "Unknown";
          const productCode = item.product_code || "N/A";
          const quantity = item.quantity || "1";
          console.log(`Adding instrument ${index + 1}:`, instrumentName);
          doc.setFont("helvetica", "bold");
          doc.text(`Item #${index + 1}`, margin + indent, y);
          y += lineHeight + 1;
          doc.setFont("helvetica", "normal");
          doc.text(`Instrument Name: ${instrumentName}`, margin + indent, y);
          y += lineHeight + 1;
          doc.text(`Product Code: ${productCode}`, margin + indent, y);
          y += lineHeight + 1;
          doc.text(`Qty: ${quantity}`, margin + indent, y);
          y += lineHeight + 8;
        });
      }
      // Save PDF
      console.log("Saving PDF");
      const safeCompany = (quotation.company || "Unknown").replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      doc.save(
        `Purchase Order ${safeCompany} #${quotation.id || "Unknown"}.pdf`
      );
      setSuccessMessage("PDF generated successfully!");
      setOpenSuccess(true);
    } catch (err) {
      console.error("Error generating PDF:", err);
      setErrorMessage(
        "Failed to generate PDF. Please check the console for details."
      );
      setOpenError(true);
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
        console.log("Token refreshed:", res.data.access);
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
      quotationsRes.data.forEach((item, index) =>
        console.log(
          `Quotation ${item.id} created_by_first_name:`,
          item.created_by_first_name || "N/A",
          index
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
            backgroundColor: ["#ffc107", "#28a745", "#dc3545"],
            hoverBackgroundColor: ["#ffc107", "#28a745", "#dc3545"],
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
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRejectClick = (quotationId) => {
    setRejectingQuotationId(quotationId);
    setRejectRemarks("");
  };

  const handleConfirmReject = async () => {
    if (!rejectRemarks.trim()) {
      setErrorMessage("Remarks are required for rejection.");
      setOpenError(true);
      return;
    }
    setOpenConfirmReject(rejectingQuotationId);
  };

  const handleConfirmRejectAction = async () => {
    setOpenConfirmReject(null);
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
      setSuccessMessage("Quotation rejected successfully.");
      setOpenSuccess(true);
      fetchData();
    } catch (err) {
      console.error("Error rejecting quotation:", err.response?.data || err);
      setErrorMessage(
        `Failed to reject quotation. Error: ${
          err.response?.data?.detail ||
          err.response?.data?.status?.[0] ||
          err.message
        }`
      );
      setOpenError(true);
      setRejectingQuotationId(null); // Reset to re-enable buttons on error
    }
  };

  const handleCancelReject = () => {
    setOpenConfirmReject(null);
    setRejectingQuotationId(null);
    setRejectRemarks("");
  };

  const handleApproveClick = async (quotationId) => {
    setOpenConfirmApprove(quotationId);
  };

  const handleConfirmApprove = async () => {
    const quotationId = openConfirmApprove;
    setOpenConfirmApprove(null);
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
      setSuccessMessage("Quotation has been approved.");
      setOpenSuccess(true);
      fetchData();
    } catch (err) {
      console.error("Error approving quotation:", err.response?.data || err);
      setErrorMessage(
        `Failed to approve quotation. Error: ${
          err.response?.data?.detail ||
          err.response?.data?.status?.[0] ||
          err.message
        }`
      );
      setOpenError(true);
    }
  };

  const handleCancelApprove = () => {
    setOpenConfirmApprove(null);
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

  return (
    <Fade in timeout={800}>
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

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "50vh",
                }}
              >
                <CircularProgress size={60} sx={{ color: "#d6393a" }} />
              </Box>
            ) : error ? (
              <Typography
                variant="h6"
                align="center"
                sx={{
                  fontFamily: "Helvetica, sans-serif !important",
                  color: "#dc3545",
                  py: 4,
                }}
              >
                {error}
              </Typography>
            ) : (
              <>
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
                                    fontFamily:
                                      "Helvetica, sans-serif !important",
                                    textTransform: "uppercase",
                                    color: "#333",
                                    fontSize: { xs: "1.2rem", sm: "1.5rem" },
                                  }}
                                >
                                  Quotation #{quotation.id || "Unknown"}
                                </Typography>
                                <Box
                                  sx={{ display: "flex", alignItems: "center" }}
                                >
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
                                        onClick={() =>
                                          handleDownloadPDF(quotation)
                                        }
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
                                        {quotation.created_by_first_name ||
                                          "N/A"}
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
                                                  parseISO(
                                                    quotation.submitted_at
                                                  ),
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
                                                  parseISO(
                                                    quotation.approved_at
                                                  ),
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
                                                  parseISO(
                                                    quotation.rejected_at
                                                  ),
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
                                              wordBreak: "break-word",
                                            }}
                                          >
                                            <strong>Remarks:</strong>{" "}
                                            <span>
                                              {truncateRemarks(
                                                quotation.remarks
                                              )}
                                              {quotation.remarks.length >
                                                50 && (
                                                <Link
                                                  component="button"
                                                  onClick={() =>
                                                    handleOpenRemarksDialog(
                                                      quotation.remarks
                                                    )
                                                  }
                                                  sx={{
                                                    ml: 1,
                                                    color: "#1976d2",
                                                    textDecoration: "underline",
                                                    fontFamily:
                                                      "Helvetica, sans-serif !important",
                                                  }}
                                                >
                                                  View More
                                                </Link>
                                              )}
                                            </span>
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
                                    {quotation.items &&
                                    Array.isArray(quotation.items) &&
                                    quotation.items.length > 0 ? (
                                      quotation.items.map((item, iIndex) => {
                                        const imageUrl = item.instrument?.image
                                          ? new URL(
                                              item.instrument.image,
                                              baseUrl
                                            ).href
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
                                                  e.target.style.display =
                                                    "none";
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
                                                {item.instrument?.name ||
                                                  item.name ||
                                                  "N/A"}
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
                                      })
                                    ) : (
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontFamily:
                                            "Helvetica, sans-serif !important",
                                          color: "#666",
                                          fontSize: "1rem",
                                        }}
                                      >
                                        No instruments found.
                                      </Typography>
                                    )}
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
                                    label="Remarks (required)"
                                    multiline
                                    rows={5}
                                    value={rejectRemarks}
                                    onChange={(e) =>
                                      setRejectRemarks(e.target.value)
                                    }
                                    fullWidth
                                    placeholder="Please provide reasons for rejection."
                                    required
                                    sx={{
                                      mb: 2,
                                      "& .MuiInputBase-root": {
                                        fontFamily:
                                          "Helvetica, sans-serif !important",
                                        borderRadius: "8px",
                                        fontSize: "1rem",
                                      },
                                      "& .MuiInputLabel-root": {
                                        fontFamily:
                                          "Helvetica, sans-serif !important",
                                        fontSize: "1rem",
                                      },
                                    }}
                                  />
                                  <Box
                                    sx={{
                                      display: "flex",
                                      gap: "10px",
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
                                      onClick={handleCancelReject}
                                    >
                                      Cancel
                                    </CTAButton>
                                  </Box>
                                </Box>
                              )}
                              {["admin", "proposal_engineer"].includes(
                                userRole
                              ) &&
                                quotation.status === "pending" && (
                                  <Box
                                    sx={{
                                      mt: 5,
                                      display: "flex",
                                      gap: "10px",
                                      justifyContent: "flex-end",
                                    }}
                                  >
                                    <CTAButton
                                      colorType="approve"
                                      onClick={() =>
                                        handleApproveClick(quotation.id)
                                      }
                                      disabled={
                                        rejectingQuotationId === quotation.id
                                      }
                                    >
                                      Approve
                                    </CTAButton>
                                    <CTAButton
                                      colorType="reject"
                                      onClick={() =>
                                        handleRejectClick(quotation.id)
                                      }
                                      disabled={
                                        rejectingQuotationId === quotation.id
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

                <Dialog
                  open={openRemarksDialog}
                  onClose={handleCloseRemarksDialog}
                  maxWidth="sm"
                  fullWidth
                  PaperProps={{
                    sx: { borderRadius: 2, p: 2 },
                  }}
                >
                  <DialogTitle
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      fontWeight: "bold",
                      color: "#1976d2",
                    }}
                  >
                    Full Remarks
                  </DialogTitle>
                  <DialogContent>
                    <Typography
                      sx={{
                        fontFamily: "Helvetica, sans-serif !important",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                      }}
                    >
                      {selectedRemarks}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <CTAButton
                      colorType="cancel"
                      onClick={handleCloseRemarksDialog}
                    >
                      Close
                    </CTAButton>
                  </DialogActions>
                </Dialog>

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
                    {quotations.map(
                      (quotation, qIndex) =>
                        quotation.items &&
                        Array.isArray(quotation.items) &&
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
                                    fontFamily: "Helvetica, sans-serif",
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

                {/* Success, Error, and Confirmation Snackbars */}
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
                    open={
                      openConfirmApprove !== null || openConfirmReject !== null
                    }
                  />
                  <Snackbar
                    open={openConfirmApprove !== null}
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
                          svg: { fill: "white !important" },
                        },
                        "& .MuiAlert-action": {
                          color: "white !important",
                          svg: { fill: "white !important" },
                        },
                      }}
                      action={
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleConfirmApprove}
                            sx={{
                              color: "white",
                              fontFamily: "Helvetica, sans-serif",
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleCancelApprove}
                            sx={{
                              color: "white",
                              fontFamily: "Helvetica, sans-serif",
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      }
                    >
                      Please confirm if you want to approve this quotation. Once
                      approved, the client will be able to download the
                      quotation sheet and proceed with submitting the Purchase
                      Order (PO).
                    </Alert>
                  </Snackbar>
                  <Snackbar
                    open={openConfirmReject !== null}
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
                          svg: { fill: "white !important" },
                        },
                        "& .MuiAlert-action": {
                          color: "white !important",
                          svg: { fill: "white !important" },
                        },
                      }}
                      action={
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleConfirmRejectAction}
                            sx={{
                              color: "white",
                              fontFamily: "Helvetica, sans-serif",
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleCancelReject}
                            sx={{
                              color: "white",
                              fontFamily: "Helvetica, sans-serif",
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      }
                    >
                      Please confirm if you want to reject this quotation.
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
                      {successMessage}
                    </Alert>
                  </Snackbar>
                  <Snackbar
                    open={openError}
                    autoHideDuration={6000}
                    onClose={handleCloseError}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                  >
                    <Alert
                      onClose={handleCloseError}
                      severity="error"
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
                    >
                      {errorMessage}
                    </Alert>
                  </Snackbar>
                </Box>
              </>
            )}
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default SubmittedQuotations;
