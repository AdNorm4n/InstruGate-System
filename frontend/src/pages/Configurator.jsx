import React, { useEffect, useState, useContext } from "react";
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
  CircularProgress,
  Fade,
  Divider,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import api from "../api";
import "../styles/Configurator.css";
import { UserContext } from "../contexts/UserContext";

// Utility function to format price as RM10,000.00
const formatPrice = (price) => {
  if (price == null || isNaN(price)) return "RM0.00";
  return `RM${Number(price).toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ToolCard = styled(Box)(({ theme }) => ({
  padding: theme.spacing(4),
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Helvetica, sans-serif",
  [theme.breakpoints.down("sm")]: {
    padding: theme.spacing(2),
  },
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif",
  "&:hover": {
    backgroundColor: "#1565c0",
    transform: "scale(1.05)",
  },
  "&.Mui-disabled": {
    backgroundColor: "#e0e0e0",
    color: "#999",
  },
  transition: "all 0.3s ease",
  "& .MuiCircularProgress-root": {
    color: "#ffffff",
  },
}));

function Configurator({ navigateWithLoading }) {
  const { userRole } = useContext(UserContext);
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const [instrument, setInstrument] = useState(
    state?.instrument
      ? { ...state.instrument }
      : state?.configData
      ? {
          ...state.configData,
          image: state?.instrument?.image || state.configData.image,
        }
      : null
  );
  const [fields, setFields] = useState(state?.configData?.fields || []);
  const [addons, setAddons] = useState([]);
  const [selections, setSelections] = useState({});
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [showAddOns, setShowAddOns] = useState(false);
  const [codeSegments, setCodeSegments] = useState([]);
  const [loading, setLoading] = useState(!state?.configData);
  const [isImageEnlarged, setIsImageEnlarged] = useState(false);
  const [isClicked, setIsClicked] = useState(null);
  const [showError, setShowError] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);

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
    "Description:",
    instrument?.description,
    "Image path:",
    instrument?.image,
    "Full URL:",
    imageUrl
  );

  useEffect(() => {
    if (!state?.configData) {
      const fetchData = async () => {
        try {
          const instrumentRes = await api.get(
            `/api/instruments/${instrumentId}/config/`
          );

          setInstrument({
            ...instrumentRes.data,
            image: state?.instrument?.image || instrumentRes.data.image,
            description:
              state?.instrument?.description ||
              instrumentRes.data.description ||
              "No description available",
          });
          setFields(instrumentRes.data.fields || []);

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
      setAddons(state?.configData?.addons || []);
    }
  }, [showAddOns, state?.configData]);

  useEffect(() => {
    // Calculate total price whenever selections or add-ons change
    let price = parseFloat(instrument?.base_price || 0);
    Object.values(selections).forEach((opt) => {
      price += parseFloat(opt?.price || 0);
    });
    selectedAddOns.forEach((addon) => {
      price += parseFloat(addon?.price || 0);
    });
    setTotalPrice(price);
  }, [selections, selectedAddOns, instrument]);

  const handleSelect = (fieldId, option) => {
    if (option) {
      setSelections((prev) => {
        const newSelections = { ...prev, [fieldId]: option };
        console.log("Updated selections:", newSelections);
        return newSelections;
      });
      setShowError(false); // Reset error when a selection is made
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

  const allFieldsSelected = () => {
    const visibleFields = fields.filter(shouldShowField);
    return visibleFields.every((field) => selections[field.id]?.id);
  };

  const handleClick = (action, path = null, state = null) => {
    if (action === "showAddOns" && !allFieldsSelected()) {
      setShowError(true);
      return;
    }
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
          setShowError(false);
        }
      } catch (err) {
        console.error("Navigation error:", err);
        alert("Failed to navigate to review page");
      }
    }, 100);
  };

  const groupedAddons = addons.reduce((acc, addon) => {
    const typeName = addon.addon_type.name;
    if (!acc[typeName]) {
      acc[typeName] = [];
    }
    acc[typeName].push(addon);
    return acc;
  }, {});

  // Calculate price breakdown
  const priceBreakdown = [
    { label: "Base Price", value: parseFloat(instrument?.base_price || 0) },
    { label: "Selected Requirements:", value: null },
    ...fields
      .filter((field) => selections[field.id])
      .map((field) => {
        const opt = selections[field.id];
        return {
          label: `${field.name}: ${opt.label} (${opt.code})`,
          value: parseFloat(opt?.price || 0),
        };
      }),
    ...(selectedAddOns.length > 0
      ? [
          { label: "Selected Add-ons:", value: null },
          ...Object.entries(
            selectedAddOns.reduce((acc, addon) => {
              const typeName = addon.addon_type.name;
              if (!acc[typeName]) acc[typeName] = [];
              acc[typeName].push(addon);
              return acc;
            }, {})
          )
            .sort()
            .flatMap(([typeName, addons]) => [
              { label: `${typeName}:`, value: null },
              ...addons.map((addon) => ({
                label: `${addon.label} (${addon.code})`,
                value: parseFloat(addon?.price || 0),
              })),
            ]),
        ]
      : []),
  ];

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
          bgcolor: "#f8f9fa",
        }}
      >
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 0 }}>
            <Box
              sx={{
                bgcolor: "#ffffff",
                borderRadius: "12px",
                p: 4,
                mb: 4,
                textAlign: "center",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif",
                  color: "#000000",
                  mb: 4,
                  textTransform: "uppercase",
                  position: "relative",
                  "&:after": {
                    content: '""',
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "60px",
                    height: "3px",
                    bgcolor: "#d6393a",
                  },
                }}
              >
                {instrument.name}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
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
                  />
                ) : null}
                <Box
                  className="image-fallback"
                  sx={{
                    width: 350,
                    height: 350,
                    bgcolor: "#e0e0e0",
                    borderRadius: "12px",
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
                variant="subtitle1"
                sx={{
                  fontFamily: "Helvetica, sans-serif",
                  color: "#333",
                  mb: 2,
                  letterSpacing: "0.5px",
                }}
              >
                {instrument.description || "No description available"}
              </Typography>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: "bold",
                  fontFamily: "Helvetica, sans-serif",
                  color: "#0a5",
                  textTransform: "uppercase",
                }}
              >
                Product Code: {codeSegments.join("")}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: "bold",
                    fontFamily: "Helvetica, sans-serif",
                    color: "#000000",
                    textTransform: "uppercase",
                  }}
                >
                  Selection Summary
                </Typography>
                {priceBreakdown.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: "Helvetica, sans-serif",
                        color:
                          item.label === "Selected Requirements:" ||
                          item.label === "Selected Add-ons:" ||
                          item.label.endsWith(":")
                            ? "#000000"
                            : "#333",
                        fontWeight:
                          item.label === "Selected Requirements:" ||
                          item.label === "Selected Add-ons:" ||
                          item.label.endsWith(":")
                            ? "bold"
                            : "normal",
                      }}
                    >
                      {item.label}
                    </Typography>
                    {item.value !== null && (
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          fontWeight: "bold",
                          color: "#000000",
                        }}
                      >
                        {formatPrice(item.value)}
                      </Typography>
                    )}
                  </Box>
                ))}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Helvetica, sans-serif",
                      color: "#0a5",
                      textTransform: "uppercase",
                    }}
                  >
                    Total Price
                  </Typography>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      fontWeight: "bold",
                      fontFamily: "Helvetica, sans-serif",
                      color: "#0a5",
                      textTransform: "uppercase",
                    }}
                  >
                    {formatPrice(totalPrice)}
                  </Typography>
                </Box>
              </Box>
            </Box>

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

            <ToolCard>
              {!showAddOns ? (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 3,
                      fontWeight: "bold",
                      fontFamily: "Helvetica, sans-serif",
                      textTransform: "uppercase",
                      color: "#000000",
                      position: "relative",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: "-8px",
                        left: 0,
                        width: "50px",
                        height: "3px",
                        bgcolor: "#d6393a",
                      },
                    }}
                  >
                    Configure Requirements
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
                    <Box>
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "1fr 1fr",
                          },
                          gap: 2,
                        }}
                      >
                        {fields
                          .filter(shouldShowField)
                          .sort((a, b) => a.order - b.order)
                          .map((field) => (
                            <Box key={field.id} className="field-item">
                              <FormControl fullWidth>
                                <InputLabel
                                  sx={{
                                    fontFamily: "Helvetica, sans-serif",
                                    fontWeight: "bold",
                                    color: "#2c3e50",
                                    fontSize: "14px",
                                  }}
                                >
                                  {field.name}
                                </InputLabel>
                                <Select
                                  value={selections[field.id]?.id || ""}
                                  label={field.name}
                                  onChange={(e) => {
                                    console.log(
                                      "Selected value:",
                                      e.target.value
                                    );
                                    console.log("Options:", field.options);
                                    const opt = field.options.find(
                                      (o) =>
                                        o.id.toString() ===
                                        e.target.value.toString()
                                    );
                                    console.log("Selected option:", opt);
                                    handleSelect(field.id, opt);
                                  }}
                                  error={showError && !selections[field.id]?.id}
                                  sx={{
                                    fontFamily: "Helvetica, sans-serif",
                                    fontSize: "14px",
                                    bgcolor: "#ffffff",
                                    borderRadius: "8px",
                                    "& .MuiOutlinedInput-notchedOutline": {
                                      borderColor:
                                        showError && !selections[field.id]?.id
                                          ? "#d32f2f"
                                          : "#ccc",
                                    },
                                    "&:hover .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor:
                                          showError && !selections[field.id]?.id
                                            ? "#d32f2f"
                                            : "#d6393a",
                                      },
                                    "&.Mui-focused .MuiOutlinedInput-notchedOutline":
                                      {
                                        borderColor:
                                          showError && !selections[field.id]?.id
                                            ? "#d32f2f"
                                            : "#d6393a",
                                        borderWidth: "2px",
                                      },
                                  }}
                                >
                                  <MenuItem
                                    value=""
                                    sx={{
                                      fontFamily: "Helvetica, sans-serif",
                                      fontSize: "14px",
                                    }}
                                  >
                                    -- Select --
                                  </MenuItem>
                                  {field.options.map((opt) => (
                                    <MenuItem
                                      key={opt.id}
                                      value={opt.id}
                                      sx={{
                                        fontFamily: "Helvetica, sans-serif",
                                        fontSize: "14px",
                                      }}
                                    >
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 1,
                                        }}
                                      >
                                        <Box
                                          sx={{
                                            bgcolor: "#0a5",
                                            color: "#ffffff",
                                            px: 1,
                                            borderRadius: "4px",
                                            fontSize: "12px",
                                            fontWeight: "bold",
                                          }}
                                        >
                                          {opt.code}
                                        </Box>
                                        {opt.label} (
                                        {formatPrice(opt.price || 0)})
                                      </Box>
                                    </MenuItem>
                                  ))}
                                </Select>
                              </FormControl>
                            </Box>
                          ))}
                      </Box>
                      {showError && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: "#d32f2f",
                            fontFamily: "Helvetica, sans-serif",
                            mt: 2,
                            textAlign: "center",
                          }}
                        >
                          Please select all required fields
                        </Typography>
                      )}
                    </Box>
                  )}
                  <Box sx={{ textAlign: "center", mt: 4 }}>
                    <CTAButton
                      variant="contained"
                      onClick={() => handleClick("showAddOns")}
                      disabled={
                        isClicked === "showAddOns" ||
                        (fields.length > 0 && !allFieldsSelected())
                      }
                    >
                      {isClicked === "showAddOns" ? (
                        <CircularProgress size={20} />
                      ) : (
                        "Next: Add-ons"
                      )}
                    </CTAButton>
                  </Box>
                </Box>
              ) : (
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      mb: 4,
                      fontWeight: "bold",
                      fontFamily: "Helvetica, sans-serif",
                      textTransform: "uppercase",
                      color: "#000000",
                      position: "relative",
                      "&:after": {
                        content: '""',
                        position: "absolute",
                        bottom: "-8px",
                        left: 0,
                        width: "50px",
                        height: "3px",
                        bgcolor: "#d6393a",
                      },
                    }}
                  >
                    Optional Add-ons
                  </Typography>
                  {Object.keys(groupedAddons).length > 0 ? (
                    <Box>
                      {Object.keys(groupedAddons)
                        .sort()
                        .map((typeName, index) => (
                          <Box key={typeName}>
                            {index > 0 && <Divider sx={{ my: 2 }} />}
                            <Typography
                              variant="subtitle2"
                              sx={{
                                mb: 2,
                                fontFamily: "Helvetica, sans-serif",
                                fontWeight: "bold",
                                textTransform: "uppercase",
                                color: "#000000",
                                fontSize: "14px",
                              }}
                            >
                              {typeName}
                            </Typography>
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr",
                                  md: "1fr 1fr",
                                },
                                gap: 2,
                              }}
                            >
                              {groupedAddons[typeName].map((addon) => (
                                <Box
                                  key={addon.id}
                                  className="addon-item"
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    p: 2,
                                    bgcolor: "#ffffff",
                                    borderRadius: "8px",
                                    border: "1px solid #ccc",
                                    transition: "background-color 0.3s ease",
                                    "&:hover": {
                                      bgcolor: "#f8f9fa",
                                    },
                                  }}
                                >
                                  <Checkbox
                                    checked={selectedAddOns.includes(addon)}
                                    onChange={() => handleAddOnToggle(addon)}
                                    sx={{
                                      color: "#ccc",
                                      "&.Mui-checked": {
                                        color: "#d6393a",
                                      },
                                    }}
                                  />
                                  <Box sx={{ flex: 1 }}>
                                    <Typography
                                      variant="body2"
                                      sx={{
                                        fontFamily: "Helvetica, sans-serif",
                                        fontSize: "14px",
                                      }}
                                    >
                                      <Box
                                        component="span"
                                        sx={{
                                          bgcolor: "#0a5",
                                          color: "#ffffff",
                                          px: "8px",
                                          borderRadius: "4px",
                                          fontSize: "12px",
                                          fontWeight: "bold",
                                          mr: 1,
                                        }}
                                      >
                                        {addon.code}
                                      </Box>
                                      {addon.label} (
                                      {formatPrice(addon.price || 0)})
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
                      variant="body2"
                      sx={{
                        mb: 3,
                        fontFamily: "Helvetica, sans-serif",
                        fontSize: "14px",
                        color: "text.secondary",
                      }}
                    >
                      No add-ons available for this instrument.
                    </Typography>
                  )}
                  <Box sx={{ textAlign: "center", mt: 4 }}>
                    <CTAButton
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
                            totalPrice: totalPrice.toFixed(2),
                          }
                        )
                      }
                      disabled={isClicked === "review"}
                    >
                      {isClicked === "review" ? (
                        <CircularProgress size={20} />
                      ) : (
                        "Review Configuration"
                      )}
                    </CTAButton>
                  </Box>
                </Box>
              )}
            </ToolCard>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default Configurator;
