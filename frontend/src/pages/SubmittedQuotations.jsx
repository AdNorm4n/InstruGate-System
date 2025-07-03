import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useContext,
} from "react";
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
import SendIcon from "@mui/icons-material/Send";
import api from "../api";
import { UserContext } from "../contexts/UserContext";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/SubmittedQuotations.css";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

// Utility function to format price as RM10,000.00
const formatPrice = (price) => {
  if (price == null || isNaN(price)) return "RM0.00";
  return `RM${Number(price).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const QuotationCard = styled(Card)(({ theme }) => ({
  borderRadius: "16px",
  backgroundColor: "#ffffff",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  },
  fontFamily: "Inter, sans-serif",
  width: "100%",
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
  fontFamily: "Inter, sans-serif",
  width: "100%",
}));

const StatusButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  "& .MuiToggleButton-root": {
    textTransform: "none",
    fontWeight: 600,
    fontFamily: "Inter, sans-serif",
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
  fontFamily: "Inter, sans-serif",
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
  const { userRole } = useContext(UserContext);
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rejectingQuotationId, setRejectingQuotationId] = useState(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const [isImageEnlarged, setIsImageEnlarged] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [openInstrumentDialog, setOpenInstrumentDialog] = useState(false);
  const [chartData, setChartData] = useState({
    labels: ["Pending", "Approved", "Rejected", "Submitted"],
    datasets: [
      {
        data: [0, 0, 0, 0],
        backgroundColor: ["#ffc107", "#28a745", "#dc3545", "#1976d2"],
        hoverBackgroundColor: ["#ffc107", "#28a745", "#dc3545", "#1565c0"],
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
  const [submittingQuotationId, setSubmittingQuotationId] = useState(null);
  const [openConfirmSubmit, setOpenConfirmSubmit] = useState(null);
  const navigate = useNavigate();

  // Memoize Requirements content
  const requirementsContent = useMemo(() => {
    const selections = selectedInstrument?.selections;
    if (!selections || !Array.isArray(selections) || selections.length === 0) {
      return (
        <Typography
          component="span"
          sx={{
            fontFamily: "Inter, sans-serif",
            color: "#666",
            fontSize: "0.95rem",
          }}
        >
          -
        </Typography>
      );
    }
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {selections
          .filter((sel) => sel?.field_option?.label)
          .map((sel, idx) => {
            const option = sel.field_option;
            const type = option?.type || "";
            const code = option?.code || "";
            const label = option?.label || "Unknown";
            const price = parseFloat(option?.price || 0).toFixed(2);
            const displayText =
              type || code
                ? `${type}${type && code ? ": " : ""}${
                    code ? `[${code}] ` : ""
                  }${label}`
                : label;
            return (
              <Box
                key={`selection-${idx}`}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    color: "#333",
                    fontSize: "0.95rem",
                    flex: 1,
                    pr: 2,
                  }}
                >
                  {displayText}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    color: "#333",
                    fontSize: "0.95rem",
                    minWidth: "100px",
                    textAlign: "right",
                  }}
                >
                  RM {price}
                </Typography>
              </Box>
            );
          })}
      </Box>
    );
  }, [selectedInstrument?.selections]);

  // Memoize Addons content
  const addonsContent = useMemo(() => {
    const addons = selectedInstrument?.addons;
    if (!addons || !Array.isArray(addons) || addons.length === 0) {
      return (
        <Typography
          component="span"
          sx={{
            fontFamily: "Inter, sans-serif",
            color: "#666",
            fontSize: "0.95rem",
          }}
        >
          -
        </Typography>
      );
    }
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {addons
          .filter((addon) => addon?.addon?.label)
          .map((addon, idx) => {
            const option = addon.addon || {};
            const type = option.type || "";
            const code = option.code || "";
            const label = option.label || "Unknown";
            const price = parseFloat(option.price || 0).toFixed(2);
            const displayText =
              type || code
                ? `${type}${type && code ? ": " : ""}${
                    code ? `[${code}] ` : ""
                  }${label}`
                : label;
            return (
              <Box
                key={`addon-${idx}`}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 0.5,
                }}
              >
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    color: "#333",
                    fontSize: "0.95rem",
                    flex: 1,
                    pr: 2,
                  }}
                >
                  {displayText}
                </Typography>
                <Typography
                  component="span"
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    color: "#333",
                    fontSize: "0.95rem",
                    minWidth: "100px",
                    textAlign: "right",
                  }}
                >
                  RM {price}
                </Typography>
              </Box>
            );
          })}
      </Box>
    );
  }, [selectedInstrument?.addons]);

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

  const handleSubmitQuotation = useCallback(async (quotationId) => {
    if (!quotationId) {
      setErrorMessage("Invalid quotation ID.");
      setOpenError(true);
      return;
    }
    setOpenConfirmSubmit(null);
    setSubmittingQuotationId(quotationId);
    try {
      const access = getToken();
      if (!access) {
        throw new Error("No access token found.");
      }
      await api.post(
        `/api/quotations/${quotationId}/submit/`,
        {},
        { headers: { Authorization: `Bearer ${access}` } }
      );
      setSuccessMessage("Quotation submitted successfully via email!");
      setOpenSuccess(true);
      await fetchData();
    } catch (err) {
      console.error("Error submitting quotation:", err);
      setErrorMessage(
        `Failed to submit quotation: ${
          err.response?.data?.detail || err.message || "Unknown error"
        }`
      );
      setOpenError(true);
    } finally {
      setSubmittingQuotationId(null);
    }
  }, []);

  const handleDownloadPDF = async (quotation) => {
    try {
      console.log("Downloading PDF for quotation:", quotation.id);
      const access = getToken();
      if (!access) {
        throw new Error("No access token found.");
      }

      const response = await api.get(
        `/api/quotations/${quotation.id}/download-pdf/`,
        {
          headers: { Authorization: `Bearer ${access}` },
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data], { type: "application/pdf" })
      );
      const link = document.createElement("a");
      link.href = url;
      const safeCompany = (quotation.company || "Unknown").replace(
        /[^a-zA-Z0-9]/g,
        "_"
      );
      link.setAttribute(
        "download",
        `Purchase_Order_${safeCompany}_#${quotation.id}.pdf`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setSuccessMessage("PDF downloaded successfully!");
      setOpenSuccess(true);
    } catch (err) {
      console.error("Error downloading PDF:", err);
      setErrorMessage(
        `Failed to download PDF: ${
          err.response?.data?.detail || err.message || "Unknown error"
        }`
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
        navigate("/login");
        return;
      }

      const decoded = jwtDecode(access);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        try {
          const res = await api.post("/api/token/refresh/", { refresh });
          access = res.data.access;
          localStorage.setItem(ACCESS_TOKEN, access);
        } catch (refreshErr) {
          console.error("Token refresh failed:", refreshErr);
          setError("Session expired. Please log in again.");
          setLoading(false);
          navigate("/login");
          return;
        }
      }

      const userRes = await api.get("/api/users/me/", {
        headers: { Authorization: `Bearer ${access}` },
      });

      const endpoint =
        userRes.data.role === "client"
          ? "/api/quotations/submitted/"
          : "/api/quotations/review/";
      const quotationsRes = await api.get(endpoint, {
        headers: { Authorization: `Bearer ${access}` },
      });

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
      const submitted = quotationsRes.data.filter(
        (q) => q.status === "submitted"
      ).length;
      setChartData({
        labels: ["Pending", "Approved", "Rejected", "Submitted"],
        datasets: [
          {
            data: [pending, approved, rejected, submitted],
            backgroundColor: ["#ffc107", "#28a745", "#dc3545", "#1976d2"],
            hoverBackgroundColor: ["#ffc107", "#28a745", "#dc3545", "#1565c0"],
          },
        ],
      });

      setLoading(false);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(
        `Failed to fetch quotations: ${
          err.response?.data?.detail || err.message || "Unknown error"
        }`
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

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
    try {
      const access = getToken();
      const payload = { status: "rejected", remarks: rejectRemarks };
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
      await fetchData();
    } catch (err) {
      console.error("Error rejecting quotation:", err);
      setErrorMessage(
        `Failed to reject quotation: ${
          err.response?.data?.detail || err.message || "Unknown error"
        }`
      );
      setOpenError(true);
      setRejectingQuotationId(null);
    }
  };

  const handleCancelReject = () => {
    setOpenConfirmReject(null);
    setRejectingQuotationId(null);
    setRejectRemarks("");
  };

  const handleApproveClick = (quotationId) => {
    setOpenConfirmApprove(quotationId);
  };

  const handleConfirmApprove = async () => {
    const quotationId = openConfirmApprove;
    setOpenConfirmApprove(null);
    try {
      const access = getToken();
      const payload = { status: "approved", remarks: "" };
      const response = await api.patch(
        `/api/quotations/review/${quotationId}/`,
        payload,
        { headers: { Authorization: `Bearer ${access}` } }
      );
      setQuotations((prev) =>
        prev.map((q) => (q.id === quotationId ? { ...q, ...response.data } : q))
      );
      setSuccessMessage("Quotation approved successfully!");
      setOpenSuccess(true);
      await fetchData();
    } catch (err) {
      console.error("Error approving quotation:", err);
      setErrorMessage(
        `Failed to approve quotation: ${
          err.response?.data?.detail || err.message || "Unknown error"
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
  };

  const handleCloseOverlay = () => {
    setIsImageEnlarged(null);
  };

  const handleInstrumentClick = (item) => {
    setSelectedInstrument(item);
    setOpenInstrumentDialog(true);
  };

  const handleCloseInstrumentDialog = () => {
    setOpenInstrumentDialog(false);
    setSelectedInstrument(null);
  };

  const handleStatusFilterChange = (event, newStatus) => {
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
      case "submitted":
        return "#1976d2";
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

  const getDetailsFields = (quotation) => {
    const fields = [
      {
        label: "Submitted by:",
        value: quotation.created_by_first_name || "N/A",
      },
      { label: "Company:", value: quotation.company || "N/A" },
      { label: "Project:", value: quotation.project_name || "N/A" },
      {
        label: "Total Quotation Price:",
        value: formatPrice(quotation.total_price),
      },
      {
        label: "Submitted at:",
        value: quotation.submitted_at
          ? format(parseISO(quotation.submitted_at), "PPp")
          : "Unknown",
      },
      {
        label: "Reviewed by:",
        value: quotation.reviewed_by_name || "N/A",
        show: quotation.status !== "pending",
      },
      {
        label: "Approved at:",
        value: quotation.approved_at
          ? format(parseISO(quotation.approved_at), "PPp")
          : "N/A",
        show:
          quotation.status === "approved" || quotation.status === "submitted",
      },
      {
        label: "Rejected at:",
        value: quotation.rejected_at
          ? (() => {
              try {
                return format(parseISO(quotation.rejected_at), "PPp");
              } catch {
                return "N/A";
              }
            })()
          : "N/A",
        show: quotation.status === "rejected",
      },
      {
        label: "Emailed at:",
        value: quotation.emailed_at
          ? format(parseISO(quotation.emailed_at), "PPp")
          : "N/A",
        show: !!quotation.emailed_at,
      },
    ];
    return fields.filter((item) => item.show !== false);
  };

  return (
    <Fade in timeout={600}>
      <Box
        className="submitted-quotations-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
        }}
      >
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
              Quotations Dashboard
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
              Review and manage your submitted quotations with real-time
              updates.
            </Typography>

            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: "400px",
                }}
              >
                <CircularProgress size={60} sx={{ color: "#d6393a" }} />
              </Box>
            ) : error ? (
              <Typography
                variant="h6"
                align="center"
                sx={{
                  fontFamily: "Inter, sans-serif",
                  color: "#dc3545",
                  py: 4,
                  fontSize: "1.2rem",
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
                          fontFamily: "Inter, sans-serif",
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
                    onChange={handleStatusFilterChange}
                    aria-label="status filter"
                    sx={{ display: "flex", justifyContent: "center", mb: 3 }}
                  >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="pending">Pending</ToggleButton>
                    <ToggleButton value="rejected">Rejected</ToggleButton>
                    <ToggleButton value="approved">Approved</ToggleButton>
                    <ToggleButton value="submitted">Submitted</ToggleButton>
                  </StatusButtonGroup>

                  {filteredQuotations.length === 0 ? (
                    <Typography
                      variant="h6"
                      sx={{
                        textAlign: "center",
                        fontFamily: "Inter, sans-serif",
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
                                    fontFamily: "Inter, sans-serif",
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
                                      fontFamily: "Inter, sans-serif",
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
                                  {userRole === "client" && (
                                    <>
                                      {quotation.status === "approved" && (
                                        <>
                                          <IconButton
                                            onClick={() =>
                                              handleDownloadPDF(quotation)
                                            }
                                            sx={{
                                              ml: 2,
                                              color: "#28a745",
                                              "&:hover": { color: "#218838" },
                                            }}
                                            aria-label="Download Quotation PDF"
                                          >
                                            <DownloadIcon />
                                          </IconButton>
                                          <IconButton
                                            onClick={() =>
                                              setOpenConfirmSubmit(quotation.id)
                                            }
                                            disabled={
                                              submittingQuotationId ===
                                              quotation.id
                                            }
                                            sx={{
                                              ml: 2,
                                              color: "#1976d2",
                                              "&:hover": { color: "#1565c0" },
                                            }}
                                            aria-label="Submit Quotation via Email"
                                          >
                                            {submittingQuotationId ===
                                            quotation.id ? (
                                              <CircularProgress
                                                size={24}
                                                sx={{ color: "#1976d2" }}
                                              />
                                            ) : (
                                              <SendIcon />
                                            )}
                                          </IconButton>
                                        </>
                                      )}
                                    </>
                                  )}
                                </Box>
                              </Box>
                              <Divider sx={{ mb: 4, bgcolor: "#e0e0e0" }} />
                              <Grid container spacing={5}>
                                <Grid item xs={12}>
                                  <Typography
                                    variant="subtitle1"
                                    sx={{
                                      fontFamily: "Inter, sans-serif",
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
                                        width: { xs: "100%", sm: "350px" },
                                        minWidth: { sm: "350px" },
                                        maxWidth: { sm: "350px" },
                                        display: "flex",
                                        flexDirection: "column",
                                        gap: 2,
                                        bgcolor: "#fafafa",
                                        p: 3,
                                        borderRadius: "8px",
                                        border: "1px solid #e0e0e0",
                                      }}
                                    >
                                      {getDetailsFields(quotation).map(
                                        (item, index) => (
                                          <Typography
                                            key={`detail-${index}`}
                                            variant="body1"
                                            sx={{
                                              fontFamily: "Inter, sans-serif",
                                              color: "#333",
                                              fontSize: "1rem",
                                            }}
                                          >
                                            <strong>{item.label}</strong>{" "}
                                            {item.value}
                                          </Typography>
                                        )
                                      )}
                                      {quotation.status === "rejected" &&
                                        quotation.remarks && (
                                          <Typography
                                            variant="body1"
                                            sx={{
                                              fontFamily: "Inter, sans-serif",
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
                                                      "Inter, sans-serif",
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
                                              fontFamily: "Inter, sans-serif",
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
                                      fontFamily: "Inter, sans-serif",
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
                                            onClick={() =>
                                              handleInstrumentClick(item)
                                            }
                                            sx={{
                                              display: "flex",
                                              alignItems: "center",
                                              p: 2,
                                              bgcolor: "#f9fafb",
                                              borderRadius: "8px",
                                              border: "1px solid #e0e0e0",
                                              transition: "all 0.2s ease",
                                              cursor: "pointer",
                                              "&:hover": {
                                                bgcolor: "#f1f3f5",
                                                borderColor: "#d6393a",
                                                transform: "scale(1.02)",
                                              },
                                            }}
                                          >
                                            {imageUrl ? (
                                              <Box
                                                onClick={(e) =>
                                                  e.stopPropagation()
                                                }
                                                sx={{ mr: 2.5 }}
                                              >
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
                                              </Box>
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
                                                      "Inter, sans-serif",
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
                                                    "Inter, sans-serif",
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
                                                    "Inter, sans-serif",
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
                                                    "Inter, sans-serif",
                                                  color: "#666",
                                                  fontSize: "0.95rem",
                                                }}
                                              >
                                                Quantity: {item.quantity || "1"}
                                              </Typography>
                                              <Typography
                                                variant="body2"
                                                sx={{
                                                  fontFamily:
                                                    "Inter, sans-serif",
                                                  color: "#666",
                                                  fontSize: "0.95rem",
                                                }}
                                              >
                                                Total Price:{" "}
                                                {formatPrice(item.total_price)}
                                              </Typography>
                                            </Box>
                                          </Box>
                                        );
                                      })
                                    ) : (
                                      <Typography
                                        variant="body1"
                                        sx={{
                                          fontFamily: "Inter, sans-serif",
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
                                      fontFamily: "Inter, sans-serif",
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
                                        fontFamily: "Inter, sans-serif",
                                        borderRadius: "8px",
                                        fontSize: "1rem",
                                      },
                                      "& .MuiInputLabel-root": {
                                        fontFamily: "Inter, sans-serif",
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
                  PaperProps={{ sx: { borderRadius: 2, p: 2 } }}
                >
                  <DialogTitle
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "bold",
                      color: "#1976d2",
                    }}
                  >
                    Full Remarks
                  </DialogTitle>
                  <DialogContent>
                    <Typography
                      sx={{
                        fontFamily: "Inter, sans-serif",
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

                <Dialog
                  open={openInstrumentDialog}
                  onClose={handleCloseInstrumentDialog}
                  maxWidth={false}
                  fullWidth
                  PaperProps={{
                    sx: {
                      borderRadius: 2,
                      p: 2,
                      maxWidth: "1000px",
                      width: "100%",
                      overflowX: "auto",
                    },
                  }}
                >
                  <DialogTitle
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "bold",
                      color: "#1976d2",
                    }}
                  >
                    Instrument Details
                  </DialogTitle>
                  <DialogContent>
                    {selectedInstrument && (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 2,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            color: "#333",
                            fontSize: "1rem",
                          }}
                        >
                          <strong>Name:</strong>{" "}
                          {selectedInstrument.instrument?.name ||
                            selectedInstrument.name ||
                            "N/A"}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            color: "#333",
                            fontSize: "1rem",
                          }}
                        >
                          <strong>Product Code:</strong>{" "}
                          {selectedInstrument.product_code || "N/A"}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            color: "#333",
                            fontSize: "1rem",
                          }}
                        >
                          <strong>Quantity:</strong>{" "}
                          {selectedInstrument.quantity || "1"}
                        </Typography>
                        <Typography
                          sx={{
                            fontFamily: "Inter, sans-serif",
                            color: "#333",
                            fontSize: "1rem",
                          }}
                        >
                          <strong>Total Price:</strong>{" "}
                          {formatPrice(selectedInstrument.total_price)}
                        </Typography>
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            component="div"
                            variant="subtitle1"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              color: "#333",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              mb: 1,
                            }}
                          >
                            Requirements
                          </Typography>
                          {requirementsContent}
                        </Box>
                        <Box sx={{ mb: 2 }}>
                          <Typography
                            component="div"
                            variant="subtitle1"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              color: "#333",
                              fontSize: "1rem",
                              fontWeight: "bold",
                              mb: 1,
                            }}
                          >
                            Addons
                          </Typography>
                          {addonsContent}
                        </Box>
                      </Box>
                    )}
                  </DialogContent>
                  <DialogActions>
                    <CTAButton
                      colorType="cancel"
                      onClick={handleCloseInstrumentDialog}
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
                                  p: 1,
                                  bgcolor: "#444",
                                  borderRadius: "8px",
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
                                    fontFamily: "Inter, sans-serif",
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
                      openConfirmApprove !== null ||
                      openConfirmReject !== null ||
                      openConfirmSubmit !== null
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
                        "& .MuiAlert-icon": { color: "white" },
                        "& .MuiAlert-action": { color: "white" },
                      }}
                      action={
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleConfirmApprove}
                            sx={{
                              color: "white",
                              fontFamily: "Inter, sans-serif",
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
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      }
                    >
                      Please confirm if you want to approve this quotation. Once
                      approved, the client will be able to submit the Purchase
                      (PO) via email.
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
                        "& .MuiAlert-icon": { color: "white" },
                        "& .MuiAlert-action": { color: "white" },
                      }}
                      action={
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={handleConfirmRejectAction}
                            sx={{
                              color: "white",
                              fontFamily: "Inter, sans-serif",
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
                              fontFamily: "Inter, sans-serif",
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
                    open={openConfirmSubmit !== null}
                    anchorOrigin={{ vertical: "top", horizontal: "center" }}
                  >
                    <Alert
                      severity="info"
                      variant="filled"
                      sx={{
                        width: "100%",
                        color: "white",
                        backgroundColor: "#1976d2",
                        "& .MuiAlert-icon": { color: "white" },
                        "& .MuiAlert-action": { color: "white" },
                      }}
                      action={
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={() =>
                              handleSubmitQuotation(openConfirmSubmit)
                            }
                            sx={{
                              color: "white",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Confirm
                          </Button>
                          <Button
                            color="inherit"
                            size="small"
                            onClick={() => setOpenConfirmSubmit(null)}
                            sx={{
                              color: "white",
                              fontFamily: "Inter, sans-serif",
                            }}
                          >
                            Cancel
                          </Button>
                        </Box>
                      }
                    >
                      Confirm to submit this quotation to the sales team via
                      email.
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
                        "& .MuiAlert-icon": { color: "white" },
                        "& .MuiAlert-action": { color: "white" },
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
                        "& .MuiAlert-icon": { color: "white" },
                        "& .MuiAlert-action": { color: "white" },
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
