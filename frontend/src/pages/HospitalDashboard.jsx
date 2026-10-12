import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import {
  fetchMyStaffProfile,
  fetchRegionalStorageCenters,
  fetchInventory,
  fetchMyRequests,
  createRequest,
} from "../api/hospitals";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function HospitalDashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [centers, setCenters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    regional_storage_center: "",
    blood_type: "",
    units_needed: 1,
    urgency_level: "standard",
  });

  useEffect(() => {
    Promise.all([fetchMyStaffProfile(), fetchRegionalStorageCenters(), fetchMyRequests()])
      .then(([p, c, r]) => {
        setProfile(p);
        setCenters(c);
        setRequests(r);
        if (c.length > 0) {
          setForm((f) => ({ ...f, regional_storage_center: c[0].id }));
          return fetchInventory(c[0].id).then(setInventory);
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleCenterChange(id) {
    setForm({ ...form, regional_storage_center: id });
    try {
      const inv = await fetchInventory(id);
      setInventory(inv);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const newRequest = await createRequest(form);
      setRequests([newRequest, ...requests]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <header>
        <h1>Staff Dashboard — {profile.hospital_name || "No hospital assigned"}</h1>
        <p>Logged in as: {profile.name}</p>
        <div className="header-actions">
          <ThemeToggle />
          <button onClick={logout}>Log Out</button>
        </div>
      </header>

      {error && <p className="auth-error">{error}</p>}

      <section>
        <h2>Submit Blood Request to Regional Storage Center</h2>
        <form onSubmit={handleSubmit} className="auth-form">
          <label htmlFor="rsc">Regional Storage Center</label>
          <select
            id="rsc"
            value={form.regional_storage_center}
            onChange={(e) => handleCenterChange(e.target.value)}
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

          <label htmlFor="units">Units Needed</label>
          <input
            id="units"
            type="number"
            min="1"
            value={form.units_needed}
            onChange={(e) => setForm({ ...form, units_needed: Number(e.target.value) })}
            required
          />

          <label htmlFor="urgency">Urgency</label>
          <select
            id="urgency"
            value={form.urgency_level}
            onChange={(e) => setForm({ ...form, urgency_level: e.target.value })}
          >
            <option value="standard">Standard</option>
            <option value="critical">Critical</option>
          </select>

          <button type="submit" disabled={submitting}>
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </form>
      </section>

      <section>
        <h2>Regional Storage Center Inventory</h2>
        {inventory.length === 0 && <p>No inventory data for this center yet.</p>}
        <ul>
          {inventory.map((i) => (
            <li key={i.id}>
              {i.blood_type} — {i.units_available} units
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>My Submitted Requests</h2>
        {requests.length === 0 && <p>No requests submitted yet.</p>}
        <ul>
          {requests.map((r) => (
            <li key={r.id}>
              {r.blood_type} x{r.units_needed} — {r.urgency_level} — {r.status} — {r.regional_storage_center_name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}