import { Box, CircularProgress } from "@mui/material";
import "../styles/LoadingIndicator.css";

const LoadingIndicator = () => {
  return (
    <Box className="loading-container">
      <Box className="loading-content">
        <CircularProgress size={24} sx={{ color: "#ffffff" }} />
      </Box>
    </Box>
  );
};

export default LoadingIndicator;
