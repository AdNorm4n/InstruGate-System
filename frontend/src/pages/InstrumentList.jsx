import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Container,
  CircularProgress,
  Button,
  Fade,
  Alert,
} from "@mui/material";
import api from "../api";
import InstrumentCard from "../components/InstrumentCard";
import Navbar from "../components/Navbar";
import { styled } from "@mui/material/styles";
import "../styles/InstrumentList.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const CategoryCard = styled(Card)(({ theme, active }) => ({
  borderRadius: "16px",
  backgroundColor: "#ffffff",
  border: `2px solid ${active ? "#d6393a" : "#e0e0e0"}`,
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition:
    "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    borderColor: "#d4a017",
  },
  fontFamily: "Helvetica, sans-serif !important",
}));

const ResetButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#e0e0e0",
  color: "#333",
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif !important",
  "&:hover": {
    backgroundColor: "#d0d0d0",
    transform: "scale(1.05)",
  },
  transition: "all 0.3s ease",
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
}));

const InstrumentList = () => {
  const [groupedData, setGroupedData] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [configCache, setConfigCache] = useState({});

  // Fetch user role, instruments, and prefetch configs
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, instrumentsRes] = await Promise.all([
          api.get("/api/users/me/"),
          api.get("/api/instruments/"),
        ]);

        setUserRole(userRes.data.role);

        const instruments = instrumentsRes.data.filter((i) => i.is_available);
        console.log("Instruments API response:", instruments);
        const grouped = {};

        instruments.forEach((instrument) => {
          const category = instrument.type.category.name;
          if (!grouped[category]) grouped[category] = [];
          grouped[category].push(instrument);
        });

        setGroupedData(grouped);

        // Prefetch instrument configs
        const configPromises = instruments.map((instrument) =>
          api.get(`/api/instruments/${instrument.id}/config/`).catch((err) => {
            console.error(
              `Failed to prefetch config for ${instrument.id}:`,
              err
            );
            return { data: null };
          })
        );
        const configResponses = await Promise.all(configPromises);
        const newConfigCache = {};
        configResponses.forEach((res, index) => {
          if (res.data) {
            newConfigCache[instruments[index].id] = res.data;
            console.log(
              `Prefetched config for ${instruments[index].id}:`,
              res.data
            );
          }
        });
        setConfigCache(newConfigCache);
      } catch (err) {
        console.error("Error fetching data:", err);
        setUserRole("error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handle category click
  const handleCategoryClick = (category) => {
    setSelectedCategory(category === selectedCategory ? null : category);
  };

  // Loading fallback
  if (loading) {
    return (
      <Fade in timeout={800}>
        <Box sx={{ display: "flex", justifyContent: "center", mt: "20vh" }}>
          <ToolCard sx={{ maxWidth: 400, textAlign: "center" }}>
            <CircularProgress />
            <Typography
              variant="h6"
              sx={{
                mt: 2,
                fontFamily: "Helvetica, sans-serif !important",
                fontWeight: "bold",
                color: "#000000",
                fontSize: "0.9rem",
              }}
            >
              Loading instruments...
            </Typography>
          </ToolCard>
        </Box>
      </Fade>
    );
  }

  // Error fallback
  if (userRole === "error") {
    return (
      <Fade in timeout={800}>
        <Box sx={{ display: "flex", justifyContent: "center", mt: "20vh" }}>
          <ToolCard sx={{ maxWidth: 400, textAlign: "center" }}>
            <Alert
              severity="error"
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                fontSize: "0.85rem",
              }}
            >
              Failed to load instruments. Please try again later.
            </Alert>
          </ToolCard>
        </Box>
      </Fade>
    );
  }

  return (
    <Fade in timeout={800}>
      <Box
        className="instrument-list-page"
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
              Rueger’s Instruments
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
              Explore our range of precision instrumentation for various
              applications.
            </Typography>

            {/* Categories */}
            <ToolCard sx={{ mb: 6 }}>
              <Grid container spacing={3} justifyContent="center">
                {Object.keys(groupedData).map((category) => (
                  <Grid item xs={12} sm={6} md={3} key={category}>
                    <CategoryCard active={selectedCategory === category}>
                      <CardActionArea
                        onClick={() => handleCategoryClick(category)}
                        sx={{ p: 3 }}
                      >
                        <CardContent sx={{ textAlign: "center" }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              color:
                                selectedCategory === category
                                  ? "#d6393a"
                                  : "#000000",
                              fontSize: "1rem",
                            }}
                          >
                            {category}
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              color: "#666",
                              fontSize: "0.85rem",
                            }}
                          >
                            {groupedData[category].length} Instruments
                          </Typography>
                        </CardContent>
                      </CardActionArea>
                    </CategoryCard>
                  </Grid>
                ))}
              </Grid>
            </ToolCard>

            {/* Instruments */}
            {selectedCategory && (
              <Box sx={{ mt: 4 }}>
                <Box
                  sx={{ display: "flex", justifyContent: "center", mb: 3 }}
                ></Box>
                <ToolCard>
                  <Grid container spacing={3}>
                    {groupedData[selectedCategory].map((instrument) => (
                      <Grid item xs={12} key={instrument.id}>
                        <InstrumentCard
                          instrument={instrument}
                          userRole={userRole}
                          configData={configCache[instrument.id]}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </ToolCard>
              </Box>
            )}
          </Container>
        </main>
      </Box>
    </Fade>
  );
};

export default InstrumentList;
