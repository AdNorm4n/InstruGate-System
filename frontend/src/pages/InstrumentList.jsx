// src/pages/InstrumentList.jsx
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
  const [expandedType, setExpandedType] = useState(null);

  useEffect(() => {
    api.get("/api/instruments/").then((res) => {
      const instruments = res.data.filter((i) => i.is_available);
      const group = {};
      instruments.forEach((instrument) => {
        const category = instrument.type.category.name;
        const type = instrument.type.name;

        if (!group[category]) group[category] = {};
        if (!group[category][type]) group[category][type] = [];
        group[category][type].push(instrument);
      });
      setGroupedData(group);
    });

    api
      .get("/api/users/me/")
      .then((res) => setUserRole(res.data.role))
      .catch((err) => {
        console.error("Failed to fetch user role:", err);
        setUserRole(null);
      });
  }, []);

  if (userRole === null) return <div>Loading...</div>;

  return (
    <div className="instrument-list-page">
      <Navbar userRole={userRole} />
      <DrawerHeader />

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
            mb: 4,
            textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
          }}
        >
          — Rueger’s Products —
        </Typography>

        <Grid container spacing={4}>
          {Object.keys(groupedData).map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category}>
              <Box sx={{ mt: 6 }}>
                <Typography variant="h5" sx={{ mb: 3 }}>
                  {category}
                </Typography>

                <Grid container spacing={3}>
                  {Object.keys(groupedData[category]).map((type) => {
                    const isExpanded = expandedType === `${category}-${type}`;

                    return (
                      <Grid item xs={12} sm={6} md={4} key={type}>
                        <Card
                          elevation={3}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            borderRadius: 3,
                            height: "100%",
                          }}
                          className="instrument-card"
                        >
                          <CardActionArea
                            onClick={() =>
                              setExpandedType(
                                isExpanded ? null : `${category}-${type}`
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
                                {groupedData[category][type].length} items
                              </Typography>
                            </CardContent>
                          </CardActionArea>

                          <Collapse
                            in={isExpanded}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Divider />
                            <Box sx={{ p: 2 }}>
                              <Typography
                                variant="subtitle2"
                                sx={{ mb: 2, fontWeight: "bold" }}
                              >
                                Products under {type}
                              </Typography>
                              <Grid container spacing={2}>
                                {groupedData[category][type].map(
                                  (instrument) => (
                                    <Grid
                                      item
                                      xs={12}
                                      sm={6}
                                      key={instrument.id}
                                    >
                                      <InstrumentCard instrument={instrument} />
                                    </Grid>
                                  )
                                )}
                              </Grid>
                            </Box>
                          </Collapse>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </div>
  );
};

export default InstrumentList;
