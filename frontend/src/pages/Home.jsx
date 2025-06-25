import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
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
  minHeight: "48px !important", // Reduced height for less top spacing
}));

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(3), // Reduced from 4
  padding: theme.spacing(1.5), // Reduced from 2
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
  fontFamily: "Inter, sans-serif !important",
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  padding: theme.spacing(0.8, 2.5), // Slightly reduced padding
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "Inter, sans-serif",
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

const RoleCard = styled(Card)(({ theme }) => ({
  height: "220px", // Slightly reduced height
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
  fontFamily: "Inter, sans-serif !important",
}));

const ProductCard = styled(Card)(({ theme }) => ({
  height: "340px", // Slightly reduced height
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
  fontFamily: "Inter, sans-serif !important",
}));

function Home() {
  const navigate = useNavigate();
  const { userRole, loading } = useContext(UserContext);
  const [isClicked, setIsClicked] = useState(null);

  useEffect(() => {
    if (!userRole && !loading) {
      navigate("/login");
    }
  }, [userRole, loading, navigate]);

  const handleClick = (action, path) => {
    setIsClicked(action);
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

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
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
          bgcolor: "#f5f5f5",
          fontFamily: "Inter, sans-serif !important",
        }}
      >
        <DrawerHeader />
        <main style={{ flex: 1 }}>
          <section className="home-hero">
            <div className="hero-text">
              <Typography
                variant="h4"
                sx={{
                  fontFamily: "Inter, sans-serif !important",
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
                  fontFamily: "Inter, sans-serif !important",
                  color: "white",
                }}
              >
                Keep your operations smooth and dependable with Rueger’s trusted
                measurement instruments.
              </Typography>
            </div>
          </section>

          <Container maxWidth="lg" sx={{ py: 0 }}>
            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Inter, sans-serif !important",
                  fontWeight: "bold",
                  mb: 1.5, // Reduced from 2
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.25rem",
                }}
              >
                Dashboard
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {userRole === "admin" && (
                  <Grid item xs={12} sm={6} md={4}>
                    <Fade in timeout={1000}>
                      <RoleCard className="role-card">
                        <CardContent sx={{ flexGrow: 1, textAlign: "center" }}>
                          <AdminPanelSettingsIcon
                            sx={{ fontSize: 32, mb: 1, color: "#1976d2" }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "Inter, sans-serif !important",
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
                              fontFamily: "Inter, sans-serif !important",
                              color: "#333",
                              mb: 1.5, // Reduced from 2
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
                            sx={{ fontSize: 32, mb: 1, color: "#1976d2" }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "Inter, sans-serif !important",
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
                              fontFamily: "Inter, sans-serif !important",
                              color: "#333",
                              mb: 1.5, // Reduced from 2
                              fontSize: "0.9rem",
                            }}
                          >
                            Review and approve submitted quotations to proceed
                            to the Purchase Order (PO) stage.
                          </Typography>
                          <CTAButton
                            variant="contained"
                            onClick={() =>
                              handleClick("engineer", "/quotations/submitted")
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
                            sx={{ fontSize: 32, mb: 1, color: "#1976d2" }}
                          />
                          <Typography
                            variant="h5"
                            sx={{
                              fontFamily: "Inter, sans-serif !important",
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
                              fontFamily: "Inter, sans-serif !important",
                              color: "#333",
                              mb: 1.5, // Reduced from 2
                              fontSize: "0.9rem",
                            }}
                          >
                            Browse instruments and submit quotations for your
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
                  fontFamily: "Inter, sans-serif !important",
                  fontWeight: "bold",
                  mb: 2, // Reduced from 4
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.5rem",
                }}
              >
                Our Products
              </Typography>
              <Grid container spacing={2} justifyContent="center">
                {" "}
                {/* Reduced spacing from 3 */}
                <Grid item xs={12} sm={6} md={4}>
                  <ProductCard className="product-card">
                    <CardContent
                      sx={{ flexGrow: 1, overflowY: "auto", p: 2.5 }}
                    >
                      {" "}
                      {/* Reduced padding from 3 */}
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
                          fontFamily: "Inter, sans-serif !important",
                          fontWeight: "bold",
                          mb: 1.5, // Reduced from 2
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
                          fontFamily: "Inter, sans-serif !important",
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
                    <CardContent
                      sx={{ flexGrow: 1, overflowY: "auto", p: 2.5 }}
                    >
                      {" "}
                      {/* Reduced padding from 3 */}
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
                          fontFamily: "Inter, sans-serif !important",
                          fontWeight: "bold",
                          mb: 1.5, // Reduced from 2
                          color: "#000000",
                          textTransform: "uppercase",
                          fontSize: "1.25rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Temperature
                        <br />
                        Instruments
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "Inter, sans-serif !important",
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
                    <CardContent
                      sx={{ flexGrow: 1, overflowY: "auto", p: 2.5 }}
                    >
                      {" "}
                      {/* Reduced padding from 3 */}
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
                          fontFamily: "Inter, sans-serif !important",
                          fontWeight: "bold",
                          mb: 1.5, // Reduced from 2
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
                          fontFamily: "Inter, sans-serif !important",
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
