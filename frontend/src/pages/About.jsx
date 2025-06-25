import React, { useContext } from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  Fade,
  IconButton,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { LocationOn, Phone, Email, LinkedIn } from "@mui/icons-material";
import { UserContext } from "../contexts/UserContext";
import companylogo from "../assets/companylogo.png";
import pressImage from "../assets/press.jpg";
import tempImage from "../assets/temp.jpg";
import testImage from "../assets/test.jpg";
import "../styles/About.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...(theme?.mixins?.toolbar || {
    minHeight: 56,
    "@media (min-width:600px)": {
      minHeight: 64,
    },
  }),
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#3b82f6",
  color: "#ffffff",
  padding: theme.spacing(1.5, 4),
  fontWeight: 600,
  fontSize: "0.9rem",
  textTransform: "none",
  borderRadius: "8px",
  fontFamily: "'Inter', sans-serif",
  "&:hover": {
    backgroundColor: "#2563eb",
    transform: "scale(1.03)",
  },
  "&.Mui-disabled": {
    backgroundColor: "#4b5563",
    color: "#9ca3af",
  },
  transition: "all 0.2s ease",
  "& .MuiCircularProgress-root": {
    color: "#ffffff",
  },
}));

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  padding: theme.spacing(4),
  backgroundColor: "#1e1e1e",
  borderRadius: "16px",
  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.10)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)",
  },
  fontFamily: "'Inter', sans-serif !important",
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(8, 0),
  marginBottom: theme.spacing(4),
  fontFamily: "'Inter', sans-serif !important",
}));

const ProductCard = styled(Card)(({ theme }) => ({
  height: "100%",
  width: "100%",
  maxWidth: "450px",
  display: "flex",
  flexDirection: "column",
  backgroundColor: "#2d2d2d",
  border: "none",
  borderRadius: "12px",
  boxShadow: "0 6px 24px rgba(0, 0, 0, 0.15)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "scale(1.03)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
  },
  margin: "0 auto",
  fontFamily: "'Inter', sans-serif !important",
}));

