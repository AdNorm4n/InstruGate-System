import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  Box,
  Container,
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import "../styles/Configurator.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function QuotationForm() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [userData, setUserData] = useState({});
  const [userRole, setUserRole] = useState(null);

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let access = getToken();
        const refresh = getRefreshToken();

        if (!access || !refresh) {
          navigate("/login");
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

        // Fetch user data if not in location.state
        if (!location.state?.userData) {
          const userRes = await api.get("/api/users/me/", {
            headers: { Authorization: `Bearer ${access}` },
          });
          setUserData(userRes.data);
          setUserRole(userRes.data.role);
          console.log("User data:", userRes.data);
        } else {
          setUserData(location.state.userData || {});
          setUserRole(location.state.userData?.role || null);
        }

        // Set selected instruments
        setSelectedInstruments(location.state?.selectedInstruments || []);
      } catch (error) {
        console.error("Error fetching user data:", error);
        navigate("/login");
      }
    };
    fetchData();
  }, [location.state, navigate]);

  const handleSubmit = async () => {
    try {
      let access = getToken();
      const refresh = getRefreshToken();

      if (!access || !refresh) {
        alert("No access token found. Please log in again.");
        navigate("/login");
        return;
      }

      const decoded = jwtDecode(access);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        const res = await api.post("/api/token/refresh/", { refresh });
        access = res.data.access;
        localStorage.setItem(ACCESS_TOKEN, access);
        console.log("Token refreshed:", access);
      }

      const payload = {
        items: selectedInstruments.map((instrumentData) => ({
          product_code: instrumentData.productCode,
          instrument: instrumentData.instrument.id,
        })),
        company: userData.company,
      };

      await api.post("/api/quotations/", payload, {
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
      });

      localStorage.removeItem("selectedInstruments");
      alert("Quotation submitted successfully!");
      navigate("/");
    } catch (error) {
      console.error("Submission failed:", error);
      alert(
        `Failed to submit quotation. Error: ${
          error?.response?.data?.detail || error.message
        }`
      );
    }
  };

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
            Quotation Summary
          </Typography>

          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>User:</strong> {userData.first_name || "N/A"} (
              {userData.username || "N/A"})
            </Typography>
            <Typography variant="body1">
              <strong>Company:</strong> {userData.company || "N/A"}
            </Typography>
          </Box>

          {selectedInstruments.length === 0 ? (
            <Typography variant="body1" align="center" sx={{ mt: 4 }}>
              No instruments selected.
            </Typography>
          ) : (
            <Box sx={{ spaceY: 4 }}>
              {selectedInstruments.map((item, index) => (
                <Box
                  key={index}
                  sx={{
                    mb: 4,
                    p: 3,
                    border: 1,
                    borderColor: "grey.300",
                    borderRadius: 2,
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {item.instrument.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: "text.secondary", mb: 2 }}
                  >
                    <strong>Product Code:</strong> {item.productCode}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Requirements
                  </Typography>
                  <List>
                    {Object.values(item.selections).map((sel, idx) => (
                      <ListItem key={idx} disablePadding>
                        <ListItemText primary={`[${sel.code}] ${sel.label}`} />
                      </ListItem>
                    ))}
                  </List>

                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Add-Ons
                  </Typography>
                  <List>
                    {item.selectedAddOns.length > 0 ? (
                      item.selectedAddOns.map((addon, idx) => (
                        <ListItem key={idx} disablePadding>
                          <ListItemText
                            primary={`[${addon.code}] ${addon.label} (${addon.addon_type.name})`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem disablePadding>
                        <ListItemText primary="No Add-Ons selected" />
                      </ListItem>
                    )}
                  </List>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              sx={{
                textTransform: "uppercase",
                fontWeight: "bold",
                px: 4,
                py: 1.5,
                backgroundColor: "#1976d2",
                "&:hover": { backgroundColor: "#115293" },
              }}
            >
              Submit Quotation
            </Button>
          </Box>
        </Container>
      </main>
    </div>
  );
}

export default QuotationForm;
