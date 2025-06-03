import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
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
import Navbar from "../components/Navbar";

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
        ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        bar.draw(ctx);
        ctx.restore();
      });
    });
  },
};

ChartJS.register(barShadowPlugin);

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ToolCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif",
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
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif",
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
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif",
  width: "100%",
  maxWidth: "1000px",
  mx: "auto",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
    width: "100%",
  },
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
            <Alert severity="error" sx={{ borderRadius: 2 }}>
              <Typography
                variant="h6"
                fontFamily="Helvetica, sans-serif"
                fontWeight="bold"
              >
                Something went wrong.
              </Typography>
              <Typography fontFamily="Helvetica, sans-serif">
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
  const [userRole, setUserRole] = useState("");
  const [error, setError] = useState("");
  const [metricErrors, setMetricErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalProjects: 0,
    totalQuotations: 0,
    totalInstrumentsAvailable: 0,
    quotationStatuses: { pending: 0, approved: 0, rejected: 0 },
  });

  useEffect(() => {
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
          { url: "/api/users/me/", key: "user" },
        ];

        const responses = await Promise.all(
          endpoints.map(({ url, params }) =>
            api.get(url, { headers, params }).catch((err) => {
              console.error(
                `Error fetching ${url}:`,
                err.response?.data || err.message
              );
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
          quotationStatuses: { pending: 0, approved: 0, rejected: 0 },
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
            const companies = new Set(data.map((q) => q.company));
            const projects = new Set(data.map((q) => q.project_name));
            newMetrics.totalCompanies = companies.size;
            newMetrics.totalProjects = projects.size;
            newMetrics.quotationStatuses = data.reduce(
              (acc, q) => {
                acc[q.status] = (acc[q.status] || 0) + 1;
                return acc;
              },
              { pending: 0, approved: 0, rejected: 0 }
            );
          } else if (index === 2) {
            newMetrics.totalInstrumentsAvailable = data.length;
          } else if (index === 3) {
            setUserRole(response.data?.role || "client");
          }
        });

        console.log("Fetched Metrics:", newMetrics);
        setMetrics(newMetrics);
        if (errors.length > 0) {
          setMetricErrors(errors);
        }
      } catch (err) {
        console.error("fetchData Error:", err, err.response?.data);
        setError(
          `Error loading dashboard: ${
            err.response?.data?.detail || err.message
          }`
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleNavigation = (path) => {
    if (!["admin", "proposal_engineer", "client"].includes(userRole)) {
      setError("You do not have permission to access admin pages.");
      return;
    }
    navigate(path);
  };

  const sections = [
    {
      title: "Manage Users",
      path: "/admin/users",
      disabled: userRole !== "admin",
      description: "Create, update, or delete user accounts",
      icon: <People sx={{ fontSize: 40, color: "#1976d2" }} />,
    },
    {
      title: "Manage Instruments",
      path: "/admin/instruments",
      disabled: !["admin", "proposal_engineer"].includes(userRole),
      description: "Manage categories, types, instruments, and add-ons",
      icon: <Speed sx={{ fontSize: 40, color: "#1976d2" }} />,
    },
    {
      title: "Manage Quotations",
      path: "/admin/quotations",
      disabled: !["admin", "proposal_engineer", "client"].includes(userRole),
      description: "Review and manage quotations and their items",
      icon: <RequestQuote sx={{ fontSize: 40, color: "#1976d2" }} />,
    },
  ];

  const chartData = {
    labels: ["Pending", "Approved", "Rejected"],
    datasets: [
      {
        label: "Quotation Statuses",
        data: [
          metrics.quotationStatuses.pending,
          metrics.quotationStatuses.approved,
          metrics.quotationStatuses.rejected,
        ],
        backgroundColor: [
          "linear-gradient(180deg, #42A5F5 0%, #1976D2 100%)",
          "linear-gradient(180deg, #66BB6A 0%, #388E3C 100%)",
          "linear-gradient(180deg, #F06292 0%, #d6393a 100%)",
        ].map((gradient) => {
          const ctx = document.createElement("canvas").getContext("2d");
          const grad = ctx.createLinearGradient(0, 0, 0, 400);
          const [start, end] = gradient.match(/#[0-9A-Fa-f]{6}/g);
          grad.addColorStop(0, start);
          grad.addColorStop(1, end);
          return grad;
        }),
        borderColor: ["#1565C0", "#2E7D32", "#AD1457"],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    barPercentage: 0.4,
    categoryPercentage: 0.7,
    layout: {
      padding: {
        left: 30,
        right: 30,
      },
    },
    plugins: {
      legend: {
        position: "right",
        labels: {
          font: { family: "Helvetica, sans-serif", size: 16 },
          color: "#000000",
          padding: 25,
        },
      },
      title: {
        display: true,
        text: "Quotation Status Distribution",
        font: {
          family: "Helvetica, sans-serif",
          size: 22,
          weight: "bold",
        },
        color: "#000000",
        padding: { top: 15, bottom: 35 },
      },
      tooltip: {
        backgroundColor: "#333",
        titleFont: { family: "Helvetica, sans-serif", size: 16 },
        bodyFont: { family: "Helvetica, sans-serif", size: 14 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Quotations",
          font: { family: "Helvetica, sans-serif", size: 18 },
          color: "#000000",
          padding: { top: 10, bottom: 10 },
        },
        grid: { color: "rgba(0, 0, 0, 0.03)" },
        ticks: {
          color: "#000000",
          font: { family: "Helvetica, sans-serif", size: 16 },
          stepSize: 1,
        },
        backgroundColor: "#FAFAFA",
      },
      x: {
        title: {
          display: true,
          text: "Status",
          font: { family: "Helvetica, sans-serif", size: 18 },
          color: "#000000",
          padding: { top: 10, bottom: 10 },
        },
        grid: { color: "rgba(0, 0, 0, 0.03)" },
        ticks: {
          color: "#000000",
          font: { family: "Helvetica, sans-serif", size: 16 },
        },
        backgroundColor: "#FAFAFA",
      },
    },
  };

  if (loading) {
    return (
      <Fade in>
        <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", pt: 8 }}>
          <Container maxWidth="xl">
            <ToolCard
              sx={{ p: 3, mx: "auto", maxWidth: "600px", textAlign: "center" }}
            >
              <CircularProgress size={48} sx={{ color: "#1976d2" }} />
            </ToolCard>
          </Container>
        </Box>
      </Fade>
    );
  }

  if (error) {
    return (
      <Fade in>
        <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fa", pt: 8 }}>
          <Container maxWidth="xl">
            <ToolCard sx={{ p: 3, mx: "auto", maxWidth: "800px" }}>
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                <Typography
                  variant="body1"
                  fontFamily="Helvetica, sans-serif"
                  fontSize="0.9rem"
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
          bgcolor: "#f8f9fa",
        }}
        className="admin-panel-page"
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <ErrorBoundary>
            <Container maxWidth="xl" sx={{ py: 6, mt: 8 }}>
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
                Admin Dashboard
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
                Manage users, instruments, and quotations with ease.
              </Typography>
              {metricErrors.length > 0 && (
                <ToolCard sx={{ mb: 4, mx: "auto", maxWidth: "800px" }}>
                  <Alert severity="warning" sx={{ borderRadius: 2 }}>
                    <Typography
                      variant="body1"
                      fontFamily="Helvetica, sans-serif"
                      fontSize="0.9rem"
                      lineHeight={1.6}
                    >
                      Some metrics could not be loaded:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {metricErrors.map((err, index) => (
                        <li key={index}>
                          <Typography
                            variant="body2"
                            fontFamily="Helvetica, sans-serif"
                            fontSize="0.9rem"
                            lineHeight={1.6}
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
                      fontFamily: "Helvetica, sans-serif",
                      fontWeight: "bold",
                      color: "#000000",
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
                          <People sx={{ fontSize: 40, color: "#1976d2" }} />
                        ),
                        value: metrics.totalUsers,
                        label: "Total Users",
                      },
                      {
                        icon: (
                          <Business sx={{ fontSize: 40, color: "#1976d2" }} />
                        ),
                        value: metrics.totalCompanies,
                        label: "Total Companies",
                      },
                      {
                        icon: (
                          <Archive sx={{ fontSize: 40, color: "#1976d2" }} />
                        ),
                        value: metrics.totalProjects,
                        label: "Total Projects",
                      },
                      {
                        icon: (
                          <RequestQuote
                            sx={{ fontSize: 40, color: "#1976d2" }}
                          />
                        ),
                        value: metrics.totalQuotations,
                        label: "Total Quotations",
                      },
                      {
                        icon: <Speed sx={{ fontSize: 40, color: "#1976d2" }} />,
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
                              fontFamily: "Helvetica, sans-serif",
                              fontWeight: "bold",
                              color: "#000000",
                              mt: 1,
                              fontSize: "1.75rem",
                            }}
                          >
                            {metric.value}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "Helvetica, sans-serif",
                              color: "#333",
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
                      fontFamily: "Helvetica, sans-serif",
                      fontWeight: "bold",
                      color: "#000000",
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
                            bgcolor: section.disabled ? "#e0e0e0" : "white",
                          }}
                        >
                          {section.icon}
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: "Helvetica, sans-serif",
                              fontWeight: "bold",
                              color: section.disabled
                                ? "text.disabled"
                                : "#000000",
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
                              fontFamily: "Helvetica, sans-serif",
                              color: section.disabled ? "#ccc" : "#333",
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
                            endIcon={<ArrowForward />}
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
                      fontFamily: "Helvetica, sans-serif",
                      fontWeight: "bold",
                      color: "#000000",
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
