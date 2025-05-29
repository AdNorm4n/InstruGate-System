import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import "../styles/Configurator.css";
import Navbar from "../components/Navbar";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function Configurator({ navigateWithLoading }) {
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [instrument, setInstrument] = useState(
    state?.configData
      ? {
          ...state.configData,
          image: state?.instrument?.image || state.configData.image,
        }
      : state?.instrument || null
  );
  const [fields, setFields] = useState(state?.configData?.fields || []);
  const [addons, setAddons] = useState([]);
  const [selections, setSelections] = useState({});
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [showAddOns, setShowAddOns] = useState(false);
  const [codeSegments, setCodeSegments] = useState([]);
  const [loading, setLoading] = useState(!state?.configData);
  const [userRole, setUserRole] = useState(state?.userRole || null);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [isClicked, setIsClicked] = useState(null);

  const wrappedNavigate = navigateWithLoading
    ? navigateWithLoading(navigate)
    : navigate;

  const baseUrl = "http://127.0.0.1:8000";
  const imageUrl = instrument?.image
    ? new URL(instrument.image, baseUrl).href
    : null;

  console.log(
    "Instrument:",
    instrument?.name,
    "Image path:",
    instrument?.image,
    "Full URL:",
    imageUrl
  );

  useEffect(() => {
    console.log(state.configData);
    if (!state?.configData || !state?.userRole) {
      const fetchData = async () => {
        try {
          const requests = [];
          if (!state?.userRole) requests.push(api.get("/api/users/me/"));
          if (!state?.configData)
            requests.push(api.get(`/api/instruments/${instrumentId}/config/`));

          const responses = await Promise.all(requests);
          console.log(responses);
          let userRes, instrumentRes;

          if (!state?.userRole && !state?.configData) {
            [userRes, instrumentRes] = responses;
            setUserRole(userRes.data.role);
            setInstrument({
              ...instrumentRes.data,
              image: state?.instrument?.image || instrumentRes.data.image,
            });
            setFields(instrumentRes.data.fields || []);
          } else if (!state?.userRole) {
            [userRes] = responses;
            setUserRole(userRes.data.role);
          } else if (!state?.configData) {
            [instrumentRes] = responses;
            setInstrument({
              ...instrumentRes.data,
              image: state?.instrument?.image || instrumentRes.data.image,
            });
            setFields(instrumentRes.data.fields || []);
          }

          console.log("Instrument API response:", instrumentRes?.data);
        } catch (err) {
          console.error("Failed to load configurator:", err);
          alert("Failed to load configurator");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [instrumentId, state]);

  useEffect(() => {
    if (showAddOns) {
      setAddons(state?.configData?.addons);
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
    console.log("Fields for rendering:", fields);
    const codes = fields.filter(shouldShowField).map((f) => {
      const selected = selections[f.id];
      return selected ? `[${selected.code}]` : "[]";
    });
    const addonCodes = selectedAddOns.map((a) => a.code).join("");
    if (addonCodes) codes.push(`[${addonCodes}]`);
    console.log("Updated codeSegments:", codes);
    setCodeSegments(codes);
  }, [fields, selections, selectedAddOns]);

  const handleImageClick = () => {
    if (imageUrl) {
      setIsImageEnlarged(true);
    }
  };

  const handleCloseOverlay = () => {
    setIsImageEnlarged(false);
  };

  const handleClick = (action, path = null, state = null) => {
    setIsClicked(action);
    console.log("handleClick called:", { action, path, state });
    setTimeout(() => {
      try {
        if (path) {
          console.log("Navigating to:", path, "with state:", state);
          wrappedNavigate(path, { state });
        } else {
          console.log("Showing add-ons");
          setShowAddOns(true);
        }
      } catch (err) {
        console.error("Navigation error:", err);
        alert("Failed to navigate to review page");
      }
    }, 100);
  };

  // Group add-ons by addon_type.name
  const groupedAddons = addons.reduce((acc, addon) => {
    const typeName = addon.addon_type.name;
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(addon);
    return acc;
  }, {});

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
          Loading configurator...
        </Typography>
      </Box>
    );
  }

  if (!instrument) {
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
          Failed to load configurator. Please try again later.
        </Typography>
      </Box>
    );
  }

  return (
    <Fade in timeout={500}>
      <Box
        className="configurator-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />

        <main style={{ flex: 1 }}>
          <Container sx={{ py: 4, mt: 12 }}>
            <Box className="configurator-header">
              <Typography
                variant="h5"
                align="center"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif",
                  letterSpacing: 0,
                  textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
                }}
              >
                {instrument.name} Configurator
              </Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={instrument.name}
                  className="instrument-image"
                  onClick={handleImageClick}
                  onError={(e) => {
                    console.log("Image load error:", imageUrl);
                    e.target.style.display = "none";
                    e.target.nextSibling.style.display = "flex";
                  }}
                  style={{ cursor: "pointer" }}
                />
              ) : null}
              <Box
                className="image-fallback"
                sx={{
                  width: 150,
                  height: 150,
                  bgcolor: "#e0e0e0",
                  borderRadius: 2,
                  display: imageUrl ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Typography variant="body2" color="text.secondary">
                  No Image
                </Typography>
              </Box>
            </Box>
            <Typography
              className="description"
              variant="body1"
              align="center"
              sx={{ fontFamily: "Helvetica, sans-serif", mb: 3 }}
            >
              {instrument.description}
            </Typography>
            <Typography
              className="product-code"
              variant="body1"
              align="center"
              sx={{
                fontWeight: "bold",
                fontFamily: "Helvetica, sans-serif",
                textTransform: "uppercase",
                letterSpacing: 0,
              }}
            >
              Product Code: {codeSegments.join("")}
            </Typography>

            {isImageEnlarged && (
              <Box className="image-overlay" onClick={handleCloseOverlay}>
                <Box className="enlarged-image-container">
                  <img
                    src={imageUrl}
                    alt={instrument.name}
                    className="enlarged-image"
                  />
                  <button className="close-button" onClick={handleCloseOverlay}>
                    ×
                  </button>
                </Box>
              </Box>
            )}

            {!showAddOns ? (
              <Box
                className={`config-form ${
                  isClicked === "showAddOns" ? "config-form-clicked" : ""
                }`}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 3,
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif",
                    textTransform: "uppercase",
                    color: "#333",
                    position: "relative",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: "-8px",
                      left: 0,
                      width: "50px",
                      height: "3px",
                      backgroundColor: "#0a5",
                    },
                  }}
                >
                  configure requirements
                </Typography>
                {fields.length === 0 ? (
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 4,
                      fontFamily: "Helvetica, sans-serif",
                      color: "text.secondary",
                    }}
                  >
                    No configuration fields available for this instrument.
                  </Typography>
                ) : (
                  <Box className="fields-list">
                    {fields
                      .filter(shouldShowField)
                      .sort((a, b) => a.order - b.order)
                      .map((field) => (
                        <Box
                          key={field.id}
                          className="field-item"
                          sx={{
                            p: 2,
                            mb: 2,
                            borderRadius: 2,
                            border: "1px solid #e0e0e0",
                            backgroundColor: "white",
                            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                            transition:
                              "transform 0.2s ease, box-shadow 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                            },
                          }}
                        >
                          <FormControl fullWidth>
                            <InputLabel
                              sx={{
                                fontFamily: "Helvetica, sans-serif",
                                fontWeight: "bold",
                                color: "#333",
                              }}
                            >
                              {field.name}
                            </InputLabel>
                            <Select
                              value={selections[field.id]?.id || ""}
                              label={field.name}
                              onChange={(e) => {
                                console.log("Selected value:", e.target.value);
                                console.log("Options:", field.options);
                                const opt = field.options.find(
                                  (o) =>
                                    o.id.toString() ===
                                    e.target.value.toString()
                                );
                                console.log("Selected option:", opt);
                                handleSelect(field.id, opt);
                              }}
                              sx={{
                                fontFamily: "Helvetica, sans-serif",
                                backgroundColor: "white",
                                borderRadius: 2,
                                "& .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#2c3e50",
                                },
                                "&:hover .MuiOutlinedInput-notchedOutline": {
                                  borderColor: "#0a5",
                                },
                                "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                  {
                                    borderColor: "#0a5",
                                    borderWidth: "2px",
                                  },
                              }}
                            >
                              <MenuItem
                                value=""
                                sx={{ fontFamily: "Helvetica, sans-serif" }}
                              >
                                -- Select --
                              </MenuItem>
                              {field.options.map((opt) => (
                                <MenuItem
                                  key={opt.id}
                                  value={opt.id}
                                  sx={{ fontFamily: "Helvetica, sans-serif" }}
                                >
                                  <span
                                    style={{
                                      fontWeight: "bold",
                                      color: "#0a5",
                                    }}
                                  >
                                    [{opt.code}]
                                  </span>{" "}
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Box>
                      ))}
                  </Box>
                )}
                <Button
                  className="next-button"
                  variant="contained"
                  onClick={() => handleClick("showAddOns")}
                  disabled={isClicked === "showAddOns"}
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    "&.Mui-disabled": { opacity: 0.6 },
                  }}
                >
                  {isClicked === "showAddOns" ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Next"
                  )}
                </Button>
              </Box>
            ) : (
              <Box
                className={`addons-section ${
                  isClicked === "review" ? "addons-section-clicked" : ""
                }`}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    mb: 3,
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif",
                    textTransform: "uppercase",
                    color: "#333",
                    position: "relative",
                    "&:after": {
                      content: '""',
                      position: "absolute",
                      bottom: "-8px",
                      left: 0,
                      width: "50px",
                      height: "3px",
                      backgroundColor: "#0a5",
                    },
                  }}
                >
                  optional add-ons
                </Typography>
                {Object.keys(groupedAddons).length > 0 ? (
                  <Box className="addons-list">
                    {Object.keys(groupedAddons)
                      .sort()
                      .map((typeName) => (
                        <Box key={typeName} className="addon-type-group">
                          <Typography
                            variant="subtitle1"
                            className="addon-type-heading"
                            sx={{
                              mb: 2,
                              fontFamily: "Helvetica, sans-serif",
                              fontWeight: "bold",
                              textTransform: "uppercase",
                              color: "#2c3e50",
                            }}
                          >
                            {typeName}
                          </Typography>
                          <Box className="addon-type-items">
                            {groupedAddons[typeName].map((addon) => (
                              <Box
                                key={addon.id}
                                className="addon-item"
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  p: 2,
                                  mb: 2,
                                  borderRadius: 2,
                                  border: "1px solid #e0e0e0",
                                  backgroundColor: "white",
                                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                                  transition:
                                    "transform 0.2s ease, box-shadow 0.2s ease",
                                  "&:hover": {
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                                  },
                                }}
                              >
                                <Checkbox
                                  checked={selectedAddOns.includes(addon)}
                                  onChange={() => handleAddOnToggle(addon)}
                                  sx={{
                                    color: "#2c3e50",
                                    "&.Mui-checked": {
                                      color: "#0a5",
                                    },
                                  }}
                                />
                                <Box sx={{ ml: 2, flex: 1 }}>
                                  <Typography
                                    variant="body1"
                                    sx={{ fontFamily: "Helvetica, sans-serif" }}
                                  >
                                    <span
                                      style={{
                                        fontWeight: "bold",
                                        color: "#0a5",
                                      }}
                                    >
                                      [{addon.code}]
                                    </span>{" "}
                                    {addon.label}
                                  </Typography>
                                </Box>
                              </Box>
                            ))}
                          </Box>
                        </Box>
                      ))}
                  </Box>
                ) : (
                  <Typography
                    variant="body1"
                    sx={{
                      mb: 4,
                      fontFamily: "Helvetica, sans-serif",
                      color: "text.secondary",
                    }}
                  >
                    No add-ons available for this instrument.
                  </Typography>
                )}
                <Button
                  className="next-button"
                  variant="contained"
                  onClick={() =>
                    handleClick(
                      "review",
                      `/instruments/${instrumentId}/review`,
                      {
                        instrument,
                        selections,
                        selectedAddOns,
                        productCode: codeSegments.join(""),
                      }
                    )
                  }
                  disabled={isClicked === "review"}
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    "&.Mui-disabled": { opacity: 0.6 },
                  }}
                >
                  {isClicked === "review" ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Next - Review"
                  )}
                </Button>
              </Box>
            )}
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default Configurator;
