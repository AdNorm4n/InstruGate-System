// src/pages/Review.jsx
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/Configurator.css";

function Review() {
  const location = useLocation();
  const navigate = useNavigate();
  const { instrument, selections, selectedAddOns, productCode } =
    location.state || {};

  if (!instrument) return <p>No configuration data found.</p>;

  const handleAddToCart = () => {
    const existingCart =
      JSON.parse(localStorage.getItem("selectedInstruments")) || [];

    const newInstrument = {
      instrument,
      selections,
      selectedAddOns,
      productCode,
    };

    const updatedCart = [...existingCart, newInstrument];
    localStorage.setItem("selectedInstruments", JSON.stringify(updatedCart));

    navigate("/selected-instruments");
  };

  return (
    <div className="configurator-page">
      <div className="configurator-header">
        <h2>Review Your Configuration</h2>
        <p className="description">{instrument.name}</p>
        <div className="product-code">Product Code: {productCode}</div>
      </div>

      <div className="config-form">
        <h3>Requirements Selected</h3>
        <ul>
          {Object.values(selections).map((selection, idx) => (
            <li key={idx}>
              [{selection.code}] {selection.label}
            </li>
          ))}
        </ul>

        <h3>Optional Add-Ons Selected</h3>
        <ul>
          {selectedAddOns.length > 0 ? (
            selectedAddOns.map((addon, idx) => (
              <li key={idx}>
                [{addon.code}] {addon.label} ({addon.addon_type.name})
              </li>
            ))
          ) : (
            <li>No Add-Ons selected.</li>
          )}
        </ul>

        <button className="next-button" onClick={handleAddToCart}>
          Add to Quotation
        </button>
      </div>
    </div>
  );
}

export default Review;
