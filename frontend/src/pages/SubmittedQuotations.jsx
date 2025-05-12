// SubmittedQuotations.jsx
import React, { useEffect, useState } from "react";
import api from "../api";

function SubmittedQuotations() {
  const [quotations, setQuotations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get("/api/quotations/submitted/")
      .then((response) => {
        setQuotations(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch submitted quotations.");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Submitted Quotations</h1>
      {quotations.length === 0 ? (
        <p>No quotations submitted yet.</p>
      ) : (
        <div className="space-y-4">
          {quotations.map((quotation) => (
            <div key={quotation.id} className="border p-4 rounded shadow">
              <div className="font-bold">Quotation #{quotation.id}</div>
              <div className="text-sm text-gray-600">
                Submitted at:{" "}
                {new Date(quotation.submitted_at).toLocaleString()}
              </div>
              <div className="mt-2">
                <h4 className="font-medium">Items:</h4>
                <ul className="list-disc ml-5">
                  {quotation.items.map((item, index) => (
                    <li key={index}>
                      <strong>Product Code:</strong> {item.product_code} <br />
                      <strong>Instrument:</strong> {item.instrument}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SubmittedQuotations;
