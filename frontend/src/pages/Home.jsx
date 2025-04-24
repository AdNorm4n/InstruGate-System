import { useEffect, useState } from "react";
import api from "../api";
import "../styles/Home.css";
import "../styles/Navbar.css";

function Home() {
  const [instruments, setInstruments] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    api
      .get("/api/instruments/")
      .then((res) => setInstruments(res.data))
      .catch(() => alert("Failed to load instruments"));

    api
      .get("/api/users/me/")
      .then((res) => setUserRole(res.data.role))
      .catch((err) => {
        console.error("Failed to fetch user role:", err);
        setUserRole(null);
      });
  }, []);

  return (
    <div className="home-wrapper">
      {/* 🧭 Top Nav Bar */}
      <header className="ashcroft-header">
        <div className="container">
          <div className="logo">InstruGate</div>
          <nav className="nav-links">
            <a href="/">Home</a>
            {userRole !== "admin" && (
              <>
                <div className="dropdown">
                  <a href="#">Products</a>
                  <div className="dropdown-content">
                    {instruments.map((inst) => (
                      <a key={inst.id} href={`/instruments#${inst.id}`}>
                        {inst.name}
                      </a>
                    ))}
                  </div>
                </div>
                <a href="/instruments">Browse</a>
                <a href="#">About</a>
              </>
            )}
            <a href="/logout">Logout</a>
          </nav>
        </div>
      </header>

      {/* 🏠 Home Section */}
      <section className="home-hero">
        <div className="hero-text">
          <h1>Welcome to InstruGate</h1>
          <p>Your gateway to precision instruments.</p>
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
