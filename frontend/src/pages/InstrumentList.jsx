// src/pages/InstrumentList.jsx
import React, { useEffect, useState } from "react";
import api from "../api";
import InstrumentCard from "../components/InstrumentCard";
import "../styles/InstrumentList.css";

const InstrumentList = () => {
  const [groupedData, setGroupedData] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedType, setSelectedType] = useState(null);

  useEffect(() => {
    api.get("/api/instruments/").then((res) => {
      const instruments = res.data.filter((i) => i.is_available);
      const group = {};
      instruments.forEach((instrument) => {
        const category = instrument.type.category.name;
        const type = instrument.type.name;

        if (!group[category]) group[category] = {};
        if (!group[category][type]) group[category][type] = [];
        group[category][type].push(instrument);
      });
      setGroupedData(group);
    });
  }, []);

  return (
    <div className="instrument-list-container">
      <h1>Browse Instruments</h1>

      <div className="category-buttons">
        {Object.keys(groupedData).map((category) => (
          <button
            key={category}
            onClick={() => {
              setSelectedCategory(category);
              setSelectedType(null);
            }}
            className={selectedCategory === category ? "active" : ""}
          >
            {category}
          </button>
        ))}
      </div>

      {selectedCategory && (
        <div className="type-buttons">
          {Object.keys(groupedData[selectedCategory]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={selectedType === type ? "active" : ""}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      <div className="instrument-grid">
        {selectedCategory &&
          selectedType &&
          groupedData[selectedCategory][selectedType].map((instrument) => (
            <InstrumentCard key={instrument.id} instrument={instrument} />
          ))}
      </div>
    </div>
  );
};

export default InstrumentList;
