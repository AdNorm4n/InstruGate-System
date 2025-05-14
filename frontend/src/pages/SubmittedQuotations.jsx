import React, { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Configurator.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function SubmittedQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [instruments, setInstruments] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let access = getToken();
        const refresh = getRefreshToken();

        if (!access || !refresh) {
          setError("No access token found. Please log in again.");
          setLoading(false);
          return;
        }

        // Check token expiration
        const decoded = jwtDecode(access);
        const now = Date.now() / 1000;
        if (decoded.exp < now) {
          const res = await api.post("/api/token/refresh/", { refresh });
          access = res.data.access;
          localStorage.setItem(ACCESS_TOKEN, access);
          console.log("Token refreshed:", access);
        }

        // Fetch user role, quotations, and instruments
        const [userRes, quotationsRes, instrumentsRes] = await Promise.all([
          api.get("/api/users/me/", {
            headers: { Authorization: `Bearer ${access}` },
          }),
          api.get("/api/quotations/submitted/", {
            headers: { Authorization: `Bearer ${access}` },
          }),
          api.get("/api/instruments/", {
            headers: { Authorization: `Bearer ${access}` },
          }),
        ]);

        setUserRole(userRes.data.role);
        console.log("User role:", userRes.data.role);

        const quotationsData = quotationsRes.data;
        setQuotations(quotationsData);
        console.log(
          "Quotations data:",
          JSON.stringify(quotationsData, null, 2)
        );

        // Map instrument IDs to names
        const instrumentMap = {};
        instrumentsRes.data.forEach((inst) => {
          instrumentMap[inst.id] = inst.name;
        });
        setInstruments(instrumentMap);
        console.log("Instruments map:", instrumentMap);

        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          `Failed to fetch submitted quotations. Error: ${
            err?.response?.data?.detail || err.message
          }`
        );
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading submitted quotations...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      </div>
    );
  }

  return (
    <div
      className="configurator-page"
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
            Submitted Quotations
          </Typography>

          {quotations.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ mt: 4 }}>
              No quotations submitted yet.
            </Typography>
          ) : (
            <Box sx={{ spaceY: 4 }}>
              {quotations.map((quotation) => (
                <Box
                  key={quotation.id || `quotation-${Math.random()}`}
                  sx={{
                    mb: 4,
                    p: 3,
                    border: 1,
                    borderColor: "grey.300",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    Quotation #{quotation.id || "Unknown"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mb: 1 }}
                  >
                    Submitted at:{" "}
                    {quotation.submitted_at
                      ? (() => {
                          try {
                            return format(
                              parseISO(quotation.submitted_at),
                              "PPp"
                            );
                          } catch {
                            return "Unknown";
                          }
                        })()
                      : "Unknown"}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mb: 2 }}
                  >
                    Company: {quotation.company || "Unknown"}
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Items
                  </Typography>
                  <List>
                    {quotation.items.map((item, index) => (
                      <ListItem key={index} disablePadding>
                        <ListItemText
                          primary={
                            <>
                              <strong>Product Code:</strong> {item.product_code}{" "}
                              <br />
                              <strong>Instrument:</strong>{" "}
                              {instruments[item.instrument] ||
                                `Unknown (ID ${item.instrument})`}
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              ))}
            </Box>
          )}
        </Container>
      </main>
    </div>
  );
}

export default SubmittedQuotations;
