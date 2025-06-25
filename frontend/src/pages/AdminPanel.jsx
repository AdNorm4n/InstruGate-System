import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Grid,
  Alert,
  Box,
  Button,
  Paper,
  Fade,
  CircularProgress,
} from "@mui/material";
import {
  People,
  Business,
  Archive,
  RequestQuote,
  Speed,
  ArrowForward,
} from "@mui/icons-material";
import { styled } from "@mui/material/styles";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { UserContext } from "../contexts/UserContext";
import api from "../api";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Custom plugin for bar shadow
const barShadowPlugin = {
  id: "barShadow",
  beforeDraw: (chart) => {
    const { ctx } = chart;
    chart.data.datasets.forEach((dataset, datasetIndex) => {
      chart.getDatasetMeta(datasetIndex).data.forEach((bar) => {
        ctx.save();
        ctx.shadowColor = "rgba(255, 255, 255, 0.1)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;
        bar.draw(ctx);
        ctx.restore();
      });
    });
  },
};

ChartJS.register(barShadowPlugin);

const DrawerHeader = styled("div")(({ theme }) => ({
  height: "8px", // Reduced height (adjust as needed, e.g., 16px or 0px)
}));

const ToolCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(255, 255, 255, 0.05)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(255, 255, 255, 0.1)",
  },
  width: "240px",
  height: "160px",
  minWidth: "240px",
  minHeight: "160px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  [theme.breakpoints.down("sm")]: {
    width: "100%",
    maxWidth: "200px",
    height: "140px",
    minHeight: "140px",
    padding: theme.spacing(1.5),
  },
}));

const ManagementCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(255, 255, 255, 0.05)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(255, 255, 255, 0.1)",
  },
  width: "100%",
  maxWidth: "320px",
  minHeight: "240px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "space-between",
  textAlign: "center",
  margin: theme.spacing(1.5),
  mx: "auto",
  boxSizing: "border-box",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    minHeight: "200px",
  },
}));

const ChartCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  boxShadow: "0 4px 20px rgba(255, 255, 255, 0.05)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(255, 255, 255, 0.1)",
  },
  width: "100%",
  maxWidth: "1000px",
  mx: "auto",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    width: "100%",
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  "&:hover": {
    backgroundColor: "#2563eb",
    transform: "scale(1.05)",
  },
  "&.Mui-disabled": {
    backgroundColor: "#4b5563",
    color: "#9ca3af",
  },
  transition: "all 0.3s ease",
  "& .MuiCircularProgress-root": {
    color: "#ffffff",
  },
}));

// ErrorBoundary Component
class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ textAlign: "center", mt: "20vh" }}>
          <ToolCard sx={{ maxWidth: 800, mx: "auto", textAlign: "center" }}>
            <Alert
              severity="error"
              sx={{ borderRadius: 2, bgcolor: "#7f1d1d" }}
            >
              <Typography
                variant="h6"
                fontFamily="Inter, sans-serif"
                fontWeight="bold"
                color="#ffffff"
              >
                Something went wrong.
              </Typography>
              <Typography fontFamily="Inter, sans-serif" color="#ffffff">
                {this.state.error?.message || "An unexpected error occurred."}
              </Typography>
            </Alert>
          </ToolCard>
        </Box>
      );
    }
    return this.props.children;
  }
}

