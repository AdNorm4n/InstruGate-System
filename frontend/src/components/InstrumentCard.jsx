import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CircularProgress,
  Button,
  TextField,
} from "@mui/material";
import "../styles/InstrumentCard.css";

const InstrumentCard = ({
  instrument,
  userRole,
  configData,
  productCode,
  requirements = [],
  addOns = [],
  quantity = 1,
  onQuantityChange,
  onRemove,
  onImageClick,
  isSelectedInstrument = false,
}) => {
  const navigate = useNavigate();
  const baseUrl = "http://127.0.0.1:8000";
  const [isClicked, setIsClicked] = useState(false);
  const [inputValue, setInputValue] = useState(quantity.toString());

  const imageUrl = instrument.image
    ? new URL(instrument.image, baseUrl).href
    : null;

  console.log(
    "Instrument:",
    instrument.name,
    "Image path:",
    instrument.image,
    "Full URL:",
    imageUrl
  );
  console.log("Config data:", configData);
  if (isSelectedInstrument) {
    console.log("Selected Instrument:", {
      productCode,
      requirements,
      addOns,
      quantity,
    });
  }

  const handleClick = () => {
    if (!isSelectedInstrument) {
      setIsClicked(true);
      setTimeout(() => {
        navigate(`/instruments/${instrument.id}/config`, {
          state: { userRole, instrument, configData },
        });
      }, 300);
    }
  };

  const handleIncrement = () => {
    const newQuantity = quantity + 1;
    setInputValue(newQuantity.toString());
    onQuantityChange(newQuantity);
  };

  const handleDecrement = () => {
    const newQuantity = Math.max(0, quantity - 1);
    setInputValue(newQuantity.toString());
    onQuantityChange(newQuantity);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    const parsed = parseInt(value, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      onQuantityChange(parsed);
    } else if (value === "") {
      onQuantityChange(0);
    }
  };

  return (
    <Card
      className="instrument-card"
      elevation={2}
      sx={{
        display: "flex",
        alignItems: "center",
        borderRadius: 2,
        bgcolor: "white",
        transition: "all 0.3s ease",
        position: "relative",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
        },
        transform: isClicked ? "scale(0.98)" : "none",
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{ display: "flex", flex: 1, p: 2 }}
        disabled={isSelectedInstrument}
      >
        {isClicked && (
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              bgcolor: "rgba(0, 0, 0, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <CircularProgress size={24} />
          </Box>
        )}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={instrument.name}
            className="instrument-image"
            onClick={onImageClick}
            style={{ cursor: isSelectedInstrument ? "pointer" : "default" }}
            onError={(e) => {
              console.log("Image load error:", imageUrl);
              e.target.style.display = "none";
              e.target.nextSibling.style.display = "flex";
            }}
          />
        ) : null}
        <Box
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
          <Typography
            variant="body2"
            color="text.secondary"
            fontFamily="Helvetica, sans-serif"
          >
            No Image
          </Typography>
        </Box>
        <Box sx={{ flex: 1, ml: 3, py: 2 }}>
          <Typography
            variant="h6"
            fontWeight={600}
            color="text.primary"
            fontFamily="Helvetica, sans-serif"
          >
            {instrument.name}
          </Typography>
          {isSelectedInstrument ? (
            <>
              <Typography
                variant="body2"
                color="#0a5"
                fontWeight="bold"
                sx={{ mt: 1, fontFamily: "Helvetica, sans-serif" }}
              >
                Product Code: {productCode}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  lineHeight: 1.5,
                  fontFamily: "Helvetica, sans-serif",
                }}
              >
                {requirements.length > 0
                  ? `Requirements: ${requirements
                      .map((r) => `[${r.code}] ${r.label}`)
                      .join(", ")}`
                  : "No requirements selected"}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 1,
                  lineHeight: 1.5,
                  fontFamily: "Helvetica, sans-serif",
                }}
              >
                {addOns.length > 0
                  ? `Add-Ons: ${addOns
                      .map((a) => `[${a.code}] ${a.label}`)
                      .join(", ")}`
                  : "No add-ons selected"}
              </Typography>
            </>
          ) : (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 1,
                lineHeight: 1.5,
                fontFamily: "Helvetica, sans-serif",
              }}
            >
              {instrument.description || "No description available"}
            </Typography>
          )}
        </Box>
      </CardActionArea>
      {isSelectedInstrument && (
        <Box sx={{ p: 2, display: "flex", flexDirection: "column" }}>
          <Box className="quantity-controls">
            <TextField
              value={inputValue}
              onChange={handleInputChange}
              type="number"
              inputProps={{ min: 0, style: { textAlign: "center" } }}
              sx={{
                width: 100,
                "& .MuiInputBase-root": {
                  fontFamily: "Helvetica, sans-serif",
                  fontSize: "0.9rem",
                  borderRadius: 20,
                },
                "&": {
                  borderColor: "white",
                },
              }}
            />
          </Box>
        </Box>
      )}
    </Card>
  );
};

export default InstrumentCard;
