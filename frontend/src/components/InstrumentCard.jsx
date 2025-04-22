// ✅ src/components/InstrumentCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/InstrumentCard.css";

const InstrumentCard = ({ instrument }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/instruments/${instrument.id}/config`);
  };

  return (
    <div className="instrument-card" onClick={handleClick}>
      {instrument.image && <img src={instrument.image} alt={instrument.name} />}
      <h3>{instrument.name}</h3>
      <p>
        <strong>Description:</strong> {instrument.description}
      </p>
      <p>
        <strong>Specs:</strong> {instrument.specifications}
      </p>
    </div>
  );
};

export default InstrumentCard;
