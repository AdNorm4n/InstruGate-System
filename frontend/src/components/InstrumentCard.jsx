import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CircularProgress,
} from "@mui/material";
import "../styles/InstrumentCard.css";

const InstrumentCard = ({ instrument, userRole, configData, onImageClick }) => {
  const navigate = useNavigate();
  const baseUrl = "http://127.0.0.1:8000";
  const [isClicked, setIsClicked] = useState(false);

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

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      navigate(`/instruments/${instrument.id}/config`, {
        state: { userRole, instrument, configData },
      });
    }, 300);
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
        width: "100%",
        mx: "auto",
        boxSizing: "border-box",
        p: 4,
        minWidth: 600,
      }}
    >
      <CardActionArea
        onClick={handleClick}
        sx={{ display: "flex", flexDirection: "row", p: 2, flex: 1 }}
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
            alt={instrument.name || "Instrument"}
            className="instrument-image"
            onClick={(e) => {
              e.stopPropagation();
              onImageClick();
            }}
            style={{
              cursor: "default",
              maxWidth: "150px",
              maxHeight: "150px",
              borderRadius: "2px",
            }}
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
            variant="subtitle1"
            sx={{
              fontWeight: "bold",
              fontFamily: "Helvetica, sans-serif",
              color: "#000000",
              textTransform: "uppercase",
            }}
          >
            {instrument.name || "Unnamed Instrument"}
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
            {instrument.description || "No description available"}
          </Typography>
        </Box>
      </CardActionArea>
    </Card>
  );
};

export default InstrumentCard;
