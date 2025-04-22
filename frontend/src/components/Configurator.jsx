// src/pages/Configurator.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import "../styles/Configurator.css";

function Configurator() {
  const { instrumentId } = useParams();
  const [instrument, setInstrument] = useState(null);
  const [selections, setSelections] = useState({});
  const [codeSegments, setCodeSegments] = useState([]);

  useEffect(() => {
    api
      .get(`/api/instruments/${instrumentId}/config/`)
      .then((res) => {
        setInstrument(res.data);
      })
      .catch(() => alert("Failed to load configurator"));
  }, [instrumentId]);

  const handleSelect = (fieldId, option) => {
    setSelections((prev) => ({ ...prev, [fieldId]: option }));
  };

  const shouldShowField = (field) => {
    if (!field.parent_field) return true;
    const selected = selections[field.parent_field]; // parent_field is an ID
    return selected?.code === field.trigger_value;
  };

  useEffect(() => {
    if (!instrument?.fields) return;
    const codes = instrument.fields.filter(shouldShowField).map((f) => {
      const selected = selections[f.id];
      return selected ? `[${selected.code}]` : "[]";
    });
    setCodeSegments(codes);
  }, [selections, instrument]);

  if (!instrument) return <p>Loading...</p>;

  return (
    <div className="configurator-page">
      <div className="configurator-header">
        <h2>{instrument.name} Configurator</h2>
        <p className="description">{instrument.description}</p>
        <div className="product-code">
          Product Code: {codeSegments.join("")}
        </div>
      </div>

      <div className="config-form">
        {instrument.fields
          .filter(shouldShowField)
          .sort((a, b) => a.order - b.order)
          .map((field) => (
            <div className="config-field" key={field.id}>
              <label>{field.name}</label>
              <select
                value={selections[field.id]?.id || ""}
                onChange={(e) => {
                  const opt = field.options.find(
                    (o) => o.id.toString() === e.target.value
                  );
                  handleSelect(field.id, opt);
                }}
              >
                <option value="">-- Select --</option>
                {field.options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    [{opt.code}] {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
      </div>

      <button className="next-button">Next</button>
    </div>
  );
}

export default Configurator;
