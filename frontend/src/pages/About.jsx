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

const Section = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(6),
  padding: theme.spacing(4),
  backgroundColor: "#fafafa",
  borderRadius: "16px",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.08)",
  transition: "transform 0.3s ease, box-shadow 0.3s ease",
  "&:hover": {
    transform: "translateY(-4px)",
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
  },
  fontFamily: "Inter, sans-serif !important",
}));

const HeaderSection = styled(Box)(({ theme }) => ({
  textAlign: "center",
  padding: theme.spacing(6, 0),
  marginBottom: theme.spacing(4),
  fontFamily: "Inter, sans-serif !important",
}));

const CTAButton = styled(Button)(({ theme }) => ({
  backgroundColor: "#1976d2",
  color: "#ffffff",
  padding: theme.spacing(1, 3),
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
  fontFamily: "Inter, sans-serif !important",
}));

function About() {
  const { userRole } = useContext(UserContext);

  return (
    <Fade in timeout={800}>
      <Box
        className="about-page"
        sx={{
          minHeight: "100vh",
          backgroundColor: "#fafafa",
          fontFamily: "Inter, sans-serif !important",
        }}
      >
        <main>
          <Container maxWidth="lg" sx={{ py: 2, mt: 4 }}>
            <HeaderSection>
              <Box
                component="img"
                src={companylogo}
                alt="Company Logo"
                sx={{
                  maxWidth: { xs: 400, md: 400 },
                  mb: 4,
                  display: "block",
                  margin: "0 auto",
                }}
              />
            </HeaderSection>

            <Section>
              <Typography
                variant="h5"
                sx={{
                  fontFamily: "Inter, sans-serif !important",
                  fontWeight: "bold",
                  mb: 3,
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.25rem",
                }}
              >
                About Us
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "Inter, sans-serif !important",
                  color: "#333",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
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
                  fontFamily: "Inter, sans-serif !important",
                  fontWeight: "bold",
                  mb: 3,
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.25rem",
                }}
              >
                Our History
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "Inter, sans-serif !important",
                  color: "#333",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
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
                  fontFamily: "Inter, sans-serif !important",
                  fontWeight: "bold",
                  mb: 4,
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.5rem",
                }}
              >
                Products and Services
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
                          fontFamily: "Inter, sans-serif !important",
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
                          fontFamily: "Inter, sans-serif !important",
                          fontWeight: "bold",
                          mb: 2,
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
                          fontFamily: "Inter, sans-serif !important",
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
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "Inter, sans-serif !important",
                  mt: 3,
                  display: "block",
                  color: "#333",
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
                  fontFamily: "Inter, sans-serif !important",
                  fontWeight: "bold",
                  mb: 3,
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.25rem",
                }}
              >
                Global Presence
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: "Inter, sans-serif !important",
                  color: "#333",
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
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
                  fontFamily: "Inter, sans-serif !important",
                  fontWeight: "bold",
                  mb: 4,
                  color: "#000000",
                  textTransform: "uppercase",
                  fontSize: "1.25rem",
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
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      p: 2,
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                      },
                      fontFamily: "Inter, sans-serif !important",
                    }}
                  >
                    <LocationOn
                      sx={{ fontSize: 30, mr: 1.5, color: "#d6393a" }}
                    />
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "Inter, sans-serif !important",
                        color: "#333",
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
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      p: 2,
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                      },
                      fontFamily: "Inter, sans-serif !important",
                    }}
                  >
                    <Phone sx={{ fontSize: 30, mr: 1.5, color: "#008000" }} />
                    <Typography
                      variant="body1"
                      component="a"
                      href="tel:+60341423808"
                      sx={{
                        fontFamily: "Inter, sans-serif !important",
                        color: "#333",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        textDecoration: "none",
                        "&:hover": { color: "#d4a017" },
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
                      backgroundColor: "#fff",
                      borderRadius: "12px",
                      p: 2,
                      boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        boxShadow: "0 6px 20px rgba(0, 0, 0, 0.15)",
                      },
                      fontFamily: "Inter, sans-serif !important",
                    }}
                  >
                    <Email sx={{ fontSize: 30, mr: 1.5, color: "#d4a017" }} />
                    <Typography
                      variant="body1"
                      component="a"
                      href="mailto:my_sales@rueger.com"
                      sx={{
                        fontFamily: "Inter, sans-serif !important",
                        color: "#333",
                        fontSize: { xs: "0.9rem", sm: "1rem" },
                        textDecoration: "none",
                        "&:hover": { color: "#d4a017" },
                      }}
                      aria-label="Email Rueger Sdn. Bhd."
                    >
                      my_sales@rueger.com
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
              <Divider sx={{ my: 4 }} />
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 3,
                  flexWrap: "wrap",
                  fontFamily: "Inter, sans-serif !important",
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
                    color: "#0077b5",
                    backgroundColor: "#ffffff",
                    "&:hover": {
                      color: "#0077b5",
                      backgroundColor: "#f5f5f5",
                      transform: "scale(1.1)",
                    },
                    transition: "all 0.3s ease",
                    fontFamily: "Inter, sans-serif !important",
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
