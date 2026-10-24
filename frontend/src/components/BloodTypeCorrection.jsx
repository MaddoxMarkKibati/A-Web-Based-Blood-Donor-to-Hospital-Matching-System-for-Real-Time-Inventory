import { useState } from "react";
import DonorSearch from "./DonorSearch";
import { correctDonorBloodType } from "../api/hospitals";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BloodTypeCorrection() {
  const [selected, setSelected] = useState(null);
  const [newType, setNewType] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function handleSelect(donor) {
    setSelected(donor);
    setNewType(donor?.blood_type || "");
    setMessage("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await correctDonorBloodType(selected.id, newType);
      setSelected({ ...selected, blood_type: updated.blood_type });
      setMessage(
        `Blood type for ${selected.full_name || `Donor #${selected.id}`} set to ${updated.blood_type}.`
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h2>Correct Donor Blood Type</h2>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <DonorSearch selected={selected} onSelect={handleSelect} />

      {selected && (
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="correct_blood_type">New blood type</label>
          <select
            id="correct_blood_type"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            required
          >
            <option value="">Select...</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>
          <button type="submit" disabled={saving || newType === selected.blood_type}>
            {saving ? "Saving..." : "Update"}
          </button>
        </form>
      )}
    </section>
  );
}