const AdminPanel = () => {
  const navigate = useNavigate();
  const { userRole, loading: contextLoading } = useContext(UserContext);
  const [error, setError] = useState("");
  const [metricErrors, setMetricErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalProjects: 0,
    totalQuotations: 0,
    totalInstrumentsAvailable: 0,
    quotationStatuses: { pending: 0, approved: 0, rejected: 0, submitted: 0 },
  });

  useEffect(() => {
    if (contextLoading) {
      return;
    }

    const fetchData = async () => {
      setError("");
      setMetricErrors([]);
      try {
        const access = localStorage.getItem("access");
        if (!access) {
          setError("Please log in to access the admin panel.");
          setLoading(false);
          return;
        }
        const headers = { Authorization: `Bearer ${access}` };

        const endpoints = [
          { url: "/api/users/list/", key: "users" },
          { url: "/api/quotations/review/", key: "quotations" },
          {
            url: "/api/instruments/",
            key: "instruments",
            params: { is_available: true },
          },
        ];

        const responses = await Promise.all(
          endpoints.map(({ url, params }) =>
            api.get(url, { headers, params }).catch((err) => {
              return {
                error: err.response?.data?.detail || err.message,
                data: [],
              };
            })
          )
        );

        const newMetrics = {
          totalUsers: 0,
          totalCompanies: 0,
          totalProjects: 0,
          totalQuotations: 0,
          totalInstrumentsAvailable: 0,
          quotationStatuses: {
            pending: 0,
            approved: 0,
            rejected: 0,
            submitted: 0,
          },
        };
        const errors = [];

        responses.forEach((response, index) => {
          if (response.error) {
            errors.push(
              `Failed to load ${endpoints[index].key}: ${response.error}`
            );
            return;
          }
          const data = Array.isArray(response.data) ? response.data : [];
          if (index === 0) {
            newMetrics.totalUsers = data.length;
          } else if (index === 1) {
            newMetrics.totalQuotations = data.length;
            const companies = new Set(data.map((q) => q?.company || ""));
            const projects = new Set(data.map((q) => q?.project_name || ""));
            newMetrics.totalCompanies = companies.size;
            newMetrics.totalProjects = projects.size;
            newMetrics.quotationStatuses = data.reduce(
              (acc, q) => {
                const status = q?.status || "unknown";
                if (
                  ["pending", "approved", "rejected", "submitted"].includes(
                    status
                  )
                ) {
                  acc[status] = (acc[status] || 0) + 1;
                }
                return acc;
              },
              { pending: 0, approved: 0, rejected: 0, submitted: 0 }
            );
          } else if (index === 2) {
            newMetrics.totalInstrumentsAvailable = data.length;
          }
        });

        setMetrics(newMetrics);
        if (errors.length > 0) {
          setMetricErrors(errors);
        }
      } catch (err) {
        setError(
          `Error loading dashboard: ${
            err.response?.data?.detail || err.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };

    if (userRole === null || userRole === undefined) {
      setError("Please log in to access the admin panel.");
      setLoading(false);
      navigate("/login");
      return;
    }

    if (userRole !== "admin") {
      setError("You do not have permission to access the admin panel.");
      setLoading(false);
      navigate("/");
      return;
    }

    fetchData();
  }, [contextLoading, userRole, navigate]);

  const handleNavigation = (path) => {
    navigate(path);
  };

  const sections = [
    {
      title: "Manage Users",
      path: "/admin/users",
      disabled: userRole !== "admin",
      description: "Create, update, or delete user accounts",
      icon: <People sx={{ fontSize: 40, color: "#60a5fa" }} />,
    },
    {
      title: "Manage Instruments",
      path: "/admin/instruments",
      disabled: !["admin", "proposal_engineer"].includes(userRole),
      description: "Manage categories, types, instruments, and add-ons",
      icon: <Speed sx={{ fontSize: 40, color: "#60a5fa" }} />,
    },
    {
      title: "Manage Quotations",
      path: "/admin/quotations",
      disabled: !["admin", "proposal_engineer", "client"].includes(userRole),
      description: "Review and manage quotations and their items",
      icon: <RequestQuote sx={{ fontSize: 40, color: "#60a5fa" }} />,
    },
  ];

  const chartData = {
    labels: ["Pending", "Approved", "Rejected", "Submitted"],
    datasets: [
      {
        label: "Quotation Statuses",
        data: [
          metrics.quotationStatuses.pending || 0,
          metrics.quotationStatuses.approved || 0,
          metrics.quotationStatuses.rejected || 0,
          metrics.quotationStatuses.submitted || 0,
        ],
        backgroundColor: ["#f59e0b", "#22c55e", "#ef4444", "#3b82f6"],
        borderColor: ["#d97706", "#16a34a", "#dc2626", "#2563eb"],
        borderWidth: 1,
        borderRadius: 8,
        hoverBackgroundColor: ["#fbbf24", "#4ade80", "#f87171", "#60a5fa"],
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: 0.4,
    categoryPercentage: 0.8,
    layout: {
      gastronomical: { left: 20, right: 20, top: 20, bottom: 20 },
    },
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { family: "Inter, sans-serif", size: 14 },
          color: "#ffffff",
          padding: 20,
          boxWidth: 20,
          usePointStyle: true,
        },
      },
      title: {
        display: true,
        text: "Quotation Status Distribution",
        font: { family: "Inter, sans-serif", size: 20, weight: "600" },
        color: "#ffffff",
        padding: { top: 10, bottom: 30 },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: { family: "Inter, sans-serif", size: 14 },
        bodyFont: { family: "Inter, sans-serif", size: 12 },
        cornerRadius: 8,
        padding: 12,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Quotations",
          font: { family: "Inter, sans-serif", size: 16 },
          color: "#ffffff",
          padding: { top: 10, bottom: 10 },
        },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        ticks: {
          color: "#ffffff",
          font: { family: "Inter, sans-serif", size: 14 },
          stepSize: 1,
        },
      },
      x: {
        title: {
          display: true,
          text: "Status",
          font: { family: "Inter, sans-serif", size: 16 },
          color: "#ffffff",
          padding: { top: 10, bottom: 10 },
        },
        grid: { display: false },
        ticks: {
          color: "#ffffff",
          font: { family: "Inter, sans-serif", size: 14 },
        },
      },
    },
  };

  if (contextLoading || loading) {
    return (
      <Fade in>
        <Box
          sx={{
            minHeight: "100vh",
            bgcolor: "#0f172a",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <CircularProgress size={48} sx={{ color: "#60a5fa" }} />
        </Box>
      </Fade>
    );
  }

  if (error) {
    return (
      <Fade in>
        <Box sx={{ minHeight: "100vh", bgcolor: "#000000" }}>
          <Container maxWidth="xl">
            <ToolCard sx={{ p: 3, mx: "auto", maxWidth: "800px", mt: 8 }}>
              <Alert
                severity="error"
                sx={{ borderRadius: 2, bgcolor: "#7f1d1d" }}
              >
                <Typography
                  variant="body1"
                  sx={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "0.9rem",
                    color: "#ffffff",
                  }}
                >
                  {error}
                </Typography>
              </Alert>
            </ToolCard>
          </Container>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#000000",
        }}
        className="admin-panel-page"
      >
        <main style={{ flex: 1 }}>
          <ErrorBoundary>
            <Container maxWidth="xl" sx={{ py: 6, mt: 8 }}>
              <Typography
                variant="h6"
                align="center"
                gutterBottom
                sx={{
                  fontFamily: "Inter, sans-serif",
                  fontWeight: "600",
                  color: "#ffffff",
                  textTransform: "uppercase",
                  mb: 4,
                  fontSize: { xs: "1.5rem", md: "2rem" },
                }}
              >
                Admin Dashboard
              </Typography>
              <Typography
                variant="body1"
                align="center"
                sx={{
                  fontFamily: "Inter, sans-serif",
                  color: "#d1d5db",
                  mb: 6,
                  fontSize: "0.9rem",
                }}
              >
                Manage users, instruments, and quotations with ease.
              </Typography>
              {metricErrors.length > 0 && (
                <ToolCard sx={{ mb: 4, mx: "auto", maxWidth: "800px" }}>
                  <Alert
                    severity="warning"
                    sx={{ borderRadius: 2, bgcolor: "#7c2d12" }}
                  >
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: "0.9rem",
                        lineHeight: 1.6,
                        color: "#ffffff",
                      }}
                    >
                      Some metrics could not be loaded:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {metricErrors.map((err, index) => (
                        <li key={index}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              fontSize: "0.9rem",
                              lineHeight: 1.6,
                              color: "#ffffff",
                            }}
                          >
                            {err}
                          </Typography>
                        </li>
                      ))}
                    </ul>
                  </Alert>
                </ToolCard>
              )}
              <>
                {/* Overview Section */}
                <Box sx={{ mb: 6 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "600",
                      color: "#ffffff",
                      mb: 3,
                      textTransform: "uppercase",
                      fontSize: "1.25rem",
                    }}
                  >
                    Overview
                  </Typography>
                  <Grid container spacing={3} justifyContent="center">
                    {[
                      {
                        icon: (
                          <People sx={{ fontSize: 40, color: "#60a5fa" }} />
                        ),
                        value: metrics.totalUsers,
                        label: "Total Users",
                      },
                      {
                        icon: (
                          <Business sx={{ fontSize: 40, color: "#60a5fa" }} />
                        ),
                        value: metrics.totalCompanies,
                        label: "Total Companies",
                      },
                      {
                        icon: (
                          <Archive sx={{ fontSize: 40, color: "#60a5fa" }} />
                        ),
                        value: metrics.totalProjects,
                        label: "Total Projects",
                      },
                      {
                        icon: (
                          <RequestQuote
                            sx={{ fontSize: 40, color: "#60a5fa" }}
                          />
                        ),
                        value: metrics.totalQuotations,
                        label: "Total Quotations",
                      },
                      {
                        icon: <Speed sx={{ fontSize: 40, color: "#60a5fa" }} />,
                        value: metrics.totalInstrumentsAvailable,
                        label: "Instruments Available",
                      },
                    ].map((metric, index) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={2}
                        key={index}
                        sx={{ flexGrow: 0, flexShrink: 0 }}
                      >
                        <ToolCard>
                          {metric.icon}
                          <Typography
                            variant="h4"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              fontWeight: "600",
                              color: "#ffffff",
                              mt: 1,
                              fontSize: "1.75rem",
                            }}
                          >
                            {metric.value}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              color: "#d1d5db",
                              mt: 0.5,
                              fontSize: "0.9rem",
                              lineHeight: 1.6,
                            }}
                          >
                            {metric.label}
                          </Typography>
                        </ToolCard>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Management Tools Section */}
                <Box sx={{ mb: 6 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "600",
                      color: "#ffffff",
                      mb: 3,
                      textTransform: "uppercase",
                      fontSize: "1.25rem",
                    }}
                  >
                    Management Tools
                  </Typography>
                  <Grid container spacing={6} justifyContent="center">
                    {sections.map((section) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        md={3.8}
                        key={section.title}
                        sx={{
                          padding: (theme) => theme.spacing(1.5),
                          mx: "auto",
                        }}
                      >
                        <ManagementCard
                          sx={{
                            bgcolor: section.disabled ? "#4b5563" : "#1e293b",
                          }}
                        >
                          {section.icon}
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              fontWeight: "600",
                              color: section.disabled ? "#9ca3af" : "#ffffff",
                              mt: 1.5,
                              textTransform: "uppercase",
                              fontSize: "1.25rem",
                              lineHeight: 1.2,
                            }}
                          >
                            {section.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Inter, sans-serif",
                              color: section.disabled ? "#9ca3af" : "#d1d5db",
                              mb: 2,
                              mt: 1,
                              fontSize: "0.95rem",
                              lineHeight: 1.6,
                            }}
                          >
                            {section.description}
                          </Typography>
                          <CTAButton
                            variant="contained"
                            endIcon={<ArrowForward sx={{ color: "white" }} />}
                            onClick={() => handleNavigation(section.path)}
                            disabled={section.disabled}
                          >
                            Go to {section.title}
                          </CTAButton>
                        </ManagementCard>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Chart Section */}
                <Box sx={{ mb: 6 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontFamily: "Inter, sans-serif",
                      fontWeight: "600",
                      color: "#ffffff",
                      mb: 3,
                      textTransform: "uppercase",
                      fontSize: "1.25rem",
                    }}
                  >
                    Quotation Dashboard
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "center" }}>
                    <ChartCard>
                      <Box
                        sx={{
                          height: 400,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          width: "100%",
                          maxWidth: "1000px",
                          mx: "auto",
                        }}
                      >
                        <Bar data={chartData} options={chartOptions} />
                      </Box>
                    </ChartCard>
                  </Box>
                </Box>
              </>
            </Container>
          </ErrorBoundary>
        </main>
      </Box>
    </Fade>
  );
};

export default AdminPanel;
