import { useState } from "react";
import DonorSearch from "./DonorSearch";
import BloodTypeSelector from "./BloodTypeSelector";
import { recordDonation } from "../api/admin";

export default function RecordDonationForm({ centers, onRecorded }) {
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [form, setForm] = useState({
    regional_storage_center: centers[0]?.id ?? "",
    blood_type: "",
    units_donated: 1,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  function handleSelectDonor(donor) {
    setSelectedDonor(donor);
    setForm((f) => ({ ...f, blood_type: donor?.blood_type || f.blood_type }));
    setMessage("");
    setError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!selectedDonor) {
      setError("Select a donor first.");
      return;
    }
    if (!form.blood_type) {
      setError("Choose a blood type.");
      return;
    }
    setSubmitting(true);
    try {
      const donation = await recordDonation({
        donor: Number(selectedDonor.id),
        regional_storage_center: Number(form.regional_storage_center),
        blood_type: form.blood_type,
        units_donated: Number(form.units_donated),
      });
      setMessage(
        `Recorded: ${donation.donor_name} donated ${donation.units_donated} ${
          donation.units_donated === 1 ? "unit" : "units"
        } of ${donation.blood_type} at ${donation.regional_storage_center_name}.`
      );
      setSelectedDonor(null);
      setForm((f) => ({ ...f, blood_type: "", units_donated: 1 }));
      if (onRecorded) onRecorded(donation);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="page-panel request-form">
      <h2>Record a donation</h2>

      <label>Donor</label>
      <DonorSearch selected={selectedDonor} onSelect={handleSelectDonor} />

      <label htmlFor="donation-rsc">Blood centre</label>
      <select
        id="donation-rsc"
        value={form.regional_storage_center}
        onChange={(e) => setForm({ ...form, regional_storage_center: e.target.value })}
      >
        {centers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.region_name}
          </option>
        ))}
      </select>

      <label>Blood type donated</label>
      <BloodTypeSelector
        value={form.blood_type}
        onChange={(bt) => setForm({ ...form, blood_type: bt })}
        label="Blood type donated"
      />

      <label htmlFor="donation-units">Units donated</label>
      <input
        id="donation-units"
        type="number"
        min="1"
        value={form.units_donated}
        onChange={(e) => setForm({ ...form, units_donated: e.target.value })}
        required
      />

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <p>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Recording..." : "Record donation"}
        </button>
      </p>
    </form>
  );
}