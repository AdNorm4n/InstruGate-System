import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  Box,
  CircularProgress,
  Paper,
  Button,
} from "@mui/material";
import {
  People,
  Business,
  Assignment,
  RequestQuote,
  Build,
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

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
});

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
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
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            <Typography variant="h6">Something went wrong.</Typography>
            <Typography>
              {this.state.error?.message || "An unexpected error occurred."}
            </Typography>
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}

const MetricCard = styled(Card)(({ theme }) => ({
  borderRadius: 2,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  padding: theme.spacing(2),
  textAlign: "center",
  bgcolor: "white",
}));

const AdminPanel = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalCompanies: 0,
    totalProjects: 0,
    totalQuotations: 0,
    totalInstrumentsAvailable: 0,
    quotationStatuses: { pending: 0, approved: 0, rejected: 0 },
  });
  const [metricErrors, setMetricErrors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
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

        // Fetch user role
        const userResponse = await api.get("/api/users/me/", { headers });
        setUserRole(userResponse.data.role || "client");

        // Fetch metrics
        const results = await Promise.allSettled([
          // Users
          api.get("/api/users/list/", { headers }).catch((err) => {
            throw new Error(
              `Users: ${err.response?.data?.detail || err.message}`
            );
          }),
          // Quotations (for companies, projects, and statuses)
          api.get("/api/quotations/review/", { headers }).catch((err) => {
            throw new Error(
              `Quotations: ${err.response?.data?.detail || err.message}`
            );
          }),
          // Instruments
          api
            .get("/api/instruments/", {
              headers,
              params: { is_available: true },
            })
            .catch((err) => {
              throw new Error(
                `Instruments: ${err.response?.data?.detail || err.message}`
              );
            }),
        ]);

        const newMetrics = {
          totalUsers: 0,
          totalCompanies: 0,
          totalProjects: 0,
          totalQuotations: 0,
          totalInstrumentsAvailable: 0,
          quotationStatuses: { pending: 0, approved: 0, rejected: 0 },
        };
        const errors = [];

        // Process results
        results.forEach((result, index) => {
          if (result.status === "fulfilled") {
            if (index === 0) {
              // Users
              newMetrics.totalUsers = result.value.data.length || 0;
            } else if (index === 1) {
              // Quotations
              const quotations = result.value.data || [];
              newMetrics.totalQuotations = quotations.length;
              // Derive companies and projects from quotations
              const companies = new Set(quotations.map((q) => q.company));
              const projects = new Set(quotations.map((q) => q.project_name));
              newMetrics.totalCompanies = companies.size;
              newMetrics.totalProjects = projects.size;
              // Calculate quotation statuses
              newMetrics.quotationStatuses = quotations.reduce(
                (acc, q) => {
                  acc[q.status] = (acc[q.status] || 0) + 1;
                  return acc;
                },
                { pending: 0, approved: 0, rejected: 0 }
              );
            } else if (index === 2) {
              // Instruments
              newMetrics.totalInstrumentsAvailable =
                result.value.data.length || 0;
            }
          } else {
            errors.push(result.reason.message);
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
      icon: <People />,
    },
    {
      title: "Manage Instruments",
      path: "/admin/instruments",
      disabled: !["admin", "proposal_engineer"].includes(userRole),
      description: "Manage categories, types, instruments, and add-ons",
      icon: <Build />,
    },
    {
      title: "Manage Quotations",
      path: "/admin/quotations",
      disabled: !["admin", "proposal_engineer", "client"].includes(userRole),
      description: "Review and manage quotations and their items",
      icon: <RequestQuote />,
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
        backgroundColor: ["#42A5F5", "#66BB6A", "#EF5350"],
        borderColor: ["#2196F3", "#4CAF50", "#D32F2F"],
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Quotation Status Distribution",
        font: { family: "Helvetica, sans-serif", size: 16, weight: "bold" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Quotations",
          font: { family: "Helvetica, sans-serif" },
        },
      },
      x: {
        title: {
          display: true,
          text: "Status",
          font: { family: "Helvetica, sans-serif" },
        },
      },
    },
  };

  return (
    <ErrorBoundary>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f5f5f5",
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
              Admin Dashboard
            </Typography>
            {error && (
              <Alert
                severity="error"
                sx={{ mb: 4, mx: "auto", maxWidth: "800px" }}
              >
                {error}
              </Alert>
            )}
            {metricErrors.length > 0 && (
              <Alert
                severity="warning"
                sx={{ mb: 4, mx: "auto", maxWidth: "800px" }}
              >
                <Typography>Some metrics could not be loaded:</Typography>
                <ul>
                  {metricErrors.map((err, index) => (
                    <li key={index}>{err}</li>
                  ))}
                </ul>
              </Alert>
            )}
            {loading ? (
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
                  Loading Dashboard...
                </Typography>
              </Box>
            ) : (
              <>
                {/* Overview Section */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    mb: 6,
                    borderRadius: 2,
                    bgcolor: "white",
                    "&:hover": {
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    },
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Helvetica, sans-serif",
                      mb: 4,
                      textTransform: "uppercase",
                    }}
                  >
                    Overview
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <MetricCard>
                        <People color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            fontWeight: "bold",
                          }}
                        >
                          {metrics.totalUsers}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            color: "text.secondary",
                          }}
                        >
                          Total Users
                        </Typography>
                      </MetricCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <MetricCard>
                        <Business
                          color="primary"
                          sx={{ fontSize: 40, mb: 1 }}
                        />
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            fontWeight: "bold",
                          }}
                        >
                          {metrics.totalCompanies}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            color: "text.secondary",
                          }}
                        >
                          Total Companies
                        </Typography>
                      </MetricCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <MetricCard>
                        <Assignment
                          color="primary"
                          sx={{ fontSize: 40, mb: 1 }}
                        />
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            fontWeight: "bold",
                          }}
                        >
                          {metrics.totalProjects}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            color: "text.secondary",
                          }}
                        >
                          Total Projects
                        </Typography>
                      </MetricCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <MetricCard>
                        <RequestQuote
                          color="primary"
                          sx={{ fontSize: 40, mb: 1 }}
                        />
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            fontWeight: "bold",
                          }}
                        >
                          {metrics.totalQuotations}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            color: "text.secondary",
                          }}
                        >
                          Total Quotations
                        </Typography>
                      </MetricCard>
                    </Grid>
                    <Grid item xs={12} sm={6} md={2.4}>
                      <MetricCard>
                        <Build color="primary" sx={{ fontSize: 40, mb: 1 }} />
                        <Typography
                          variant="h4"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            fontWeight: "bold",
                          }}
                        >
                          {metrics.totalInstrumentsAvailable}
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontFamily: "Helvetica, sans-serif",
                            color: "text.secondary",
                          }}
                        >
                          Instruments Available
                        </Typography>
                      </MetricCard>
                    </Grid>
                  </Grid>
                </Paper>

                {/* Chart Section */}
                <Paper
                  elevation={3}
                  sx={{
                    p: 4,
                    mb: 6,
                    borderRadius: 2,
                    bgcolor: "white",
                    "&:hover": {
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    },
                  }}
                >
                  <Bar data={chartData} options={chartOptions} />
                </Paper>

                {/* Navigation Section */}
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif",
                    mb: 4,
                    textTransform: "uppercase",
                  }}
                >
                  Management Tools
                </Typography>
                <Grid container spacing={4} justifyContent="center">
                  {sections.map((section) => (
                    <Grid item xs={12} sm={6} md={4} key={section.title}>
                      <Card
                        elevation={3}
                        sx={{
                          borderRadius: 2,
                          bgcolor: section.disabled ? "#e0e0e0" : "white",
                          transition: "all 0.3s ease",
                          "&:hover": {
                            transform: section.disabled
                              ? "none"
                              : "translateY(-4px)",
                            boxShadow: section.disabled
                              ? "none"
                              : "0 8px 24px rgba(0, 0, 0, 0.12)",
                          },
                        }}
                      >
                        <CardContent sx={{ textAlign: "center", p: 4 }}>
                          {section.icon}
                          <Typography
                            variant="h6"
                            fontWeight="bold"
                            fontFamily="Helvetica, sans-serif"
                            textTransform="uppercase"
                            color={
                              section.disabled
                                ? "text.disabled"
                                : "primary.main"
                            }
                            sx={{ mt: 2 }}
                          >
                            {section.title}
                          </Typography>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            fontFamily="Helvetica, sans-serif"
                            sx={{ mb: 3 }}
                          >
                            {section.description}
                          </Typography>
                          <Button
                            variant="contained"
                            color="primary"
                            endIcon={<ArrowForward />}
                            onClick={() => handleNavigation(section.path)}
                            disabled={section.disabled}
                            sx={{
                              bgcolor: section.disabled ? "#bdbdbd" : "#1976d2",
                              "&:hover": {
                                bgcolor: section.disabled
                                  ? "#bdbdbd"
                                  : "#115293",
                              },
                              textTransform: "uppercase",
                              fontFamily: "Helvetica, sans-serif",
                              fontWeight: "bold",
                              px: 4,
                              py: 1.5,
                            }}
                          >
                            Go to {section.title.split(" ")[1]}
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}
          </Container>
        </main>
      </Box>
    </ErrorBoundary>
  );
};

export default AdminPanel;
