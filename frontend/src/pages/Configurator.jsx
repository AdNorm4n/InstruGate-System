import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Configurator.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function Configurator() {
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState(null);
  const [fields, setFields] = useState([]);
  const [addons, setAddons] = useState([]);
  const [selections, setSelections] = useState({});
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [showAddOns, setShowAddOns] = useState(false);
  const [codeSegments, setCodeSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, instrumentRes] = await Promise.all([
          api.get("/api/users/me/"),
          api.get(`/api/instruments/${instrumentId}/config/`),
        ]);
        setUserRole(userRes.data.role);
        setInstrument(instrumentRes.data);
        console.log("Instrument data:", instrumentRes.data);
        setFields(instrumentRes.data.fields || []);
      } catch {
        alert("Failed to load configurator");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [instrumentId]);

  useEffect(() => {
    if (showAddOns) {
      api
        .get(`/api/instruments/${instrumentId}/addons/`)
        .then((res) => {
          console.log("Add-ons data:", res.data);
          setAddons(res.data);
        })
        .catch(() => alert("Failed to load add-ons"));
    }
  }, [instrumentId, showAddOns]);

  const handleSelect = (fieldId, option) => {
    if (option) {
      setSelections((prev) => {
        const newSelections = { ...prev, [fieldId]: option };
        console.log("Updated selections:", newSelections);
        return newSelections;
      });
    } else {
      console.error(`No option found for field ${fieldId}`);
    }
  };

  const handleAddOnToggle = (addon) => {
    setSelectedAddOns((prev) => {
      const isSelected = prev.includes(addon);
      const newAddOns = isSelected
        ? prev.filter((a) => a !== addon)
        : [...prev, addon];
      console.log("Updated selectedAddOns:", newAddOns);
      return newAddOns;
    });
  };

  const shouldShowField = (field) => {
    if (!field.parent_field) return true;
    const selected = selections[field.parent_field];
    console.log(
      `Field ${field.name}: parent_field=${field.parent_field}, selected=${selected?.code}, trigger_value=${field.trigger_value}`
    );
    return selected?.code === field.trigger_value;
  };

  useEffect(() => {
    const codes = fields.filter(shouldShowField).map((f) => {
      const selected = selections[f.id];
      return selected ? `[${selected.code}]` : "[]";
    });
    const addonCodes = selectedAddOns.map((a) => a.code).join("");
    if (addonCodes) codes.push(`[${addonCodes}]`);
    console.log("Updated codeSegments:", codes);
    setCodeSegments(codes);
  }, [fields, selections, selectedAddOns]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Loading configurator...
        </Typography>
      </div>
    );
  }

  if (!instrument) {
    return (
      <div style={{ textAlign: "center", marginTop: "20%" }}>
        <Typography variant="h6" color="error">
          Failed to load configurator. Please try again later.
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
        <Container maxWidth="md" sx={{ py: 4, mt: 10 }}>
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
            {instrument.name} Configurator
          </Typography>
          <Typography
            variant="body1"
            align="center"
            sx={{ mb: 4, color: "text.secondary" }}
          >
            {instrument.description}
          </Typography>
          <Typography
            variant="body2"
            align="center"
            sx={{ mb: 6, fontWeight: "bold" }}
          >
            Product Code: {codeSegments.join("")}
          </Typography>

          {!showAddOns ? (
            <Box className="config-formLED" sx={{ mb: 4 }}>
              {console.log("Rendering fields:", fields)}
              {fields
                .filter(shouldShowField)
                .sort((a, b) => a.order - b.order)
                .map((field) => (
                  <FormControl
                    fullWidth
                    key={field.id}
                    sx={{ mb: 3 }}
                    className="config-field"
                  >
                    <InputLabel>{field.name}</InputLabel>
                    <Select
                      value={selections[field.id]?.id || ""}
                      label={field.name}
                      onChange={(e) => {
                        console.log("Selected value:", e.target.value);
                        console.log("Options:", field.options);
                        const opt = field.options.find(
                          (o) => o.id.toString() === e.target.value.toString()
                        );
                        console.log("Selected option:", opt);
                        handleSelect(field.id, opt);
                      }}
                      sx={{ pointerEvents: "auto", zIndex: 1000 }}
                    >
                      <MenuItem value="">-- Select --</MenuItem>
                      {field.options.map((opt) => (
                        <MenuItem key={opt.id} value={opt.id}>
                          [{opt.code}] {opt.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ))}
              <Button
                variant="contained"
                color="primary"
                onClick={() => setShowAddOns(true)}
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Next
              </Button>
            </Box>
          ) : (
            <Box className="addons-section">
              <Typography variant="h6" sx={{ mb: 3, fontWeight: "bold" }}>
                Optional Add-Ons
              </Typography>
              {addons.length > 0 ? (
                addons.map((addon) => (
                  <FormControlLabel
                    key={addon.id}
                    control={
                      <Checkbox
                        checked={selectedAddOns.includes(addon)}
                        onChange={() => handleAddOnToggle(addon)}
                      />
                    }
                    label={`[${addon.code}] ${addon.label} (${addon.addon_type.name})`}
                    sx={{ mb: 1, display: "block" }}
                    className="addon-checkbox"
                  />
                ))
              ) : (
                <Typography variant="body2" sx={{ mb: 3 }}>
                  No add-ons available for this instrument.
                </Typography>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={() =>
                  navigate(`/instruments/${instrumentId}/review`, {
                    state: {
                      instrument,
                      selections,
                      selectedAddOns,
                      productCode: codeSegments.join(""),
                    },
                  })
                }
                sx={{ mt: 2, borderRadius: 2 }}
              >
                Next - Review
              </Button>
            </Box>
          )}
        </Container>
      </main>
    </div>
  );
}

export default Configurator;
