import { useState } from "react";
import DonorSearch from "./DonorSearch";
import BloodTypeSelector from "./BloodTypeSelector";
import { correctDonorBloodType } from "../api/hospitals";

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
    <section className="page-panel request-form">
      <h2>Correct a donor's blood type</h2>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <DonorSearch selected={selected} onSelect={handleSelect} />

      {selected && (
        <form onSubmit={handleSubmit}>
          <label>New blood type</label>
          <BloodTypeSelector value={newType} onChange={setNewType} label="New blood type" />
          <p>
            <button
              type="submit"
              className="btn-primary"
              disabled={saving || !newType || newType === selected.blood_type}
            >
              {saving ? "Saving..." : "Update blood type"}
            </button>
          </p>
        </form>
      )}
    </section>
  );
}