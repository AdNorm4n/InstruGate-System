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
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import "../styles/Tools.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const ToolButton = styled(Button)(({ theme, active }) => ({
  fontFamily: "Helvetica, sans-serif",
  fontWeight: "bold",
  textTransform: "uppercase",
  padding: "8px 16px",
  margin: "0 8px",
  borderRadius: "4px",
  border: `2px solid ${active ? "#d6393a" : "#e0e0e0"}`,
  backgroundColor: active ? "#d6393a" : "#fff",
  color: active ? "#fff" : "#000",
  "&:hover": {
    backgroundColor: active ? "#b53031" : "#f5f5f5",
    borderColor: active ? "#b53031" : "#d6393a",
  },
}));

const StyledTextField = styled(TextField)({
  "& .MuiInputBase-root": {
    fontFamily: "Helvetica, sans-serif",
  },
  "& .MuiInputLabel-root": {
    fontFamily: "Helvetica, sans-serif",
  },
});

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
  const [wakeUnitSystem, setWakeUnitSystem] = useState("metric");
  const [wakeResult, setWakeResult] = useState(null);
  // Material Selection state
  const [chemical, setChemical] = useState("");
  const [concentration, setConcentration] = useState("100");
  const [materialResult, setMaterialResult] = useState(null);

  const handleUnitConvert = () => {
    let converted;
    if (fromUnit === "psi" && toUnit === "bar") {
      converted = converterValue * 0.0689476;
    } else if (fromUnit === "bar" && toUnit === "psi") {
      converted = converterValue * 14.5038;
    } else {
      converted = converterValue; // Same unit
    }
    setConverterResult(converted ? converted.toFixed(4) : null);
  };

  const handleWakeCalculate = () => {
    if (
      !pipeDiameter ||
      !flowVelocity ||
      !fluidDensity ||
      !thermowellDiameter
    ) {
      setWakeResult({ error: "All fields are required." });
      return;
    }
    const D =
      parseFloat(thermowellDiameter) /
      (wakeUnitSystem === "metric" ? 1000 : 12); // m or ft
    const v = parseFloat(flowVelocity); // m/s or ft/s
    const rho = parseFloat(fluidDensity); // kg/m³ or lb/ft³
    const St = 0.2; // Strouhal number approximation
    const f = (St * v) / D; // Wake frequency (Hz)
    const safeThreshold = 100; // Simplified safe frequency (Hz)
    setWakeResult({
      frequency: f.toFixed(2),
      isSafe: f < safeThreshold,
      unit: "Hz",
    });
  };

  const materialCompatibility = {
    "Acetic Acid": {
      10: { "316 SS": "Good", "Hastelloy C": "Excellent", Monel: "Poor" },
      50: { "316 SS": "Poor", "Hastelloy C": "Good", Monel: "Not Recommended" },
      100: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Good",
        Monel: "Not Recommended",
      },
    },
    Ammonia: {
      10: { "316 SS": "Excellent", "Hastelloy C": "Good", Monel: "Good" },
      50: { "316 SS": "Good", "Hastelloy C": "Good", Monel: "Good" },
      100: { "316 SS": "Good", "Hastelloy C": "Good", Monel: "Excellent" },
    },
    "Sulfuric Acid": {
      10: { "316 SS": "Good", "Hastelloy C": "Excellent", Monel: "Good" },
      50: { "316 SS": "Poor", "Hastelloy C": "Good", Monel: "Poor" },
      100: {
        "316 SS": "Not Recommended",
        "Hastelloy C": "Poor",
        Monel: "Not Recommended",
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

  const tools = [
    { id: "unitConverter", name: "Unit Converter" },
    { id: "wakeFrequency", name: "Wake Frequency Calculator" },
    { id: "materialSelection", name: "Material Selection Guide" },
  ];

  return (
    <Fade in timeout={800}>
      <Box
        className="tools-page"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          background: "linear-gradient(to bottom, #f5f5f5, #e9ecef)",
        }}
      >
        <Navbar userRole={null} />
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <Container maxWidth="md" sx={{ py: 4, mt: 12, mb: 8 }}>
            <Typography
              variant="h5"
              align="center"
              gutterBottom
              sx={{
                fontWeight: "bold",
                fontFamily: "Helvetica, sans-serif",
                textTransform: "uppercase",
                letterSpacing: 0,
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
                color: "#000000",
                mb: 6,
              }}
            >
              Engineering Tools
            </Typography>

            <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
              {tools.map((tool) => (
                <ToolButton
                  key={tool.id}
                  active={activeTool === tool.id}
                  onClick={() => setActiveTool(tool.id)}
                >
                  {tool.name}
                </ToolButton>
              ))}
            </Box>

            <Box
              sx={{
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                "&:hover": {
                  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
                },
              }}
            >
              {activeTool === "unitConverter" && (
                <Box className="tool-container">
                  <StyledTextField
                    type="number"
                    label="Value"
                    value={converterValue}
                    onChange={(e) => setConverterValue(e.target.value)}
                    placeholder="Enter value"
                    fullWidth
                    margin="normal"
                  />
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
                  </StyledTextField>
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
                  </StyledTextField>
                  <Button
                    variant="contained"
                    onClick={handleUnitConvert}
                    sx={{
                      fontFamily: "Helvetica, sans-serif",
                      "&:hover": { bgcolor: "#2c3e50" },
                      mt: 2,
                    }}
                  >
                    Convert
                  </Button>
                  {converterResult && (
                    <Typography sx={{ mt: 2, fontWeight: "bold" }}>
                      {converterValue} {fromUnit} = {converterResult} {toUnit}
                    </Typography>
                  )}
                </Box>
              )}
              {activeTool === "wakeFrequency" && (
                <Box className="tool-container">
                  <StyledTextField
                    select
                    label="Unit System"
                    value={wakeUnitSystem}
                    onChange={(e) => setWakeUnitSystem(e.target.value)}
                    fullWidth
                    margin="normal"
                  >
                    <MenuItem value="metric">Metric (mm, m/s, kg/m³)</MenuItem>
                    <MenuItem value="imperial">
                      Imperial (in, ft/s, lb/ft³)
                    </MenuItem>
                  </StyledTextField>
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
                  <Button
                    variant="contained"
                    onClick={handleWakeCalculate}
                    sx={{
                      fontFamily: "Helvetica, sans-serif",
                      "&:hover": { bgcolor: "#2c3e50" },
                      mt: 2,
                    }}
                  >
                    Calculate
                  </Button>
                  {wakeResult && (
                    <Box sx={{ mt: 2 }}>
                      {wakeResult.error ? (
                        <Typography color="error">
                          {wakeResult.error}
                        </Typography>
                      ) : (
                        <Typography sx={{ fontWeight: "bold" }}>
                          Wake Frequency: {wakeResult.frequency}{" "}
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
                  <StyledTextField
                    label="Chemical Name"
                    value={chemical}
                    onChange={(e) => setChemical(e.target.value)}
                    placeholder="e.g., Acetic Acid"
                    fullWidth
                    margin="normal"
                  />
                  <StyledTextField
                    select
                    label="Concentration (%)"
                    value={concentration}
                    onChange={(e) => setConcentration(e.target.value)}
                    fullWidth
                    margin="normal"
                  >
                    <MenuItem value="10">10%</MenuItem>
                    <MenuItem value="50">50%</MenuItem>
                    <MenuItem value="100">100%</MenuItem>
                  </StyledTextField>
                  <Button
                    variant="contained"
                    onClick={handleMaterialSelect}
                    sx={{
                      fontFamily: "Helvetica, sans-serif",
                      "&:hover": { bgcolor: "#2c3e50" },
                      mt: 2,
                    }}
                  >
                    Select
                  </Button>
                  {materialResult && (
                    <Box sx={{ mt: 2 }}>
                      {materialResult.error ? (
                        <Typography color="error">
                          {materialResult.error}
                        </Typography>
                      ) : (
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableCell>Material</TableCell>
                              <TableCell>Compatibility</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {Object.entries(materialResult.compatibility).map(
                              ([material, rating]) => (
                                <TableRow key={material}>
                                  <TableCell>{material}</TableCell>
                                  <TableCell>{rating}</TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      )}
                    </Box>
                  )}
                  <Typography variant="caption" sx={{ mt: 2, color: "gray" }}>
                    Note: This guide is for general information only. Consult a
                    corrosion engineer for critical applications.
                  </Typography>
                </Box>
              )}
            </Box>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default Tools;
