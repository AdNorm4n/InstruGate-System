import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Configurator.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function SelectedInstruments() {
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [userData, setUserData] = useState({
    username: "",
    first_name: "",
    company: "",
  });
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get("/api/users/me/");
        setUserRole(userRes.data.role);
        setUserData({
          username: userRes.data.username || "Guest",
          first_name: userRes.data.first_name || "Guest",
          company: userRes.data.company || "Unknown",
        });
        console.log("User data:", userRes.data);

        const cart =
          JSON.parse(localStorage.getItem("selectedInstruments")) || [];
        setSelectedInstruments(cart);
        console.log("Selected instruments:", cart);
      } catch (err) {
        console.error("Error fetching data:", err);
        setUserRole("error");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const removeInstrument = (indexToRemove) => {
    const updated = selectedInstruments.filter(
      (_, index) => index !== indexToRemove
    );
    setSelectedInstruments(updated);
    localStorage.setItem("selectedInstruments", JSON.stringify(updated));
    console.log("Updated selectedInstruments:", updated);
  };

  const handleAddMoreInstruments = () => {
    navigate("/instruments");
  };

  const handleProceedToQuotation = () => {
    navigate("/quotation", { state: { selectedInstruments, userData } });
    console.log("Navigating to quotation with:", {
      selectedInstruments,
      userData,
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading selected instruments...
        </Typography>
      </div>
    );
  }

  if (userRole === "error") {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <Typography variant="h6" color="error">
          Failed to load user data. Please log in again.
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
            Selected Instruments
          </Typography>

          {selectedInstruments.length === 0 ? (
            <Box sx={{ textAlign: "center", mt: 8 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                No instruments selected yet.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAddMoreInstruments}
                sx={{ borderRadius: 2 }}
              >
                Add Instruments
              </Button>
            </Box>
          ) : (
            <>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  justifyContent: "center",
                  mb: 6,
                }}
              >
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#3498db",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#2980b9" },
                  }}
                  onClick={handleAddMoreInstruments}
                >
                  Add More Instruments
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    bgcolor: "#27ae60",
                    borderRadius: 2,
                    "&:hover": { bgcolor: "#219653" },
                  }}
                  onClick={handleProceedToQuotation}
                >
                  Proceed to Quotation
                </Button>
              </Box>

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
                  <Typography variant="h6" sx={{ fontWeight: "bold", mb: 1 }}>
                    {item.instrument.name}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Product Code:</strong> {item.productCode}
                  </Typography>

                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1 }}
                  >
                    Requirements
                  </Typography>
                  <List>
                    {Object.values(item.selections).length > 0 ? (
                      Object.values(item.selections).map((selection, idx) => (
                        <ListItem key={idx} disablePadding>
                          <ListItemText
                            primary={`[${selection.code}] ${selection.label}`}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem disablePadding>
                        <ListItemText primary="No requirements selected." />
                      </ListItem>
                    )}
                  </List>

                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: "bold", mb: 1, mt: 2 }}
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
                        <ListItemText primary="No Add-Ons selected." />
                      </ListItem>
                    )}
                  </List>

                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: "#e74c3c",
                      mt: 2,
                      borderRadius: 2,
                      "&:hover": { bgcolor: "#c0392b" },
                    }}
                    onClick={() => removeInstrument(index)}
                  >
                    Remove
                  </Button>
                </Box>
              ))}
            </>
          )}
        </Container>
      </main>
    </div>
  );
}

export default SelectedInstruments;
