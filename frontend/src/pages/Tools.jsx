import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Fade,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Grid,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import "../styles/Tools.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ToolButton = styled(Button)(({ theme, active }) => ({
  fontFamily: "Helvetica, sans-serif !important",
  fontWeight: 600,
  textTransform: "uppercase",
  padding: theme.spacing(1, 3),
  margin: theme.spacing(0, 1),
  borderRadius: "8px",
  border: `2px solid ${active ? "#d6393a" : "#e0e0e0"}`,
  backgroundColor: active ? "#d6393a" : "#ffffff",
  color: active ? "#ffffff" : "#000000",
  "&:hover": {
    backgroundColor: active ? "#b53031" : "#f5f5f5",
    borderColor: active ? "#b53031" : "#d6393a",
    transform: "scale(1.05)",
  },
  transition: "all 0.3s ease",
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#d4a017",
  color: "#ffffff",
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif !important",
  "&:hover": {
    backgroundColor: "#b8860b",
    transform: "scale(1.05)",
  },
  "&:focus": {
    outline: "3px solid #d4a017",
    outlineOffset: "2px",
  },
  transition: "all 0.3s ease",
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

const StyledTextField = styled(TextField)(({ theme }) => ({
  "& .MuiInputBase-root": {
    fontFamily: "Helvetica, sans-serif !important",
    fontSize: "0.9rem",
    height: "48px",
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Helvetica, sans-serif !important",
    fontSize: "0.9rem",
    transform: "translate(14px, 14px) scale(1)",
    "&.MuiInputLabel-shrink": {
      transform: "translate(14px, -6px) scale(0.75)",
    },
  },
  "& .MuiOutlinedInput-root": {
    borderRadius: "8px",
    "&:hover fieldset": {
      borderColor: "#d6393a",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#d4a017",
    },
  },
  "& .MuiSelect-select": {
    padding: "12px 14px",
  },
  "&.material-selection-field": {
    minWidth: "200px",
  },
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

function Tools() {
  const [activeTool, setActiveTool] = useState("unitConverter");
  // Unit Converter state
  const [converterValue, setConverterValue] = useState("");
  const [fromUnit, setFromUnit] = useState("psi");
  const [toUnit, setToUnit] = useState("bar");
  const [converterResult, setConverterResult] = useState(null);
  // Wake Frequency state
  const [pipeDiameter, setPipeDiameter] = useState("");
  const [flowVelocity, setFlowVelocity] = useState("");
  const [fluidDensity, setFluidDensity] = useState("");
  const [thermowellDiameter, setThermowellDiameter] = useState("");
  const [thermowellLength, setThermowellLength] = useState("");
  const [wakeUnitSystem, setWakeUnitSystem] = useState("metric");
  const [wakeResult, setWakeResult] = useState(null);
  // Material Selection state
  const [chemical, setChemical] = useState("");
  const [concentration, setConcentration] = useState("100");
  const [materialResult, setMaterialResult] = useState(null);
  // Pipe Sizing state
  const [flowRate, setFlowRate] = useState("");
  const [pipeVelocity, setPipeVelocity] = useState("");
  const [pressureDrop, setPressureDrop] = useState("");
  const [pipeLength, setPipeLength] = useState("");
  const [fluidType, setFluidType] = useState("Water");
  const [pipeUnitSystem, setPipeUnitSystem] = useState("metric");
  const [pipeResult, setPipeResult] = useState(null);

  const handleUnitConvert = () => {
    if (!converterValue || isNaN(converterValue)) {
      setConverterResult({ error: "Please enter a valid number." });
      return;
    }
    const value = parseFloat(converterValue);
    let converted;

    const conversions = {
      pressure: {
        psi: { bar: 0.0689476, kPa: 6.89476, MPa: 0.00689476, atm: 0.068046 },
        bar: { psi: 14.5038, kPa: 100, MPa: 0.1, atm: 0.986923 },
        kPa: { psi: 0.145038, bar: 0.01, MPa: 0.001, atm: 0.00986923 },
        MPa: { psi: 145.038, bar: 10, kPa: 1000, atm: 9.86923 },
        atm: { psi: 14.6959, bar: 1.01325, kPa: 101.325, MPa: 0.101325 },
      },
      temperature: {
        C: { F: (v) => (v * 9) / 5 + 32, K: (v) => v + 273.15 },
        F: {
          C: (v) => ((v - 32) * 5) / 9,
          K: (v) => ((v - 32) * 5) / 9 + 273.15,
        },
        K: { C: (v) => v - 273.15, F: (v) => ((v - 273.15) * 9) / 5 + 32 },
      },
      flow: {
        "m3/h": { "L/min": 16.6667, GPM: 4.40287 },
        "L/min": { "m3/h": 0.06, GPM: 0.264172 },
        GPM: { "m3/h": 0.227125, "L/min": 3.78541 },
      },
    };

    const unitType = ["psi", "bar", "kPa", "MPa", "atm"].includes(fromUnit)
      ? "pressure"
      : ["C", "F", "K"].includes(fromUnit)
      ? "temperature"
      : "flow";

    if (fromUnit === toUnit) {
      converted = value;
    } else if (unitType === "temperature") {
      converted = conversions.temperature[fromUnit][toUnit](value);
    } else {
      converted = value * conversions[unitType][fromUnit][toUnit];
    }

    setConverterResult(converted ? converted.toFixed(4) : null);
  };

  const handleWakeCalculate = () => {
    if (
      !pipeDiameter ||
      !flowVelocity ||
      !fluidDensity ||
      !thermowellDiameter ||
      !thermowellLength
    ) {
      setWakeResult({ error: "All fields are required." });
      return;
    }
    const D =
      parseFloat(thermowellDiameter) /
      (wakeUnitSystem === "metric" ? 1000 : 12); // m or ft
    const L =
      parseFloat(thermowellLength) / (wakeUnitSystem === "metric" ? 1000 : 12); // m or ft
    const v = parseFloat(flowVelocity); // m/s or ft/s
    const rho = parseFloat(fluidDensity); // kg/m³ or lb/ft³
    const St = 0.21; // Adjusted Strouhal number
    const f = (St * v) / D; // Wake frequency (Hz)
    const naturalFreq =
      (1.875 ** 2 / (2 * Math.PI)) * Math.sqrt(2e11 / (rho * L ** 4)); // Simplified natural frequency
    const safeThreshold = naturalFreq * 0.8; // 80% of natural frequency
    setWakeResult({
      frequency: f.toFixed(2),
      naturalFrequency: naturalFreq.toFixed(2),
      isSafe: f < safeThreshold,
      unit: "Hz",
    });
  };

  const materialCompatibility = {
    "Acetic Acid": {
      10: {
        "316 SS": "Good",
        "Hastelloy C": "Excellent",
        Monel: "Poor",
        Titanium: "Excellent",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Excellent",
      },
      50: {
        "316 SS": "Poor",
        "Hastelloy C": "Good",
        Monel: "Not Recommended",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Poor",
        PVDF: "Good",
      },
      100: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Good",
        Monel: "Not Recommended",
        Titanium: "Poor",
        PTFE: "Excellent",
        Inconel: "Not Recommended",
        PVDF: "Poor",
      },
    },
    Ammonia: {
      10: {
        "316 SS": "Excellent",
        "Hastelloy C": "Good",
        Monel: "Good",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Excellent",
        PVDF: "Good",
      },
      50: {
        "316 SS": "Good",
        "Hastelloy C": "Good",
        Monel: "Good",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Good",
      },
      100: {
        "316 SS": "Good",
        "Hastelloy C": "Good",
        Monel: "Excellent",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Good",
      },
    },
    "Sulfuric Acid": {
      10: {
        "316 SS": "Good",
        "Hastelloy C": "Excellent",
        Monel: "Good",
        Titanium: "Poor",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Good",
      },
      50: {
        "316 SS": "Poor",
        "Hastelloy C": "Good",
        Monel: "Poor",
        Titanium: "Not Recommended",
        PTFE: "Excellent",
        Inconel: "Poor",
        PVDF: "Poor",
      },
      100: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Poor",
        Monel: "Not Recommended",
        Titanium: "Not Recommended",
        PTFE: "Good",
        Inconel: "Not Recommended",
        PVDF: "Not Recommended",
      },
    },
    "Hydrochloric Acid": {
      10: {
        "316 SS": "Poor",
        "Hastelloy C": "Excellent",
        Monel: "Good",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Excellent",
      },
      50: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Good",
        Monel: "Poor",
        Titanium: "Poor",
        PTFE: "Excellent",
        Inconel: "Poor",
        PVDF: "Good",
      },
      100: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Poor",
        Monel: "Not Recommended",
        Titanium: "Not Recommended",
        PTFE: "Good",
        Inconel: "Not Recommended",
        PVDF: "Poor",
      },
    },
    "Sodium Hydroxide": {
      10: {
        "316 SS": "Good",
        "Hastelloy C": "Good",
        Monel: "Excellent",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Excellent",
        PVDF: "Good",
      },
      50: {
        "316 SS": "Good",
        "Hastelloy C": "Good",
        Monel: "Good",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Good",
      },
      100: {
        "316 SS": "Poor",
        "Hastelloy C": "Good",
        Monel: "Good",
        Titanium: "Poor",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Poor",
      },
    },
    "Nitric Acid": {
      10: {
        "316 SS": "Good",
        "Hastelloy C": "Good",
        Monel: "Poor",
        Titanium: "Excellent",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Good",
      },
      50: {
        "316 SS": "Poor",
        "Hastelloy C": "Good",
        Monel: "Not Recommended",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Poor",
        PVDF: "Poor",
      },
      100: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Poor",
        Monel: "Not Recommended",
        Titanium: "Poor",
        PTFE: "Good",
        Inconel: "Not Recommended",
        PVDF: "Not Recommended",
      },
    },
    "Phosphoric Acid": {
      10: {
        "316 SS": "Good",
        "Hastelloy C": "Excellent",
        Monel: "Good",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Excellent",
      },
      50: {
        "316 SS": "Good",
        "Hastelloy C": "Good",
        Monel: "Poor",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Good",
      },
      100: {
        "316 SS": "Poor",
        "Hastelloy C": "Good",
        Monel: "Not Recommended",
        Titanium: "Poor",
        PTFE: "Excellent",
        Inconel: "Poor",
        PVDF: "Poor",
      },
    },
    Chlorine: {
      10: {
        "316 SS": "Poor",
        "Hastelloy C": "Excellent",
        Monel: "Good",
        Titanium: "Excellent",
        PTFE: "Excellent",
        Inconel: "Good",
        PVDF: "Good",
      },
      50: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Good",
        Monel: "Poor",
        Titanium: "Good",
        PTFE: "Excellent",
        Inconel: "Poor",
        PVDF: "Poor",
      },
      100: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Poor",
        Monel: "Not Recommended",
        Titanium: "Poor",
        PTFE: "Good",
        Inconel: "Not Recommended",
        PVDF: "Not Recommended",
      },
    },
  };

  const handleMaterialSelect = () => {
    if (!chemical || !concentration) {
      setMaterialResult({ error: "Chemical and concentration are required." });
      return;
    }
    const compat = materialCompatibility[chemical]?.[concentration];
    if (!compat) {
      setMaterialResult({
        error: "No data available for this chemical/concentration.",
      });
      return;
    }
    setMaterialResult({ compatibility: compat });
  };

  const handleMaterialReset = () => {
    setChemical("");
    setConcentration("100");
    setMaterialResult(null);
  };

  const handlePipeSizeCalculate = () => {
    if (
      !flowRate ||
      !pipeVelocity ||
      !pressureDrop ||
      !pipeLength ||
      !fluidType ||
      parseFloat(flowRate) <= 0 ||
      parseFloat(pipeVelocity) <= 0 ||
      parseFloat(pressureDrop) <= 0 ||
      parseFloat(pipeLength) <= 0
    ) {
      setPipeResult({
        error: "All fields are required and must be positive numbers.",
      });
      return;
    }
    const Q = parseFloat(flowRate); // m³/h or GPM
    const v = parseFloat(pipeVelocity); // m/s or ft/s
    const deltaP = parseFloat(pressureDrop); // bar or psi
    const L = parseFloat(pipeLength); // m or ft
    const isMetric = pipeUnitSystem === "metric";
    const fluidDensities = {
      Water: isMetric ? 1000 : 62.4, // kg/m³ or lb/ft³
      Oil: isMetric ? 850 : 53.0,
      Air: isMetric ? 1.225 : 0.0765,
    };
    const rho = fluidDensities[fluidType];
    const Q_m3s = isMetric ? Q / 3600 : Q * 0.0000630902; // Convert to m³/s
    const v_ms = isMetric ? v : v * 0.3048; // Convert to m/s
    const deltaP_Pa = isMetric ? deltaP * 100000 : deltaP * 6894.76; // Convert to Pa
    const L_m = isMetric ? L : L * 0.3048; // Convert to m
    const D = Math.sqrt((4 * Q_m3s) / (Math.PI * v_ms)) * 1000; // Diameter in mm
    const f = 0.02; // Friction factor approximation
    const deltaP_calc = (f * L_m * rho * v_ms ** 2) / (2 * (D / 1000)) / 100000; // bar
    const schedule =
      D <= 50 ? "Schedule 40" : D <= 100 ? "Schedule 80" : "Custom";
    setPipeResult({
      diameter: D.toFixed(2),
      pressureDrop: deltaP_calc.toFixed(4),
      unit: isMetric ? "mm" : "in",
      isFeasible: deltaP_calc <= (isMetric ? deltaP : deltaP / 14.5038),
      schedule,
      fluid: fluidType,
    });
  };

  const handlePipeReset = () => {
    setFlowRate("");
    setPipeVelocity("");
    setPressureDrop("");
    setPipeLength("");
    setFluidType("Water");
    setPipeUnitSystem("metric");
    setPipeResult(null);
  };

  const tools = [
    { id: "unitConverter", name: "Unit Converter" },
    { id: "wakeFrequency", name: "Wake Frequency Calculator" },
    { id: "materialSelection", name: "Material Selection Guide" },
    { id: "pipeSizing", name: "Pipe Sizing Calculator" },
  ];

  return (
    <Fade in timeout={800}>
      <Box
        className="tools-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          backgroundColor: "#f8f9fa",
          fontFamily: "Helvetica, sans-serif !important",
        }}
      >
        <Navbar userRole={null} />
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <Container maxWidth="lg" sx={{ py: 6, mt: 8 }}>
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{
                fontFamily: "Helvetica, sans-serif !important",
                fontWeight: "bold",
                textTransform: "uppercase",
                color: "#000000",
                mb: 4,
                fontSize: { xs: "1.5rem", md: "2rem" },
              }}
            >
              Instrumentation Engineering Tools
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
              Precision tools for pressure, temperature, and flow calculations
              tailored for instrumentation systems.
            </Typography>

            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                mb: 6,
                flexWrap: "wrap",
              }}
            >
              {tools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  active={activeTool === tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  aria-label={tool.name}
                >
                  {tool.name}
                </ToolButton>
              ))}
            </Box>

            <ToolCard>
              {activeTool === "unitConverter" && (
                <Box className="tool-container">
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      fontWeight: "bold",
                      mb: 3,
                      color: "#000000",
                      textTransform: "uppercase",
                      fontSize: "1.25rem",
                    }}
                  >
                    Unit Converter
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={4}>
                      <StyledTextField
                        type="number"
                        label="Value"
                        value={converterValue}
                        onChange={(e) => setConverterValue(e.target.value)}
                        placeholder="Enter value"
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <StyledTextField
                        select
                        label="From Unit"
                        value={fromUnit}
                        onChange={(e) => setFromUnit(e.target.value)}
                        fullWidth
                        margin="normal"
                      >
                        <MenuItem value="psi">PSI</MenuItem>
                        <MenuItem value="bar">Bar</MenuItem>
                        <MenuItem value="kPa">kPa</MenuItem>
                        <MenuItem value="MPa">MPa</MenuItem>
                        <MenuItem value="atm">Atm</MenuItem>
                        <MenuItem value="C">°C</MenuItem>
                        <MenuItem value="F">°F</MenuItem>
                        <MenuItem value="K">K</MenuItem>
                        <MenuItem value="m3/h">m³/h</MenuItem>
                        <MenuItem value="L/min">L/min</MenuItem>
                        <MenuItem value="GPM">GPM</MenuItem>
                      </StyledTextField>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <StyledTextField
                        select
                        label="To Unit"
                        value={toUnit}
                        onChange={(e) => setToUnit(e.target.value)}
                        fullWidth
                        margin="normal"
                      >
                        <MenuItem value="psi">PSI</MenuItem>
                        <MenuItem value="bar">Bar</MenuItem>
                        <MenuItem value="kPa">kPa</MenuItem>
                        <MenuItem value="MPa">MPa</MenuItem>
                        <MenuItem value="atm">Atm</MenuItem>
                        <MenuItem value="C">°C</MenuItem>
                        <MenuItem value="F">°F</MenuItem>
                        <MenuItem value="K">K</MenuItem>
                        <MenuItem value="m3/h">m³/h</MenuItem>
                        <MenuItem value="L/min">L/min</MenuItem>
                        <MenuItem value="GPM">GPM</MenuItem>
                      </StyledTextField>
                    </Grid>
                  </Grid>
                  <CTAButton
                    variant="contained"
                    onClick={handleUnitConvert}
                    sx={{ mt: 3, mr: 2 }}
                    aria-label="Convert Units"
                  >
                    Convert
                  </CTAButton>
                  <ResetButton
                    variant="contained"
                    onClick={() => {
                      setConverterValue("");
                      setFromUnit("psi");
                      setToUnit("bar");
                      setConverterResult(null);
                    }}
                    sx={{ mt: 3 }}
                    aria-label="Reset"
                  >
                    Reset
                  </ResetButton>
                  {converterResult && (
                    <Typography
                      sx={{
                        mt: 3,
                        fontFamily: "Helvetica, sans-serif !important",
                        fontWeight: "bold",
                        color: "#333",
                        fontSize: "0.9rem",
                      }}
                    >
                      {converterResult.error
                        ? converterResult.error
                        : `${converterValue} ${fromUnit} = ${converterResult} ${toUnit}`}
                    </Typography>
                  )}
                </Box>
              )}
              {activeTool === "wakeFrequency" && (
                <Box className="tool-container">
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      fontWeight: "bold",
                      mb: 3,
                      color: "#000000",
                      textTransform: "uppercase",
                      fontSize: "1.25rem",
                    }}
                  >
                    Wake Frequency Calculator
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        select
                        label="Unit System"
                        value={wakeUnitSystem}
                        onChange={(e) => setWakeUnitSystem(e.target.value)}
                        fullWidth
                        margin="normal"
                      >
                        <MenuItem value="metric">
                          Metric (mm, m/s, kg/m³)
                        </MenuItem>
                        <MenuItem value="imperial">
                          Imperial (in, ft/s, lb/ft³)
                        </MenuItem>
                      </StyledTextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          wakeUnitSystem === "metric"
                            ? "Pipe Diameter (mm)"
                            : "Pipe Diameter (in)"
                        }
                        value={pipeDiameter}
                        onChange={(e) => setPipeDiameter(e.target.value)}
                        placeholder="Enter pipe diameter"
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          wakeUnitSystem === "metric"
                            ? "Flow Velocity (m/s)"
                            : "Flow Velocity (ft/s)"
                        }
                        value={flowVelocity}
                        onChange={(e) => setFlowVelocity(e.target.value)}
                        placeholder="Enter flow velocity"
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          wakeUnitSystem === "metric"
                            ? "Fluid Density (kg/m³)"
                            : "Fluid Density (lb/ft³)"
                        }
                        value={fluidDensity}
                        onChange={(e) => setFluidDensity(e.target.value)}
                        placeholder="Enter fluid density"
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          wakeUnitSystem === "metric"
                            ? "Thermowell Diameter (mm)"
                            : "Thermowell Diameter (in)"
                        }
                        value={thermowellDiameter}
                        onChange={(e) => setThermowellDiameter(e.target.value)}
                        placeholder="Enter thermowell diameter"
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          wakeUnitSystem === "metric"
                            ? "Thermowell Length (mm)"
                            : "Thermowell Length (in)"
                        }
                        value={thermowellLength}
                        onChange={(e) => setThermowellLength(e.target.value)}
                        placeholder="Enter thermowell length"
                        fullWidth
                        margin="normal"
                      />
                    </Grid>
                  </Grid>
                  <CTAButton
                    variant="contained"
                    onClick={handleWakeCalculate}
                    sx={{ mt: 3, mr: 2 }}
                    aria-label="Calculate Wake Frequency"
                  >
                    Calculate
                  </CTAButton>
                  <ResetButton
                    variant="contained"
                    onClick={() => {
                      setPipeDiameter("");
                      setFlowVelocity("");
                      setFluidDensity("");
                      setThermowellDiameter("");
                      setThermowellLength("");
                      setWakeUnitSystem("metric");
                      setWakeResult(null);
                    }}
                    sx={{ mt: 3 }}
                    aria-label="Reset"
                  >
                    Reset
                  </ResetButton>
                  {wakeResult && (
                    <Box sx={{ mt: 3 }}>
                      {wakeResult.error ? (
                        <Typography
                          color="error"
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                            fontSize: "0.9rem",
                          }}
                        >
                          {wakeResult.error}
                        </Typography>
                      ) : (
                        <Typography
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                            fontWeight: "bold",
                            color: "#333",
                            fontSize: "0.9rem",
                          }}
                        >
                          Wake Frequency: {wakeResult.frequency}{" "}
                          {wakeResult.unit}
                          <br />
                          Natural Frequency: {wakeResult.naturalFrequency}{" "}
                          {wakeResult.unit}
                          <br />
                          Status:{" "}
                          {wakeResult.isSafe
                            ? "Safe"
                            : "Unsafe (frequency too high)"}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
              {activeTool === "materialSelection" && (
                <Box className="tool-container">
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      fontWeight: "bold",
                      mb: 3,
                      color: "#000000",
                      textTransform: "uppercase",
                      fontSize: "1.25rem",
                    }}
                  >
                    Material Selection Guide
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        select
                        label="Chemical"
                        value={chemical}
                        onChange={(e) => setChemical(e.target.value)}
                        fullWidth
                        margin="normal"
                        className="material-selection-field"
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: "200px !important",
                              fontFamily: "Helvetica, sans-serif !important",
                            },
                          },
                        }}
                      >
                        <MenuItem value="Acetic Acid">Acetic Acid</MenuItem>
                        <MenuItem value="Ammonia">Ammonia</MenuItem>
                        <MenuItem value="Sulfuric Acid">Sulfuric Acid</MenuItem>
                        <MenuItem value="Hydrochloric Acid">
                          Hydrochloric Acid
                        </MenuItem>
                        <MenuItem value="Sodium Hydroxide">
                          Sodium Hydroxide
                        </MenuItem>
                        <MenuItem value="Nitric Acid">Nitric Acid</MenuItem>
                        <MenuItem value="Phosphoric Acid">
                          Phosphoric Acid
                        </MenuItem>
                        <MenuItem value="Chlorine">Chlorine</MenuItem>
                      </StyledTextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        select
                        label="Concentration (%)"
                        value={concentration}
                        onChange={(e) => setConcentration(e.target.value)}
                        fullWidth
                        margin="normal"
                        className="material-selection-field"
                        MenuProps={{
                          PaperProps: {
                            sx: {
                              minWidth: "200px !important",
                              fontFamily: "Helvetica, sans-serif !important",
                            },
                          },
                        }}
                      >
                        <MenuItem value="10">10%</MenuItem>
                        <MenuItem value="50">50%</MenuItem>
                        <MenuItem value="100">100%</MenuItem>
                      </StyledTextField>
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3 }}>
                    <CTAButton
                      variant="contained"
                      onClick={handleMaterialSelect}
                      sx={{ mr: 2 }}
                      aria-label="Select Material"
                    >
                      Select
                    </CTAButton>
                    <ResetButton
                      variant="contained"
                      onClick={handleMaterialReset}
                      aria-label="Reset"
                    >
                      Reset
                    </ResetButton>
                  </Box>
                  {materialResult && (
                    <Box sx={{ mt: 3 }}>
                      {materialResult.error ? (
                        <Typography
                          color="error"
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                            fontSize: "0.9rem",
                          }}
                        >
                          {materialResult.error}
                        </Typography>
                      ) : (
                        <Table sx={{ border: "1px solid #e0e0e0" }}>
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                }}
                              >
                                Material
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                }}
                              >
                                Compatibility
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(materialResult.compatibility).map(
                              ([material, rating], index) => (
                                <TableRow
                                  key={material}
                                  sx={{
                                    backgroundColor:
                                      index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      fontFamily:
                                        "Helvetica, sans-serif !important",
                                      padding: "12px",
                                    }}
                                  >
                                    {material}
                                  </TableCell>
                                  <TableCell
                                    sx={{
                                      fontFamily:
                                        "Helvetica, sans-serif !important",
                                      padding: "12px",
                                    }}
                                  >
                                    {rating}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </Box>
                  )}
                  <Alert
                    severity="info"
                    sx={{
                      mt: 3,
                      fontFamily: "Helvetica, sans-serif !important",
                      fontSize: "0.85rem",
                      backgroundColor: "#e3f2fd",
                    }}
                  >
                    This guide is for general information only. Consult a
                    corrosion engineer for critical applications.
                  </Alert>
                </Box>
              )}
              {activeTool === "pipeSizing" && (
                <Box className="tool-container">
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: "Helvetica, sans-serif !important",
                      fontWeight: "bold",
                      mb: 3,
                      color: "#000000",
                      textTransform: "uppercase",
                      fontSize: "1.25rem",
                    }}
                  >
                    Pipe Sizing Calculator
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        select
                        label="Unit System"
                        value={pipeUnitSystem}
                        onChange={(e) => setPipeUnitSystem(e.target.value)}
                        fullWidth
                        margin="normal"
                      >
                        <MenuItem value="metric">
                          Metric (m³/h, m/s, bar, m)
                        </MenuItem>
                        <MenuItem value="imperial">
                          Imperial (GPM, ft/s, psi, ft)
                        </MenuItem>
                      </StyledTextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        select
                        label="Fluid Type"
                        value={fluidType}
                        onChange={(e) => setFluidType(e.target.value)}
                        fullWidth
                        margin="normal"
                      >
                        <MenuItem value="Water">Water</MenuItem>
                        <MenuItem value="Oil">Oil</MenuItem>
                        <MenuItem value="Air">Air</MenuItem>
                      </StyledTextField>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          pipeUnitSystem === "metric"
                            ? "Flow Rate (m³/h)"
                            : "Flow Rate (GPM)"
                        }
                        value={flowRate}
                        onChange={(e) => setFlowRate(e.target.value)}
                        placeholder="Enter flow rate"
                        fullWidth
                        margin="normal"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          pipeUnitSystem === "metric"
                            ? "Velocity (m/s)"
                            : "Velocity (ft/s)"
                        }
                        value={pipeVelocity}
                        onChange={(e) => setPipeVelocity(e.target.value)}
                        placeholder="Enter velocity"
                        fullWidth
                        margin="normal"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          pipeUnitSystem === "metric"
                            ? "Allowable Pressure Drop (bar)"
                            : "Allowable Pressure Drop (psi)"
                        }
                        value={pressureDrop}
                        onChange={(e) => setPressureDrop(e.target.value)}
                        placeholder="Enter pressure drop"
                        fullWidth
                        margin="normal"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <StyledTextField
                        type="number"
                        label={
                          pipeUnitSystem === "metric"
                            ? "Pipe Length (m)"
                            : "Pipe Length (ft)"
                        }
                        value={pipeLength}
                        onChange={(e) => setPipeLength(e.target.value)}
                        placeholder="Enter pipe length"
                        fullWidth
                        margin="normal"
                        inputProps={{ min: 0 }}
                      />
                    </Grid>
                  </Grid>
                  <Box sx={{ mt: 3 }}>
                    <CTAButton
                      variant="contained"
                      onClick={handlePipeSizeCalculate}
                      sx={{ mr: 2 }}
                      aria-label="Calculate Pipe Size"
                    >
                      Calculate
                    </CTAButton>
                    <ResetButton
                      variant="contained"
                      onClick={handlePipeReset}
                      aria-label="Reset"
                    >
                      Reset
                    </ResetButton>
                  </Box>
                  {pipeResult && (
                    <Box sx={{ mt: 3 }}>
                      {pipeResult.error ? (
                        <Typography
                          color="error"
                          sx={{
                            fontFamily: "Helvetica, sans-serif !important",
                            fontSize: "0.9rem",
                          }}
                        >
                          {pipeResult.error}
                        </Typography>
                      ) : (
                        <Table sx={{ border: "1px solid #e0e0e0" }}>
                          <TableHead>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                }}
                              >
                                Parameter
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  fontWeight: "bold",
                                }}
                              >
                                Value
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                Pipe Diameter
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                {pipeResult.diameter} {pipeResult.unit}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                Pressure Drop
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                {pipeResult.pressureDrop}{" "}
                                {pipeUnitSystem === "metric" ? "bar" : "psi"}
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                Fluid
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                {pipeResult.fluid}
                              </TableCell>
                            </TableRow>
                            <TableRow>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                Recommended Schedule
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                {pipeResult.schedule}
                              </TableCell>
                            </TableRow>
                            <TableRow sx={{ backgroundColor: "#f9f9f9" }}>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                Status
                              </TableCell>
                              <TableCell
                                sx={{
                                  fontFamily:
                                    "Helvetica, sans-serif !important",
                                  padding: "12px",
                                }}
                              >
                                {pipeResult.isFeasible
                                  ? "Feasible"
                                  : "Infeasible (pressure drop too high)"}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </ToolCard>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default Tools;
