import { useEffect, useState } from "react";
import api from "../api";
import "../styles/Home.css";
import "../styles/Navbar.css";

function Home() {
  const [instruments, setInstruments] = useState([]);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Fetch instruments
    api
      .get("/api/instruments/")
      .then((res) => setInstruments(res.data))
      .catch(() => alert("Failed to load instruments"));

    // Fetch user role
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
      {/* ✅ NAVIGATION BAR */}
      <nav className="navbar">
        <div className="navbar-logo">InstruGate</div>
        <ul className="navbar-links">
          <li>
            <a href="/">Home</a>
          </li>

          {userRole !== "admin" && (
            <>
              <li className="dropdown">
                <a href="#">Products</a>
                <div className="dropdown-content">
                  {instruments.map((inst) => (
                    <a key={inst.id} href={`/instruments#${inst.id}`}>
                      {inst.name}
                    </a>
                  ))}
                </div>
              </li>
              <li>
                <a href="/instruments">Browse</a>
              </li>
              <li>
                <a href="#">About</a>
              </li>
            </>
          )}

          <li>
            <a href="/logout">Logout</a>
          </li>
        </ul>
      </nav>

      {/* ✅ HOMEPAGE CONTENT */}
      <div className="home-content">
        <h2>Welcome to InstruGate</h2>

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
      </div>
    </div>
  );
}

export default Home;
