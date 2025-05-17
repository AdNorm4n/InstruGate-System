import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import { styled } from "@mui/material/styles";
import { Box, Typography, Button, CircularProgress } from "@mui/material";
import ArrowForward from "@mui/icons-material/ArrowForward";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function Home() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [isClicked, setIsClicked] = useState(null);

  useEffect(() => {
    api
      .get("/api/users/me/")
      .then((res) => setUserRole(res.data.role))
      .catch((err) => {
        console.error("Failed to fetch user role:", err);
        setUserRole(null);
      });
  }, []);

  const handleClick = (action, path) => {
    setIsClicked(action);
    console.log("handleClick called:", { action, path });
    setTimeout(() => {
      try {
        navigate(path);
        setIsClicked(null);
      } catch (err) {
        console.error("Navigation error:", err);
        alert("Failed to navigate");
        setIsClicked(null);
      }
    }, 300);
  };

  if (userRole === null) {
    return (
      <Box sx={{ textAlign: "center", mt: "20vh" }}>
        <CircularProgress size={48} sx={{ color: "#007bff" }} />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            fontFamily: "Helvetica, sans-serif",
            fontWeight: "bold",
            color: "#000000",
          }}
        >
          Loading...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      className="home-wrapper"
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#f8f9fa",
      }}
    >
      <Navbar userRole={userRole} />
      <DrawerHeader />

      <main style={{ flex: 1 }}>
        {/* 🏠 Hero Section */}
        <section className="home-hero">
          <div className="hero-text">
            <Typography
              variant="h4"
              sx={{
                fontFamily: "Helvetica, sans-serif",
                fontWeight: "bold",
                color: "white",
                textShadow: "1px 1px 4px rgba(0, 0, 0, 0.1)",
                mb: 1,
              }}
            >
              Welcome to InstruGate
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontFamily: "Helvetica, sans-serif",
                color: "white",
              }}
            >
              Keep your business running with reliable pressure & temperature
              instruments
            </Typography>
          </div>
        </section>

        {/* 💼 Role-Based Section */}
        <section className="home-content container">
          {userRole === "admin" && (
            <div className="role-section admin">
              <div className="card">
                <div className="card-icon">⚙️</div>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: "bold",
                    color: "#d6393a",
                    mb: 1,
                  }}
                >
                  Admin Panel
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    color: "#333",
                    mb: 1,
                  }}
                >
                  You are logged in as <strong>Admin</strong>.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    color: "#333",
                    mb: 2,
                  }}
                >
                  Manage users, instruments, and system settings from the admin
                  panel.
                </Typography>
                <Button
                  className="admin-button"
                  variant="contained"
                  onClick={() => handleClick("admin", "/admin")}
                  disabled={isClicked === "admin"}
                >
                  {isClicked === "admin" ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Go to Admin Panel"
                  )}
                </Button>
              </div>
            </div>
          )}
          {userRole === "proposal_engineer" && (
            <div className="role-section engineer">
              <div className="card">
                <div className="card-icon">📐</div>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: "bold",
                    color: "#d6393a",
                    mb: 1,
                  }}
                >
                  Proposal Engineer Tools
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    color: "#333",
                    mb: 1,
                  }}
                >
                  You are logged in as <strong>Proposal Engineer</strong>.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    color: "#333",
                    mb: 2,
                  }}
                >
                  You can browse instruments and prepare technical proposals.
                </Typography>
                <Button
                  className="primary-button"
                  variant="contained"
                  onClick={() => handleClick("engineer", "/instruments")}
                  disabled={isClicked === "engineer"}
                >
                  {isClicked === "engineer" ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Review Quotations"
                  )}
                </Button>
              </div>
            </div>
          )}
          {userRole === "client" && (
            <div className="role-section client">
              <div className="card">
                <div className="card-icon">🔍</div>
                <Typography
                  variant="h6"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    fontWeight: "bold",
                    color: "#d6393a",
                    mb: 1,
                  }}
                >
                  Client Resources
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    color: "#333",
                    mb: 1,
                  }}
                >
                  You are logged in as <strong>Client</strong>.
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: "Helvetica, sans-serif",
                    color: "#333",
                    mb: 2,
                  }}
                >
                  You can search for instruments and submit request orders for
                  your projects.
                </Typography>
                <Button
                  className="primary-button"
                  variant="contained"
                  onClick={() => handleClick("client", "/instruments")}
                  disabled={isClicked === "client"}
                >
                  {isClicked === "client" ? (
                    <CircularProgress size={24} sx={{ color: "white" }} />
                  ) : (
                    "Browse Instruments"
                  )}
                </Button>
              </div>
            </div>
          )}
        </section>
      </main>
    </Box>
  );
}

export default Home;
