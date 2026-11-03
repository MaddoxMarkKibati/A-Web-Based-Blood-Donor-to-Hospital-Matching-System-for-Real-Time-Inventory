import { useState } from "react";
import { updateThreshold } from "../api/admin";

export default function ThresholdEditor({ thresholds, onUpdated }) {
  const [values, setValues] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSave(threshold) {
    const raw = values[threshold.id];
    const number = Number(raw);
    if (raw === "" || !Number.isInteger(number) || number < 0) {
      setError("Enter a whole number of 0 or more.");
      return;
    }
    setSavingId(threshold.id);
    setError("");
    setMessage("");
    try {
      const updated = await updateThreshold(threshold.id, number);
      onUpdated(updated);
      setMessage(`${updated.blood_type} minimum set to ${updated.minimum_units}.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <section>
      <h2>Reserve Minimums</h2>
      <p>
        The minimum national units for each blood type. Stock below the minimum is
        Low, and below half of it is Critical.
      </p>
      <div className="threshold-grid">
        {thresholds.map((t) => {
          const current = values[t.id] ?? String(t.minimum_units);
          return (
            <div className="threshold-row" key={t.id}>
              <label htmlFor={`threshold-${t.id}`}>{t.blood_type}</label>
              <input
                id={`threshold-${t.id}`}
                type="number"
                min="0"
                step="1"
                value={current}
                onChange={(e) => setValues({ ...values, [t.id]: e.target.value })}
              />
              <button
                type="button"
                disabled={savingId === t.id || current === String(t.minimum_units)}
                onClick={() => handleSave(t)}
              >
                {savingId === t.id ? "Saving..." : "Save"}
              </button>
            </div>
          );
        })}
      </div>
      {message && <p className="auth-success">{message}</p>}
      {error && <p className="auth-error">{error}</p>}
    </section>
  );
}