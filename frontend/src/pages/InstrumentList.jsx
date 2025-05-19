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
} from "@mui/material";
import api from "../api";
import InstrumentCard from "../components/InstrumentCard";
import Navbar from "../components/Navbar";
import { styled } from "@mui/material/styles";
import "../styles/InstrumentList.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
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
          Loading instruments...
        </Typography>
      </Box>
    );
  }

  // Error fallback
  if (userRole === "error") {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <Typography
          variant="h6"
          color="error"
          sx={{
            fontFamily: "Helvetica, sans-serif",
            fontWeight: "bold",
          }}
        >
          Failed to load instruments. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className="instrument-list-page"
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
            Rueger’s Instruments
          </Typography>

          {/* Categories */}
          <Grid container spacing={4} justifyContent="center">
            {Object.keys(groupedData).map((category) => (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Card
                  elevation={3}
                  sx={{
                    borderRadius: 2,
                    bgcolor:
                      selectedCategory === category ? "#e3f2fd" : "white",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      transform: "translateY(-4px)",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                    },
                  }}
                >
                  <CardActionArea
                    onClick={() => handleCategoryClick(category)}
                    sx={{ p: 3 }}
                  >
                    <CardContent sx={{ textAlign: "center" }}>
                      <Typography
                        variant="h6"
                        fontWeight="bold"
                        fontFamily="Helvetica, sans-serif"
                        textTransform="uppercase"
                        color={
                          selectedCategory === category
                            ? "primary.main"
                            : "#000000"
                        }
                      >
                        {category}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        fontFamily="Helvetica, sans-serif"
                      >
                        {groupedData[category].length} Instruments
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Instruments */}
          {selectedCategory && (
            <Box sx={{ mt: 8 }}>
              <Grid container spacing={4}>
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
            </Box>
          )}
        </Container>
      </main>
    </Box>
  );
};

export default InstrumentList;
