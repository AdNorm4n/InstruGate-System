import React from "react";
import {
  Box,
  Container,
  Typography,
  Button,
  Fade,
  Card,
  CardContent,
  Grid,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "../components/Navbar";
import "../styles/About.css";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function About() {
  return (
    <Fade in timeout={800}>
      <Box
        className="about-page"
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
              About Rueger Sdn. Bhd.
            </Typography>

            {/* Hero Section */}
            <Box
              sx={{
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                mb: 4,
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{ fontFamily: "Helvetica, sans-serif", mb: 2 }}
              >
                Precision in Measurement Since 1942
              </Typography>
              <Typography
                sx={{ fontFamily: "Helvetica, sans-serif", color: "#555" }}
              >
                Rueger Sdn. Bhd., a proud subsidiary of Rueger SA and an
                Ashcroft company, is a leader in high-precision temperature and
                pressure measurement instruments. Based in Kuala Lumpur,
                Malaysia, we deliver innovative solutions to industries
                worldwide.
              </Typography>
            </Box>

            {/* Company History */}
            <Box
              sx={{
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                mb: 4,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  mb: 2,
                }}
              >
                Our History
              </Typography>
              <Typography sx={{ fontFamily: "Helvetica, sans-serif" }}>
                Founded in 1942 in Lausanne, Switzerland, Rueger SA has been at
                the forefront of temperature and pressure measurement for over
                eight decades. Rueger Sdn. Bhd. was established in 1997 to serve
                Southeast Asia, bringing our expertise to the region. Now in its
                third generation of family management, our dynamic leadership
                continues to drive innovation. As an Ashcroft company, we
                combine global reach with local expertise, achieving a 26.54%
                sales revenue increase in 2023.
              </Typography>
            </Box>

            {/* Products and Services */}
            <Box
              sx={{
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                mb: 4,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  mb: 2,
                }}
              >
                Products and Services
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        Temperature Measurement
                      </Typography>
                      <Typography sx={{ fontFamily: "Helvetica, sans-serif" }}>
                        - Electrical temperature sensors
                        <br />
                        - Bimetallic and gas pressure thermometers
                        <br />
                        - Multipoint probes
                        <br />- Thermowells (EN/DIN standards)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Card sx={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        Pressure Measurement
                      </Typography>
                      <Typography sx={{ fontFamily: "Helvetica, sans-serif" }}>
                        - Pressure gauges, switches, transmitters
                        <br />
                        - Differential pressure gauges
                        <br />
                        - Chemical seals
                        <br />- Phenolic gauges (e.g., PBPSF115)
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12}>
                  <Card sx={{ boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)" }}>
                    <CardContent>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontFamily: "Helvetica, sans-serif",
                          fontWeight: "bold",
                        }}
                      >
                        Services
                      </Typography>
                      <Typography sx={{ fontFamily: "Helvetica, sans-serif" }}>
                        - Sales and distribution of Rueger & Ashcroft products
                        <br />
                        - Calibration and repair
                        <br />- Technical support and training
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Typography
                variant="caption"
                sx={{
                  mt: 2,
                  color: "gray",
                  display: "block",
                  fontFamily: "Helvetica, sans-serif",
                }}
              >
                Applications: Chemical, petrochemical, power, shipbuilding,
                food, HVAC, and more.
              </Typography>
            </Box>

            {/* Global Presence */}
            <Box
              sx={{
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                mb: 4,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  mb: 2,
                }}
              >
                Global Presence
              </Typography>
              <Typography sx={{ fontFamily: "Helvetica, sans-serif" }}>
                With subsidiaries in Germany, Malaysia, and China, and over 60
                agents worldwide, Rueger Sdn. Bhd. is well-established in Europe
                and Asia. Our ISO 9001:2008 certification ensures quality, and
                our instruments are designed for hazardous environments, meeting
                the needs of diverse industries.
              </Typography>
            </Box>

            {/* Contact Information */}
            <Box
              sx={{
                p: 3,
                border: "4px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                textAlign: "center",
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  fontFamily: "Helvetica, sans-serif",
                  fontWeight: "bold",
                  mb: 2,
                }}
              >
                Contact Us
              </Typography>
              <Typography sx={{ fontFamily: "Helvetica, sans-serif", mb: 1 }}>
                Rueger Sdn. Bhd.
                <br />
                36, Persiaran Industri, Bandar Sri Damansara,
                <br />
                52200 Kuala Lumpur, Selangor
              </Typography>
              <Typography sx={{ fontFamily: "Helvetica, sans-serif", mb: 1 }}>
                Phone: +603-4142 3808
                <br />
                Fax: +603-4142 3909
                <br />
                Email: my_sales@rueger.com
              </Typography>
              <Button
                className="primary-button"
                variant="contained"
                href="http://www.rueger.com"
                target="_blank"
                rel="noopener noreferrer"
                disabled={false}
                sx={{ mt: 2 }}
              >
                Visit Our Website
              </Button>
            </Box>
          </Container>
        </main>
      </Box>
    </Fade>
  );
}

export default About;
