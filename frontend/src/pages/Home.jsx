// Home.jsx
import { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import "../styles/Home.css";
import { styled } from "@mui/material/styles";

const DrawerHeader = styled("div")(({ theme }) => ({
  ...theme.mixins.toolbar,
}));

function Home() {
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    api
      .get("/api/users/me/")
      .then((res) => setUserRole(res.data.role))
      .catch((err) => {
        console.error("Failed to fetch user role:", err);
        setUserRole(null);
      });
  }, []);

  if (userRole === null) {
    return <div>Loading...</div>;
  }

  return (
    <div className="home-wrapper">
      <Navbar userRole={userRole} />
      <DrawerHeader />

      {/* 🏠 Hero Section */}
      <section className="home-hero">
        <div className="hero-text">
          <h1>Welcome to InstruGate</h1>
          <p>
            Keep your business running with reliable pressure & temperature
            instruments
          </p>
        </div>
      </section>

      {/* 💼 Role-Based Section */}
      <section className="home-content container">
        {userRole === "admin" && (
          <div className="role-section admin">
            <p>
              You are logged in as <strong>Admin</strong>.
            </p>
            <p>
              Manage users, instruments, and system settings from the admin
              panel.
            </p>
            <a href="/admin" className="admin-button">
              Go to Administration Panel
            </a>
          </div>
        )}
        {userRole === "proposal_engineer" && (
          <div className="role-section engineer">
            <p>
              You are logged in as <strong>Proposal Engineer</strong>.
            </p>
            <p>You can browse instruments and prepare technical proposals.</p>
            <a href="/instruments" className="primary-button">
              Explore Instruments
            </a>
          </div>
        )}
        {userRole === "client" && (
          <div className="role-section client">
            <p>
              You are logged in as <strong>Client</strong>.
            </p>
            <p>
              You can search for instruments and submit request orders for your
              projects.
            </p>
            <a href="/instruments" className="primary-button">
              Start Browsing
            </a>
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;
