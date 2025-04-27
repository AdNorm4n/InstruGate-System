// src/pages/Configurator.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import "../styles/Configurator.css";

function Configurator() {
  const { instrumentId } = useParams();
  const navigate = useNavigate();
  const [instrument, setInstrument] = useState(null);
  const [fields, setFields] = useState([]);
  const [addons, setAddons] = useState([]);
  const [selections, setSelections] = useState({});
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [showAddOns, setShowAddOns] = useState(false);
  const [codeSegments, setCodeSegments] = useState([]);

  useEffect(() => {
    api
      .get(`/api/instruments/${instrumentId}/config/`)
      .then((res) => {
        setInstrument(res.data);
        setFields(res.data.fields || []);
      })
      .catch(() => alert("Failed to load configurator"));
  }, [instrumentId]);

  useEffect(() => {
    if (showAddOns) {
      api
        .get(`/api/instruments/${instrumentId}/addons/`)
        .then((res) => setAddons(res.data))
        .catch(() => alert("Failed to load add-ons"));
    }
  }, [instrumentId, showAddOns]);

  const handleSelect = (fieldId, option) => {
    setSelections((prev) => ({ ...prev, [fieldId]: option }));
  };

  const handleAddOnToggle = (addon) => {
    setSelectedAddOns((prev) =>
      prev.includes(addon) ? prev.filter((a) => a !== addon) : [...prev, addon]
    );
  };

  const shouldShowField = (field) => {
    if (!field.parent_field) return true;
    const selected = selections[field.parent_field];
    return selected?.code === field.trigger_value;
  };

  useEffect(() => {
    const codes = fields.filter(shouldShowField).map((f) => {
      const selected = selections[f.id];
      return selected ? `[${selected.code}]` : "[]";
    });
    const addonCodes = selectedAddOns.map((a) => a.code).join("");
    if (addonCodes) codes.push(`[${addonCodes}]`);
    setCodeSegments(codes);
  }, [fields, selections, selectedAddOns]);

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

      {!showAddOns ? (
        <div className="config-form">
          {fields
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
          <button className="next-button" onClick={() => setShowAddOns(true)}>
            Next
          </button>
        </div>
      ) : (
        <div className="addons-section">
          <h3>Optional Add-Ons</h3>
          {addons.length > 0 ? (
            addons.map((addon) => (
              <label key={addon.id} className="addon-checkbox">
                <input
                  type="checkbox"
                  value={addon.id}
                  onChange={() => handleAddOnToggle(addon)}
                  checked={selectedAddOns.includes(addon)}
                />
                [{addon.code}] {addon.label} ({addon.addon_type.name})
              </label>
            ))
          ) : (
            <p>No add-ons available for this instrument.</p>
          )}
          <button
            className="next-button"
            onClick={() =>
              navigate(`/instruments/${instrumentId}/review`, {
                state: {
                  instrument,
                  selections,
                  selectedAddOns,
                  productCode: codeSegments.join(""),
                },
              })
            }
          >
            Next - Review
          </button>
        </div>
      )}
    </div>
  );
}

export default Configurator;
