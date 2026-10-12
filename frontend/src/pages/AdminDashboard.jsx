import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import { fetchRegionalStorageCenters } from "../api/hospitals";
import { fetchAllInventory, recordDonation } from "../api/admin";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function AdminDashboard() {
  const { logout } = useAuth();
  const [centers, setCenters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [filterBloodType, setFilterBloodType] = useState("");
  const [filterCounty, setFilterCounty] = useState("");

  const [form, setForm] = useState({
    donor: "",
    regional_storage_center: "",
    blood_type: "",
    units_donated: 1,
  });

  function loadData() {
    setLoading(true);
    Promise.all([fetchRegionalStorageCenters(), fetchAllInventory()])
      .then(([c, i]) => {
        setCenters(c);
        setInventory(i);
        if (c.length > 0) {
          setForm((f) => ({ ...f, regional_storage_center: c[0].id }));
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadData, []);

  async function handleRecordDonation(e) {
    e.preventDefault();
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
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const totalUnits = inventory.reduce((sum, i) => sum + i.units_available, 0);

  const filteredInventory = inventory.filter((i) => {
    if (filterBloodType && i.blood_type !== filterBloodType) return false;
    if (filterCounty) {
      const center = centers.find((c) => c.id === i.regional_storage_center);
      if (!center || center.county !== filterCounty) return false;
    }
    return true;
  });

  const counties = [...new Set(centers.map((c) => c.county))];

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

      <section>
        <h2>Filter by Blood Type / County</h2>
        <select value={filterBloodType} onChange={(e) => setFilterBloodType(e.target.value)}>
          <option value="">All blood types</option>
          {BLOOD_TYPES.map((bt) => (
            <option key={bt} value={bt}>{bt}</option>
          ))}
        </select>
        <select value={filterCounty} onChange={(e) => setFilterCounty(e.target.value)}>
          <option value="">All counties</option>
          {counties.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </section>

      <section>
        <h2>Stock by Region</h2>
        {filteredInventory.length === 0 && <p>No matching inventory records.</p>}
        <ul>
          {filteredInventory.map((i) => (
            <li key={i.id}>
              {i.regional_storage_center_name} — {i.blood_type}: {i.units_available} units
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Record Donation</h2>
        <form onSubmit={handleRecordDonation} className="auth-form">
          <label htmlFor="donor">Donor ID</label>
          <input
            id="donor"
            type="number"
            value={form.donor}
            onChange={(e) => setForm({ ...form, donor: e.target.value })}
            required
          />

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
    </div>
  );
}