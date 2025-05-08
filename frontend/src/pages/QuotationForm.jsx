import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../api";
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";

function QuotationForm() {
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    if (location.state) {
      setSelectedInstruments(location.state.selectedInstruments || []);
      setUserData(location.state.userData || {});
    } else {
      fetchUserData(); // Fetch user data if it's not available in location state
    }
  }, [location.state]);

  const fetchUserData = async () => {
    try {
      const response = await api.get("/api/users/me/", {
        headers: {
          Authorization: `Bearer ${getToken()}`, // Get JWT token
        },
      });
      setUserData(response.data); // Set user data from the response
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const getToken = () => localStorage.getItem(ACCESS_TOKEN);
  const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN);

  const handleSubmit = async () => {
    try {
      let access = getToken();
      const refresh = getRefreshToken();

      if (!access || !refresh) {
        alert("No access token found. Please log in again.");
        navigate("/login");
        return;
      }

      const decoded = jwtDecode(access);
      const now = Date.now() / 1000;

      if (decoded.exp < now) {
        const res = await api.post("/api/token/refresh/", { refresh });
        access = res.data.access;
        localStorage.setItem(ACCESS_TOKEN, access);
      }

      const payload = {
        items: selectedInstruments.map((instrumentData) => ({
          product_code: instrumentData.productCode,
          instrument: instrumentData.instrument.id,
        })),
        company: userData.company,
      };

      await api.post("/api/quotations/", payload, {
        headers: {
          Authorization: `Bearer ${access}`,
          "Content-Type": "application/json",
        },
      });

      // ✅ Clear selected instruments after successful submission
      localStorage.removeItem("selectedInstruments");

      alert("Quotation submitted successfully!");
      navigate("/");
    } catch (error) {
      console.error("Submission failed:", error);
      alert(
        `Failed to submit quotation. Error: ${
          error?.response?.data?.detail || error.message
        }`
      );
    }
  };

  return (
    <div className="configurator-page">
      <h2>Quotation Summary</h2>
      <p>
        User: {userData.first_name || "N/A"} ({userData.username})
      </p>
      <p>Company: {userData.company || "N/A"}</p>

      {selectedInstruments.map((item, index) => (
        <div key={index} className="config-field">
          <h3>{item.instrument.name}</h3>
          <p>
            <strong>Product Code:</strong> {item.productCode}
          </p>

          <h4>Requirements:</h4>
          <ul>
            {Object.values(item.selections).map((sel, idx) => (
              <li key={idx}>
                [{sel.code}] {sel.label}
              </li>
            ))}
          </ul>

          <h4>Add-Ons:</h4>
          <ul>
            {item.selectedAddOns.length > 0 ? (
              item.selectedAddOns.map((addon, idx) => (
                <li key={idx}>
                  [{addon.code}] {addon.label} ({addon.addon_type.name})
                </li>
              ))
            ) : (
              <li>No Add-Ons selected</li>
            )}
          </ul>
        </div>
      ))}

      <button className="next-button" onClick={handleSubmit}>
        Submit Quotation
      </button>
    </div>
  );
}

export default QuotationForm;
