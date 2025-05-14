import React, { useEffect, useState } from "react";
import {
  Box,
  Grid,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  Collapse,
  Divider,
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
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [expandedType, setExpandedType] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🟢 Fetch user role and instruments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, instrumentsRes] = await Promise.all([
          api.get("/api/users/me/"),
          api.get("/api/instruments/"),
        ]);

        setUserRole(userRes.data.role);

        const instruments = instrumentsRes.data.filter((i) => i.is_available);
        const grouped = {};

        instruments.forEach((instrument) => {
          const category = instrument.type.category.name;
          const type = instrument.type.name;

          if (!grouped[category]) grouped[category] = {};
          if (!grouped[category][type]) grouped[category][type] = [];

          grouped[category][type].push(instrument);
        });

        setGroupedData(grouped);
      } catch (err) {
        console.error("Error fetching data:", err);
        setUserRole("error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 🔄 Loading fallback
  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading instruments...
        </Typography>
      </div>
    );
  }

  // ❌ Error fallback
  if (userRole === "error") {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <Typography variant="h6" color="error">
          Failed to load instruments. Please try again later.
        </Typography>
      </div>
    );
  }

  return (
    <div
      className="instrument-list-page"
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
      }}
    >
      <Navbar userRole={userRole} />
      <DrawerHeader />

      <main style={{ flex: 1 }}>
        <Container maxWidth="xl" sx={{ py: 4, mt: 10 }}>
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
            Rüeger’s Products
          </Typography>

          {/* Categories */}
          <Grid container spacing={4} justifyContent="center">
            {Object.keys(groupedData).map((category) => (
              <Grid item xs={12} sm={4} key={category}>
                <Card
                  elevation={4}
                  sx={{
                    borderRadius: 3,
                    bgcolor:
                      expandedCategory === category ? "primary.light" : "white",
                    height: "150px",
                    width: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    textAlign: "center",
                  }}
                >
                  <CardActionArea
                    sx={{ width: "100%", height: "100%" }}
                    onClick={() =>
                      setExpandedCategory(
                        expandedCategory === category ? null : category
                      )
                    }
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" align="center">
                        {category}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {Object.keys(groupedData[category]).length} types
                      </Typography>
                    </CardContent>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Types and Instruments */}
          {expandedCategory && (
            <Box sx={{ mt: 6 }}>
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                {expandedCategory}
              </Typography>

              <Grid container spacing={3}>
                {Object.keys(groupedData[expandedCategory]).map((type) => {
                  const isExpanded =
                    expandedType === `${expandedCategory}-${type}`;

                  return (
                    <Grid item xs={12} key={type}>
                      <Card
                        elevation={3}
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          borderRadius: 3,
                        }}
                        className="instrument-card"
                      >
                        <CardActionArea
                          onClick={() =>
                            setExpandedType(
                              isExpanded ? null : `${expandedCategory}-${type}`
                            )
                          }
                        >
                          <CardContent>
                            <Typography variant="h6" align="center">
                              {type}
                            </Typography>
                            <Typography
                              variant="body2"
                              align="center"
                              color="text.secondary"
                            >
                              {groupedData[expandedCategory][type].length} items
                            </Typography>
                          </CardContent>
                        </CardActionArea>

                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Divider />
                          <Box
                            sx={{
                              p: 2,
                              display: "flex",
                              flexWrap: "wrap",
                              gap: 2,
                              justifyContent: "flex-start",
                            }}
                          >
                            {groupedData[expandedCategory][type].map(
                              (instrument) => (
                                <Box
                                  key={instrument.id}
                                  sx={{
                                    flex: "1 1 calc(20% - 1rem)",
                                    minWidth: 240,
                                    maxWidth: "100%",
                                  }}
                                >
                                  <InstrumentCard instrument={instrument} />
                                </Box>
                              )
                            )}
                          </Box>
                        </Collapse>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          )}
        </Container>
      </main>
    </div>
  );
};

export default InstrumentList;
