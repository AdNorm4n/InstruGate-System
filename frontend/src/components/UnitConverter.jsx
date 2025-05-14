import { useState } from "react";

const UnitConverter = () => {
  const [value, setValue] = useState("");
  const [fromUnit, setFromUnit] = useState("psi");
  const [toUnit, setToUnit] = useState("bar");
  const [result, setResult] = useState(null);

  const convert = () => {
    let converted;
    if (fromUnit === "psi" && toUnit === "bar") {
      converted = value * 0.0689476;
    } else if (fromUnit === "bar" && toUnit === "psi") {
      converted = value * 14.5038;
    } else {
      converted = value; // Same unit
    }
    setResult(converted.toFixed(4));
  };

  return (
    <div className="tool-container">
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter value"
      />
      <select value={fromUnit} onChange={(e) => setFromUnit(e.target.value)}>
        <option value="psi">PSI</option>
        <option value="bar">Bar</option>
      </select>
      <select value={toUnit} onChange={(e) => setToUnit(e.target.value)}>
        <option value="psi">PSI</option>
        <option value="bar">Bar</option>
      </select>
      <button onClick={convert}>Convert</button>
      {result && (
        <p>
          {value} {fromUnit} = {result} {toUnit}
        </p>
      )}
    </div>
  );
};

export default UnitConverter;
