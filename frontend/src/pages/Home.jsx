import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import { styled } from "@mui/material/styles";
import {
  Box,
  Container,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Fade,
} from "@mui/material";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ArchiveIcon from "@mui/icons-material/Archive";
import pressImage from "../assets/press.jpg";
import tempImage from "../assets/temp.jpg";
import testImage from "../assets/test.jpg";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  padding: theme.spacing(2),
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  backgroundImage: "linear-gradient(45deg, #ffffff 50%, #f5f5f5 100%)",
  backgroundSize: "200% 200%",
  backgroundPosition: "0% 50%",
  transition:
    "transform 0.3s ease, box-shadow 0.3s ease, background-position 0.5s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
    backgroundPosition: "100% 50%",
  },
  fontFamily: "Helvetica, sans-serif !important",
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#d4a017",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
  fontWeight: 600,
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Helvetica, sans-serif !important",
  fontSize: "0.9rem",
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

const RoleCard = styled(Card)(({ theme }) => ({
  height: "240px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#fafafa",
  border: "none",
  borderRadius: "8px",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  backgroundImage: "linear-gradient(45deg, #fafafa 50%, #f0f0f0 100%)",
  backgroundSize: "200% 200%",
  backgroundPosition: "0% 50%",
  transition:
    "transform 0.3s ease, box-shadow 0.3s ease, background-position 0.5s ease",
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
    backgroundPosition: "100% 50%",
  },
  fontFamily: "Helvetica, sans-serif !important",
}));

