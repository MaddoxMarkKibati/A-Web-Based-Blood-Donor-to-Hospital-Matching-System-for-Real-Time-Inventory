import { useState } from "react";
import BloodTypeSelector from "./BloodTypeSelector";
import { createRequest } from "../api/hospitals";

export default function NewRequestForm({ centers, onCreated }) {
  const [form, setForm] = useState({
    regional_storage_center: centers[0]?.id ?? "",
    blood_type: "",
    units_needed: 1,
    urgency_level: "standard",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!form.blood_type) {
      setError("Choose a blood type.");
      return;
    }
    setSubmitting(true);
    try {
      const request = await createRequest({
        ...form,
        regional_storage_center: Number(form.regional_storage_center),
        units_needed: Number(form.units_needed),
      });
      const alerted = request.alerted_count ?? 0;
      setMessage(
        alerted > 0
          ? `Request posted. ${alerted} ${alerted === 1 ? "donor was" : "donors were"} alerted.`
          : "Request posted. No eligible donor within 25 km of this centre was found, so nobody was alerted."
      );
      setForm((f) => ({ ...f, blood_type: "", units_needed: 1 }));
      if (onCreated) onCreated(request);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="page-panel request-form">
      <h2>New request</h2>

      <label htmlFor="rsc">Blood centre</label>
      <select
        id="rsc"
        value={form.regional_storage_center}
        onChange={(e) => setForm({ ...form, regional_storage_center: e.target.value })}
      >
        {centers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.region_name}
          </option>
        ))}
      </select>

      <label>Blood type needed</label>
      <BloodTypeSelector value={form.blood_type} onChange={(bt) => setForm({ ...form, blood_type: bt })} />

      <label htmlFor="units">Units needed</label>
      <input
        id="units"
        type="number"
        min="1"
        value={form.units_needed}
        onChange={(e) => setForm({ ...form, units_needed: e.target.value })}
        required
      />

      <label>Urgency</label>
      <div role="radiogroup" aria-label="Urgency" className="segmented">
        <button
          type="button"
          role="radio"
          aria-checked={form.urgency_level === "standard"}
          onClick={() => setForm({ ...form, urgency_level: "standard" })}
        >
          Standard
        </button>
        <button
          type="button"
          role="radio"
          className="is-critical"
          aria-checked={form.urgency_level === "critical"}
          onClick={() => setForm({ ...form, urgency_level: "critical" })}
        >
          Critical
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <p>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Posting..." : "Post request"}
        </button>
      </p>
    </form>
  );
}