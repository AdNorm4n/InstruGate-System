import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/Configurator.css";

function QuotationForm() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const {
    selectedInstruments = [],
    userData = { first_name: "Guest", company: "Unknown", username: "Guest" },
  } = state || {};
  const [projectName, setProjectName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSave = async (status) => {
    if (!projectName.trim()) {
      setError("Project name is required.");
      return;
    }

    const configurations = selectedInstruments.map((item) => ({
      instrument_id: item.instrument.id,
      selected_fields: item.selections,
      selected_addons: item.selectedAddOns,
      product_code: item.productCode,
    }));

    const quotationData = {
      status,
      remarks: projectName,
      configurations,
    };

    try {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      const response = await axios.post(
        "http://localhost:8000/api/submit-quotation/",
        quotationData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.removeItem("selectedInstruments");

      alert(
        `Quotation ${
          status === "draft" ? "saved as draft" : "submitted"
        } successfully! Quotation ID: ${response.data.id}`
      );
      navigate("/instruments");
    } catch (err) {
      setError("Failed to save quotation. Please try again.");
      console.error("Quotation submission error:", err);
    }
  };

  if (selectedInstruments.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <p>No instruments to quote. Please add instruments first.</p>
        <button
          className="next-button"
          onClick={() => navigate("/instruments")}
        >
          Add Instruments
        </button>
      </div>
    );
  }

  return (
    <div className="configurator-page">
      <div className="configurator-header">
        <h2>Quotation Details</h2>
      </div>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div className="config-form">
        <div className="config-field">
          <label>Customer Name:</label>
          <input type="text" value={userData.first_name} disabled />
        </div>

        <div className="config-field">
          <label>Company Name:</label>
          <input type="text" value={userData.company} disabled />
        </div>

        <div className="config-field">
          <label>Project Name:</label>
          <input
            type="text"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            placeholder="Enter project name"
            required
          />
        </div>

        <h4>Selected Instruments:</h4>
        {selectedInstruments.map((item, index) => (
          <div className="config-field" key={index}>
            <h5>{item.instrument.name}</h5>
            <p>
              <strong>Product Code:</strong> {item.productCode}
            </p>
            <h6>Requirements:</h6>
            <ul>
              {Object.values(item.selections).map((selection, idx) => (
                <li key={idx}>
                  [{selection.code}] {selection.label}
                </li>
              ))}
            </ul>
            <h6>Add-Ons:</h6>
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

        <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
          <button
            className="next-button"
            style={{ backgroundColor: "#f39c12" }}
            onClick={() => handleSave("draft")}
          >
            Save as Draft
          </button>

          <button
            className="next-button"
            style={{ backgroundColor: "#2ecc71" }}
            onClick={() => handleSave("submitted")}
          >
            Submit Quotation
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuotationForm;
