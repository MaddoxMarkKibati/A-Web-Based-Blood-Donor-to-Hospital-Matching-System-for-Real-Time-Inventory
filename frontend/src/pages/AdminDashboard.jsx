import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import DonorSearch from "../components/DonorSearch";
import BloodTypeCorrection from "../components/BloodTypeCorrection";
import { fetchRegionalStorageCenters } from "../api/hospitals";
import { fetchAllInventory, recordDonation, fetchThresholds } from "../api/admin";
import StockOverview from "../components/StockOverview";
import ThresholdEditor from "../components/ThresholdEditor";
import RequestMonitor from "../components/RequestMonitor";
import RecentDonations from "../components/RecentDonations";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [centers, setCenters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [donationsVersion, setDonationsVersion] = useState(0);

  const [form, setForm] = useState({
    donor: "",
    regional_storage_center: "",
    blood_type: "",
    units_donated: 1,
  });

  function loadData() {
    setLoading(true);
    Promise.all([fetchRegionalStorageCenters(), fetchAllInventory(), fetchThresholds()])
      .then(([c, i, t]) => {
        setCenters(c);
        setInventory(i);
        setThresholds(t);
        if (c.length > 0) {
          setForm((f) => ({
            ...f,
            regional_storage_center: f.regional_storage_center || c[0].id,
          }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

  function handleSelectDonor(donor) {
    setSelectedDonor(donor);
    setForm((f) => ({
      ...f,
      donor: donor ? donor.id : "",
      blood_type: donor?.blood_type || f.blood_type,
    }));
  }
  
  async function handleRecordDonation(e) {
    e.preventDefault();
    if (!form.donor) {
      setError("Select a donor first.");
      return;
    }
    setSubmitting(true);
    setError("");
    setMessage("");
    try {
      const donation = await recordDonation({
        ...form,
        donor: Number(form.donor),
        regional_storage_center: Number(form.regional_storage_center),
        units_donated: Number(form.units_donated),
      });
      setMessage(
        `Recorded: ${donation.donor_name} donated ${donation.units_donated} unit(s) of ${donation.blood_type} at ${donation.regional_storage_center_name}.`
      );
      setSelectedDonor(null);
      setForm((f) => ({ ...f, donor: "", blood_type: "" }));
      setDonationsVersion((v) => v + 1);
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleThresholdUpdated(updated) {
    setThresholds((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  const totalUnits = inventory.reduce((sum, i) => sum + i.units_available, 0);

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <header>
        <h1>KNBTS National Inventory Dashboard</h1>
        <div className="header-actions">
          <ThemeToggle />
          <button onClick={logout}>Log Out</button>
        </div>
      </header>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <section>
        <h2>Summary</h2>
        <p>Total Units Nationwide: {totalUnits}</p>
        <p>Regional Storage Centers: {centers.length}</p>
      </section>

      <StockOverview centers={centers} inventory={inventory} thresholds={thresholds} />

      <RequestMonitor />

      <section>
        <h2>Record Donation</h2>
        <form onSubmit={handleRecordDonation} className="auth-form">
          <label>Donor</label>
          <DonorSearch selected={selectedDonor} onSelect={handleSelectDonor} />

          <label htmlFor="rsc">Regional Storage Center</label>
          <select
            id="rsc"
            value={form.regional_storage_center}
            onChange={(e) => setForm({ ...form, regional_storage_center: e.target.value })}
          >
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.region_name}</option>
            ))}
          </select>

          <label htmlFor="blood_type">Blood Type</label>
          <select
            id="blood_type"
            value={form.blood_type}
            onChange={(e) => setForm({ ...form, blood_type: e.target.value })}
            required
          >
            <option value="">Select...</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>

          <label htmlFor="units">Units Donated</label>
          <input
            id="units"
            type="number"
            min="1"
            value={form.units_donated}
            onChange={(e) => setForm({ ...form, units_donated: e.target.value })}
            required
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Recording..." : "Record Donation"}
          </button>
        </form>
      </section>

      <RecentDonations refreshKey={donationsVersion} />

      <ThresholdEditor thresholds={thresholds} onUpdated={handleThresholdUpdated} />

      <BloodTypeCorrection />
    </div>
  );
}