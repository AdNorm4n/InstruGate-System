import React from "react";
import { Alert, Box, Typography } from "@mui/material";

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4 }}>
          <Alert severity="error">
            <Typography variant="h6">Something went wrong.</Typography>
            <Typography>
              {this.state.error?.message || "An unexpected error occurred."}
            </Typography>
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
