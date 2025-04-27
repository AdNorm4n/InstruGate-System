// src/pages/SelectedInstruments.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Configurator.css";

function SelectedInstruments() {
  const navigate = useNavigate();
  const [selectedInstruments, setSelectedInstruments] = useState([]);

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem("selectedInstruments")) || [];
    setSelectedInstruments(cart);
  }, []);

  const removeInstrument = (indexToRemove) => {
    const updated = selectedInstruments.filter(
      (_, index) => index !== indexToRemove
    );
    setSelectedInstruments(updated);
    localStorage.setItem("selectedInstruments", JSON.stringify(updated));
  };

  const handleAddMoreInstruments = () => {
    navigate("/instruments"); // ✅ Redirect to instrument list
  };

  if (selectedInstruments.length === 0) {
    return (
      <div style={{ textAlign: "center", marginTop: "50px" }}>
        <p>No instruments selected yet.</p>
        <button
          className="next-button"
          onClick={handleAddMoreInstruments}
          style={{ marginTop: "20px" }}
        >
          Add Instruments
        </button>
      </div>
    );
  }

  return (
    <div className="configurator-page">
      <div className="configurator-header">
        <h2>Selected Instruments</h2>
        <button
          className="next-button"
          style={{ backgroundColor: "#3498db", marginTop: "10px" }}
          onClick={handleAddMoreInstruments}
        >
          Add More Instruments
        </button>
      </div>

      <div className="config-form">
        {selectedInstruments.map((item, index) => (
          <div className="config-field" key={index}>
            <h3>{item.instrument.name}</h3>
            <p>
              <strong>Product Code:</strong> {item.productCode}
            </p>

            <h4>Requirements:</h4>
            <ul>
              {Object.values(item.selections).map((selection, idx) => (
                <li key={idx}>
                  [{selection.code}] {selection.label}
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

            <button
              className="next-button"
              style={{ backgroundColor: "#e74c3c", marginTop: "15px" }}
              onClick={() => removeInstrument(index)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SelectedInstruments;