const ProductCard = styled(Card)(({ theme }) => ({
  height: "360px",
  width: "100%",
  maxWidth: "320px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#ffffff",
  border: "none",
  borderRadius: "8px",
  boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.05)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
  },
  margin: "0 auto",
  fontFamily: "Helvetica, sans-serif !important",
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
        <CircularProgress size={48} sx={{ color: "#d4a017" }} />
        <Typography
          variant="h6"
          sx={{
            mt: 2,
            fontFamily: "Helvetica, sans-serif !important",
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
    <Fade in timeout={800}>
      <Box
        className="home-wrapper"
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "#f8f9fa",
          fontFamily: "Helvetica, sans-serif !important",
        }}
      >
        <Navbar userRole={userRole} />
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <section className="home-hero">
            <div className="hero-text">
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "Helvetica, sans-serif !important",
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
                  fontFamily: "Helvetica, sans-serif !important",
                  color: "white",
                }}
              >
                Keep your business running with reliable Pressure, Temperature
                and Test Instruments
              </Typography>
            </div>
          </section>

          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Helvetica, sans-serif !important",
                  fontWeight: "bold",
                  mb: 2,
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.25rem",
                }}
              >
                Your Dashboard
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {userRole === "admin" && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Fade in timeout={1000}>
                      <RoleCard className="role-card">
                        <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                          <AdminPanelSettingsIcon
                            sx={{ fontSize: 32, mb: 1, color: "#d6393a" }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              fontWeight: "bold",
                              mb: 1,
                              color: "#000000",
                              textTransform: "uppercase",
                              fontSize: "1.25rem",
                            }}
                          >
                            Admin Panel
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              color: "#333",
                              mb: 2,
                              fontSize: "0.9rem",
                            }}
                          >
                            Access the admin panel to manage users, instruments,
                            and settings.
                          </Typography>
                          <CTAButton
                            variant="contained"
                            onClick={() => handleClick("admin", "/admin-panel")}
                            disabled={isClicked === "admin"}
                            aria-label="Go to Admin Panel"
                          >
                            {isClicked === "admin" ? (
                              <CircularProgress
                                size={20}
                                sx={{ color: "#ffffff" }}
                              />
                            ) : (
                              "Go to Admin Panel"
                            )}
                          </CTAButton>
                        </CardContent>
                      </RoleCard>
                    </Fade>
                  </Grid>
                )}
                {userRole === "proposal_engineer" && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Fade in timeout={1000}>
                      <RoleCard className="role-card">
                        <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                          <ArchiveIcon
                            sx={{ fontSize: 32, mb: 1, color: "#d6393a" }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              fontWeight: "bold",
                              mb: 1,
                              color: "#000000",
                              textTransform: "uppercase",
                              fontSize: "1.25rem",
                            }}
                          >
                            Engineer Tools
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              color: "#333",
                              mb: 2,
                              fontSize: "0.9rem",
                            }}
                          >
                            Browse instruments and prepare technical proposals.
                          </Typography>
                          <CTAButton
                            variant="contained"
                            onClick={() =>
                              handleClick("engineer", "/instruments")
                            }
                            disabled={isClicked === "engineer"}
                            aria-label="Browse Instruments"
                          >
                            {isClicked === "engineer" ? (
                              <CircularProgress
                                size={20}
                                sx={{ color: "#ffffff" }}
                              />
                            ) : (
                              "Browse Instruments"
                            )}
                          </CTAButton>
                        </CardContent>
                      </RoleCard>
                    </Fade>
                  </Grid>
                )}
                {userRole === "client" && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Fade in timeout={1000}>
                      <RoleCard className="role-card">
                        <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                          <StorefrontIcon
                            sx={{ fontSize: 32, mb: 1, color: "#d6393a" }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              fontWeight: "bold",
                              mb: 1,
                              color: "#000000",
                              textTransform: "uppercase",
                              fontSize: "1.25rem",
                            }}
                          >
                            Client Resources
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "Helvetica, sans-serif !important",
                              color: "#333",
                              mb: 2,
                              fontSize: "0.9rem",
                            }}
                          >
                            Search instruments and submit requests for your
                            projects.
                          </Typography>
                          <CTAButton
                            variant="contained"
                            onClick={() =>
                              handleClick("client", "/instruments")
                            }
                            disabled={isClicked === "client"}
                            aria-label="Browse Instruments"
                          >
                            {isClicked === "client" ? (
                              <CircularProgress
                                size={20}
                                sx={{ color: "#ffffff" }}
                              />
                            ) : (
                              "Browse Instruments"
                            )}
                          </CTAButton>
                        </CardContent>
                      </RoleCard>
                    </Fade>
                  </Grid>
                )}
              </Grid>
            </Section>

            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Helvetica, sans-serif !important",
                  fontWeight: "bold",
                  mb: 4,
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.5rem",
                }}
              >
                Our Products
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={6} md={4}>
                  <ProductCard className="product-card">
                    <CardContent sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
                      <Box className="product-image-wrapper">
                        <img
                          src={pressImage}
                          alt="Pressure Instruments"
                          className="product-image"
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: "Helvetica, sans-serif !important",
                          fontWeight: "bold",
                          mb: 2,
                          color: "#000000",
                          textTransform: "uppercase",
                          fontSize: "1.25rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Pressure
                        <br />
                        Instruments
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Helvetica, sans-serif !important",
                          color: "#333",
                          lineHeight: 1.6,
                          fontSize: "0.9rem",
                        }}
                      >
                        • Pressure Gauges
                        <br />
                        • Digital Gauges
                        <br />
                        • High-Purity
                        <br />
                        • Differential Gauges
                        <br />
                        • Pressure Switches
                        <br />
                        • Pressure Sensors
                        <br />
                        • Diaphragm Seals - Isolators
                        <br />
                        • Threaded Seals
                        <br />
                        • Isolation Rings
                        <br />
                        • Flanged Seals
                        <br />
                        • In-Line
                        <br />• Accessories
                      </Typography>
                    </CardContent>
                  </ProductCard>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <ProductCard className="product-card">
                    <CardContent sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
                      <Box className="product-image-wrapper">
                        <img
                          src={tempImage}
                          alt="Temperature Instruments"
                          className="product-image"
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: "Helvetica, sans-serif !important",
                          fontWeight: "bold",
                          mb: 2,
                          color: "#000000",
                          textTransform: "uppercase",
                          fontSize: "1.25rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Temp
                        <br />
                        Instruments
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Helvetica, sans-serif !important",
                          color: "#333",
                          lineHeight: 1.6,
                          fontSize: "0.9rem",
                        }}
                      >
                        • Thermometers
                        <br />
                        • Bimetal Thermometers
                        <br />
                        • Gas Actuated Thermometers
                        <br />• Thermowells
                      </Typography>
                    </CardContent>
                  </ProductCard>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <ProductCard className="product-card">
                    <CardContent sx={{ flexGrow: 1, overflowY: "auto", p: 3 }}>
                      <Box className="product-image-wrapper">
                        <img
                          src={testImage}
                          alt="Test Instruments"
                          className="product-image"
                        />
                      </Box>
                      <Typography
                        variant="h5"
                        sx={{
                          fontFamily: "Helvetica, sans-serif !important",
                          fontWeight: "bold",
                          mb: 2,
                          color: "#000000",
                          textTransform: "uppercase",
                          fontSize: "1.25rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Test
                        <br />
                        Instruments
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Helvetica, sans-serif !important",
                          color: "#333",
                          lineHeight: 1.6,
                          fontSize: "0.9rem",
                        }}
                      >
                        • Test Gauges
                        <br />
                        • Calibration & Repair
                        <br />• Technical Support & Training
                      </Typography>
                    </CardContent>
                  </ProductCard>
                </Grid>
              </Grid>
            </Section>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default Home;