function About() {
  const { userRole } = useContext(UserContext);

  return (
    <Fade in timeout={600}>
      <Box
        className="about-page"
        sx={{
          minHeight: "100vh",
          backgroundColor: "#000000",
          fontFamily: "'Inter', sans-serif !important",
          width: "100%",
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
          overflowX: "hidden",
        }}
      >
        <DrawerHeader />
        <main
          style={{
            display: "flex",
            justifyContent: "center",
            minHeight: "100vh",
          }}
        >
          <Container
            maxWidth="lg"
            sx={{
              py: 8,
              px: { xs: 2, sm: 4 },
              width: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              boxSizing: "border-box",
            }}
          >
            <HeaderSection>
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                sx={{
                  fontWeight: 700,
                  color: "#ffffff",
                  fontFamily: "'Inter', sans-serif",
                  mb: 5,
                  fontSize: { xs: "1.75rem", md: "2.25rem" },
                  letterSpacing: "-0.02em",
                  textTransform: "none",
                  position: "relative",
                  "&:after": {
                    content: '""',
                    display: "block",
                    width: "60px",
                    height: "4px",
                    bgcolor: "#3b82f6",
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    borderRadius: "2px",
                  },
                }}
              >
                About Rueger Sdn. Bhd.
              </Typography>
              <Box
                component="img"
                src={companylogo}
                alt="Company Logo"
                sx={{
                  maxWidth: { xs: 300, md: 400 },
                  mt: 2,
                  mb: 4,
                  display: "block",
                  margin: "0 auto",
                  filter: "brightness(1.1)",
                }}
              />
            </HeaderSection>

            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  fontWeight: 600,
                  mb: 3,
                  color: "#ffffff",
                  fontSize: "1.25rem",
                  letterSpacing: "0.02em",
                }}
              >
                About Us
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                }}
              >
                Rueger Sdn. Bhd., established in 1997 as a subsidiary of Rueger
                SA and part of the Ashcroft family, is a leading provider of
                high-precision temperature and pressure measurement instruments
                in Southeast Asia. Headquartered in Kuala Lumpur, Malaysia, we
                combine Swiss engineering excellence with regional expertise to
                deliver innovative, reliable, and customized solutions. Our
                products serve industries such as chemical, petrochemical, oil
                and gas, food, pharmaceuticals, and HVAC, ensuring precision and
                durability in demanding environments. With a dedicated team of
                engineers and technicians, we offer comprehensive services,
                including calibration, repair, and technical support, to meet
                the needs of our diverse clientele.
              </Typography>
            </Section>

            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  fontWeight: 600,
                  mb: 3,
                  color: "#ffffff",
                  fontSize: "1.25rem",
                  letterSpacing: "0.02em",
                }}
              >
                Our History
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                }}
              >
                Founded in 1942 in Lausanne, Switzerland, Rueger SA has been a
                pioneer in high-precision temperature and pressure measurement
                for over eight decades. In 1997, Rueger Sdn. Bhd. was
                established in Kuala Lumpur to better serve Southeast Asia,
                marking a significant expansion into the region’s growing
                markets. As an Ashcroft company, we have achieved a 26.54% sales
                revenue increase in 2023 and a 26.9% growth in total assets,
                reflecting our strong market presence. Under third-generation
                family leadership, with Bernard Rüeger as Managing Director and
                Jean-Marc Rüeger as CEO since 2012, we continue to innovate,
                producing OEM products like electronic thermostats and
                multipoint sensors. Our ISO 9001:2015 certification underscores
                our commitment to quality and reliability across all operations.
              </Typography>
            </Section>

            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  fontWeight: 600,
                  mb: 4,
                  color: "#ffffff",
                  fontSize: "1.5rem",
                  letterSpacing: "0.02em",
                }}
              >
                Products and Services
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={6} md={4}>
                  <ProductCard className="product-card">
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box
                        className="product-image-wrapper"
                        sx={{
                          width: "100%",
                          height: "250px",
                          mb: 2,
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={pressImage}
                          alt="Pressure Instruments"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Inter', sans-serif !important",
                          fontWeight: 600,
                          mb: 2,
                          color: "#ffffff",
                          fontSize: "1.25rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Pressure Instruments
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Inter', sans-serif !important",
                          color: "#ffffff",
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
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box
                        className="product-image-wrapper"
                        sx={{
                          width: "100%",
                          height: "250px",
                          mb: 2,
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={tempImage}
                          alt="Temperature Instruments"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Inter', sans-serif !important",
                          fontWeight: 600,
                          mb: 2,
                          color: "#ffffff",
                          fontSize: "1.25rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Temperature Instruments
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Inter', sans-serif !important",
                          color: "#ffffff",
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
                    <CardContent sx={{ flexGrow: 1, p: 3 }}>
                      <Box
                        className="product-image-wrapper"
                        sx={{
                          width: "100%",
                          height: "250px",
                          mb: 2,
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={testImage}
                          alt="Test Instruments"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontFamily: "'Inter', sans-serif !important",
                          fontWeight: 600,
                          mb: 2,
                          color: "#ffffff",
                          fontSize: "1.25rem",
                          lineHeight: 1.2,
                        }}
                      >
                        Test Instruments
                      </Typography>
                      <Typography
                        sx={{
                          fontFamily: "'Inter', sans-serif !important",
                          color: "#ffffff",
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
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  mt: 3,
                  display: "block",
                  color: "#ffffff",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                }}
              >
                Applications: Chemical, petrochemical, power, shipbuilding,
                food, HVAC, and more.
              </Typography>
            </Section>

            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  fontWeight: 600,
                  mb: 3,
                  color: "#ffffff",
                  fontSize: "1.25rem",
                  letterSpacing: "0.02em",
                }}
              >
                Global Presence
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  color: "#ffffff",
                  fontSize: "0.95rem",
                  lineHeight: 1.7,
                }}
              >
                With subsidiaries in Germany, Malaysia, and China, and over 50
                agents worldwide, Rueger Sdn. Bhd. ensures quality with ISO
                9001:2015 certification. Our instruments are engineered for
                hazardous environments, serving diverse industries.
              </Typography>
            </Section>

            <Section sx={{ textAlign: "center" }}>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "'Inter', sans-serif !important",
                  fontWeight: 600,
                  mb: 4,
                  color: "#ffffff",
                  fontSize: "1.25rem",
                  letterSpacing: "0.02em",
                }}
              >
                Contact Us
              </Typography>
              <Grid container spacing={3} justifyContent="center">
                <Grid item xs={12} sm={4}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      backgroundColor: "#2d2d2d",
                      borderRadius: "12px",
                      p: 2,
                      boxShadow: "0 6px 24px rgba(0, 0, 0, 0.15)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                      },
                      fontFamily: "'Inter', sans-serif !important",
                    }}
                  >
                    <LocationOn
                      sx={{ fontSize: 30, mr: 1.5, color: "#3b82f6" }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Inter', sans-serif !important",
                        color: "#ffffff",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        textAlign: "left",
                      }}
                    >
                      Rueger Sdn. Bhd., 36, Persiaran Industri, <br />
                      Bandar Sri Damansara, 52200 Kuala Lumpur, Selangor
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      backgroundColor: "#2d2d2d",
                      borderRadius: "12px",
                      p: 2,
                      boxShadow: "0 6px 24px rgba(0, 0, 0, 0.15)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                      },
                      fontFamily: "'Inter', sans-serif !important",
                    }}
                  >
                    <Phone sx={{ fontSize: 30, mr: 1.5, color: "#3b82f6" }} />
                    <Typography
                      variant="body1"
                      component="a"
                      href="tel:+60341423808"
                      sx={{
                        fontFamily: "'Inter', sans-serif !important",
                        color: "#ffffff",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        textDecoration: "none",
                        "&:hover": { color: "#3b82f6" },
                      }}
                      aria-label="Call Rueger Sdn. Bhd."
                    >
                      +603-4142 3808
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    sx={{
                      backgroundColor: "#2d2d2d",
                      borderRadius: "12px",
                      p: 2,
                      boxShadow: "0 6px 24px rgba(0, 0, 0, 0.15)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.2)",
                      },
                      fontFamily: "'Inter', sans-serif !important",
                    }}
                  >
                    <Email sx={{ fontSize: 30, mr: 1.5, color: "#3b82f6" }} />
                    <Typography
                      variant="body1"
                      component="a"
                      href="mailto:my_sales@rueger.com"
                      sx={{
                        fontFamily: "'Inter', sans-serif !important",
                        color: "#ffffff",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        textDecoration: "none",
                        "&:hover": { color: "#3b82f6" },
                      }}
                      aria-label="Email Rueger Sdn. Bhd."
                    >
                      my_sales@rueger.com
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 4, borderColor: "#4b5563" }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 3,
                  flexWrap: "wrap",
                  fontFamily: "'Inter', sans-serif !important",
                }}
              >
                <CTAButton
                  variant="contained"
                  href="https://www.rueger.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Visit Rueger Website"
                >
                  Visit Our Website
                </CTAButton>
                <IconButton
                  href="https://www.linkedin.com/company/rueger-sdn-bhd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  sx={{
                    color: "#3b82f6",
                    backgroundColor: "#2d2d2d",
                    "&:hover": {
                      color: "#3b82f6",
                      backgroundColor: "#3b82f61a",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.3s ease",
                    fontFamily: "'Inter', sans-serif !important",
                  }}
                >
                  <LinkedIn fontSize="large" />
                </IconButton>
              </Box>
            </Section>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default About;
