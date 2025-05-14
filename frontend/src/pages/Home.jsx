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
    <div
      className="home-wrapper"
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <Navbar userRole={userRole} />
      <DrawerHeader />

      <main style={{ flex: 1 }}>
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
              <div className="card">
                <div className="card-icon">⚙️</div>
                <h3>Admin Panel</h3>
                <p>
                  You are logged in as <strong>Admin</strong>.
                </p>
                <p>
                  Manage users, instruments, and system settings from the admin
                  panel.
                </p>
                <a href="/admin" className="admin-button">
                  Learn More
                </a>
              </div>
            </div>
          )}
          {userRole === "proposal_engineer" && (
            <div className="role-section engineer">
              <div className="card">
                <div className="card-icon">📐</div>
                <h3>Proposal Engineer Tools</h3>
                <p>
                  You are logged in as <strong>Proposal Engineer</strong>.
                </p>
                <p>
                  You can browse instruments and prepare technical proposals.
                </p>
                <a href="/instruments" className="primary-button">
                  Learn More
                </a>
              </div>
            </div>
          )}
          {userRole === "client" && (
            <div className="role-section client">
              <div className="card">
                <div className="card-icon">🔍</div>
                <h3>Client Resources</h3>
                <p>
                  You are logged in as <strong>Client</strong>.
                </p>
                <p>
                  You can search for instruments and submit request orders for
                  your projects.
                </p>
                <a href="/instruments" className="primary-button">
                  Browse Instruments
                </a>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Home;
