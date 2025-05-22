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
        <Box sx={{ textAlign: "center", mt: "20vh" }}>
          <Alert
            severity="error"
            sx={{ maxWidth: "800px", mx: "auto", borderRadius: 2 }}
          >
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
        </Box>
      );
    }
    return this.props.children;
  }
}

const MetricCard = styled(Card)(({ theme }) => ({
  borderRadius: 2,
  backgroundColor: "white",
  elevation: 3,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  padding: theme.spacing(3),
  textAlign: "center",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  height: "100%",
}));

const NavigationCard = styled(Card)(({ theme }) => ({
  borderRadius: 2,
  backgroundColor: "white",
  elevation: 3,
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  padding: theme.spacing(3),
  textAlign: "center",
  height: "100%",
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

        console.log("Fetched Metrics:", newMetrics); // Debug log
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
      icon: <Build sx={{ fontSize: 40, color: "#1976d2" }} />,
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
        backgroundColor: ["#42A5F5", "#66BB6A", "#EF5350"],
        borderColor: ["#2196F3", "#4CAF50", "#D32F2F"],
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: { family: "Helvetica, sans-serif", size: 14 },
          color: "#000000",
        },
      },
      title: {
        display: true,
        text: "Quotation Status Distribution",
        font: { family: "Helvetica, sans-serif", size: 18, weight: "bold" },
        color: "#000000",
        padding: { top: 10, bottom: 20 },
      },
      tooltip: {
        backgroundColor: "#333",
        titleFont: { family: "Helvetica, sans-serif" },
        bodyFont: { family: "Helvetica, sans-serif" },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Quotations",
          font: { family: "Helvetica, sans-serif", size: 14 },
          color: "#000000",
        },
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        ticks: { color: "#000000", font: { family: "Helvetica, sans-serif" } },
      },
      x: {
        title: {
          display: true,
          text: "Status",
          font: { family: "Helvetica, sans-serif", size: 14 },
          color: "#000000",
        },
        grid: { display: false },
        ticks: { color: "#000000", font: { family: "Helvetica, sans-serif" } },
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
                sx={{ mb: 4, mx: "auto", maxWidth: "800px", borderRadius: 2 }}
              >
                <Typography fontFamily="Helvetica, sans-serif">
                  {error}
                </Typography>
              </Alert>
            )}
            {metricErrors.length > 0 && (
              <Alert
                severity="warning"
                sx={{ mb: 4, mx: "auto", maxWidth: "800px", borderRadius: 2 }}
              >
                <Typography fontFamily="Helvetica, sans-serif">
                  Some metrics could not be loaded:
                </Typography>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {metricErrors.map((err, index) => (
                    <li key={index}>
                      <Typography fontFamily="Helvetica, sans-serif">
                        {err}
                      </Typography>
                    </li>
                  ))}
                </ul>
              </Alert>
            )}
            {loading ? (
              <Box sx={{ textAlign: "center", mt: "20vh" }}>
                <CircularProgress size={60} sx={{ color: "#1976d2" }} />
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
                <Box sx={{ mb: 12 }}>
                  <Grid container spacing={4} justifyContent="center">
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
                          <Assignment sx={{ fontSize: 40, color: "#1976d2" }} />
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
                        icon: <Build sx={{ fontSize: 40, color: "#1976d2" }} />,
                        value: metrics.totalInstrumentsAvailable,
                        label: "Instruments Available",
                      },
                    ].map((metric, index) => (
                      <Grid item xs={12} sm={6} md={2.4} key={index}>
                        <MetricCard elevation={3}>
                          {metric.icon}
                          <Typography
                            variant="h4"
                            sx={{
                              fontFamily: "Helvetica, sans-serif",
                              fontWeight: "bold",
                              color: "#000000",
                              mt: 2,
                            }}
                          >
                            {metric.value}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              fontFamily: "Helvetica, sans-serif",
                              color: "text.secondary",
                              mt: 1,
                            }}
                          >
                            {metric.label}
                          </Typography>
                        </MetricCard>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Management Tools Section */}
                <Box sx={{ mb: 12 }}>
                  <Grid container spacing={4} justifyContent="center">
                    {sections.map((section) => (
                      <Grid item xs={12} sm={6} md={4} key={section.title}>
                        <NavigationCard
                          elevation={3}
                          sx={{
                            bgcolor: section.disabled ? "#e0e0e0" : "white",
                          }}
                        >
                          <CardContent sx={{ p: 3, flex: 1 }}>
                            {section.icon}
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: "bold",
                                fontFamily: "Helvetica, sans-serif",
                                color: section.disabled
                                  ? "text.disabled"
                                  : "#000000",
                                mt: 2,
                                textTransform: "uppercase",
                              }}
                            >
                              {section.title}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                fontFamily: "Helvetica, sans-serif",
                                color: section.disabled
                                  ? "text.disabled"
                                  : "text.secondary",
                                mb: 3,
                                mt: 1,
                              }}
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
                                bgcolor: section.disabled
                                  ? "#bdbdbd"
                                  : "#1976d2",
                                "&:hover": {
                                  bgcolor: section.disabled
                                    ? "#bdbdbd"
                                    : "#115293",
                                },
                                textTransform: "uppercase",
                                fontFamily: "Helvetica, sans-serif",
                                fontWeight: "bold",
                                px: 4,
                                py: 1,
                                borderRadius: 2,
                              }}
                            >
                              Go to {section.title.split(" ")[1]}
                            </Button>
                          </CardContent>
                        </NavigationCard>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Chart Section */}
                <Box>
                  <Card
                    elevation={3}
                    sx={{
                      borderRadius: 2,
                      bgcolor: "white",
                      p: 3,
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                      },
                    }}
                  >
                    <Box sx={{ height: 400 }}>
                      <Bar data={chartData} options={chartOptions} />
                    </Box>
                  </Card>
                </Box>
              </>
            )}
          </Container>
        </main>
      </Box>
    </ErrorBoundary>
  );
};

export default AdminPanel;
