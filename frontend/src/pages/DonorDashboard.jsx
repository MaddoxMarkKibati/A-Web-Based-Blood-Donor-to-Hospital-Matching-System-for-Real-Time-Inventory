import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  fetchMyProfile,
  updateMyProfile,
  fetchMyDonations,
  fetchMyNotifications,
} from "../api/donors";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorDashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchMyProfile(), fetchMyDonations(), fetchMyNotifications()])
      .then(([p, d, n]) => {
        setProfile(p);
        setDonations(d);
        setNotifications(n);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const updated = await updateMyProfile({
        name: profile.name,
        phone: profile.phone,
        blood_type: profile.blood_type,
      });
      setProfile(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <header>
        <h1>Donor Portal</h1>
        <button onClick={logout}>Log Out</button>
      </header>

      {error && <p className="auth-error">{error}</p>}

      <section>
        <h2>My Profile</h2>
        <form onSubmit={handleSave} className="auth-form">
          <label htmlFor="name">Full Name</label>
          <input
            id="name"
            value={profile.name}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
          />

          <label htmlFor="blood_type">Blood Type</label>
          <select
            id="blood_type"
            value={profile.blood_type}
            onChange={(e) => setProfile({ ...profile, blood_type: e.target.value })}
          >
            <option value="">Select...</option>
            {BLOOD_TYPES.map((bt) => (
              <option key={bt} value={bt}>{bt}</option>
            ))}
          </select>

          <label htmlFor="phone">Phone Number</label>
          <input
            id="phone"
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      <section>
        <h2>Recent Alerts</h2>
        {notifications.length === 0 && <p>No alerts yet.</p>}
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>
              {n.message_type || "Alert"} — {n.status} ({new Date(n.date).toLocaleDateString()})
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>My Donation History</h2>
        {donations.length === 0 && <p>No donations recorded yet.</p>}
        <ul>
          {donations.map((d) => (
            <li key={d.id}>
              {new Date(d.donation_date).toLocaleDateString()} — {d.blood_type}, {d.units_donated} unit(s) at {d.regional_storage_center_name}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}