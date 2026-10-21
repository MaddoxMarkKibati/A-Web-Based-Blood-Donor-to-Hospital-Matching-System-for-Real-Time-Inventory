import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "../components/ThemeToggle";
import {
  fetchMyProfile,
  updateMyProfile,
  fetchMyDonations,
  fetchMyNotifications,
  fetchMyLocations,
  createLocation,
  updateLocation,
  deleteLocation,
} from "../api/donors";

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const GENDERS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export default function DonorDashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [donations, setDonations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const [locationForm, setLocationForm] = useState({
    label: "",
    lat: "",
    lng: "",
    location_type: "frequent",
  });
  const [addingLocation, setAddingLocation] = useState(false);

  function loadAll() {
    setLoading(true);
    Promise.all([
      fetchMyProfile(),
      fetchMyDonations(),
      fetchMyNotifications(),
      fetchMyLocations(),
    ])
      .then(([p, d, n, l]) => {
        setProfile(p);
        setDonations(d);
        setNotifications(n);
        setLocations(l);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(loadAll, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateMyProfile({
        first_name: profile.first_name,
        middle_names: profile.middle_names,
        last_name: profile.last_name,
        phone: profile.phone,
        blood_type: profile.blood_type,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender,
        weight_kg: profile.weight_kg || null,
        height_cm: profile.height_cm || null,
        national_id: profile.national_id || null,
      });
      setProfile(updated);
      setMessage("Profile saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAddLocation(e) {
    e.preventDefault();
    setAddingLocation(true);
    setError("");
    try {
      await createLocation({
        label: locationForm.label,
        point: {
          type: "Point",
          coordinates: [Number(locationForm.lng), Number(locationForm.lat)],
        },
        location_type: locationForm.location_type,
      });
      setLocationForm({ label: "", lat: "", lng: "", location_type: "frequent" });
      loadAll();
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingLocation(false);
    }
  }

  async function handleDeleteLocation(id) {
    setError("");
    try {
      await deleteLocation(id);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleUseMyLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationForm((f) => ({
          ...f,
          lat: pos.coords.latitude.toFixed(6),
          lng: pos.coords.longitude.toFixed(6),
        }));
      },
      () => setError("Could not get your current location.")
    );
  }

  if (loading) return <p>Loading...</p>;

  const frequentCount = locations.filter((l) => l.location_type === "frequent").length;
  const liveCount = locations.filter((l) => l.location_type === "live").length;
  const bloodTypeLocked = Boolean(profile.blood_type);

  return (
    <div className="dashboard">
      <header>
        <h1>Donor Portal</h1>
        <div className="header-actions">
          <ThemeToggle />
          <button onClick={logout}>Log Out</button>
        </div>
      </header>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <section>
        <h2>My Profile</h2>
        <form onSubmit={handleSaveProfile} className="auth-form">
          <label htmlFor="first_name">First Name</label>
          <input
            id="first_name"
            value={profile.first_name}
            onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
          />

          <label htmlFor="middle_names">Middle Name(s)</label>
          <input
            id="middle_names"
            value={profile.middle_names}
            onChange={(e) => setProfile({ ...profile, middle_names: e.target.value })}
          />

          <label htmlFor="last_name">Last Name</label>
          <input
            id="last_name"
            value={profile.last_name}
            onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
          />

          <label htmlFor="blood_type">
            Blood Type {bloodTypeLocked && "(locked — contact staff to change)"}
          </label>
          <select
            id="blood_type"
            value={profile.blood_type}
            onChange={(e) => setProfile({ ...profile, blood_type: e.target.value })}
            disabled={bloodTypeLocked}
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

          <label htmlFor="date_of_birth">Date of Birth</label>
          <input
            id="date_of_birth"
            type="date"
            value={profile.date_of_birth || ""}
            onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })}
          />

          <label htmlFor="gender">Gender</label>
          <select
            id="gender"
            value={profile.gender}
            onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
          >
            <option value="">Select...</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>

          <label htmlFor="weight_kg">Weight (kg)</label>
          <input
            id="weight_kg"
            type="number"
            step="0.1"
            value={profile.weight_kg || ""}
            onChange={(e) => setProfile({ ...profile, weight_kg: e.target.value })}
          />

          <label htmlFor="height_cm">Height (cm)</label>
          <input
            id="height_cm"
            type="number"
            step="0.1"
            value={profile.height_cm || ""}
            onChange={(e) => setProfile({ ...profile, height_cm: e.target.value })}
          />

          <label htmlFor="national_id">National ID</label>
          <input
            id="national_id"
            value={profile.national_id || ""}
            onChange={(e) => setProfile({ ...profile, national_id: e.target.value })}
          />

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      </section>

      <section>
        <h2>My Locations</h2>
        <p>
          Frequent locations: {frequentCount}/2 used. Live location: {liveCount}/1 used.
        </p>
        <ul>
          {locations.map((loc) => (
            <li key={loc.id}>
              <strong>{loc.label}</strong> ({loc.location_type}) —{" "}
              {loc.point.coordinates[1].toFixed(4)}, {loc.point.coordinates[0].toFixed(4)}{" "}
              <button onClick={() => handleDeleteLocation(loc.id)}>Remove</button>
            </li>
          ))}
        </ul>

        <form onSubmit={handleAddLocation} className="auth-form">
          <label htmlFor="loc_label">Label</label>
          <input
            id="loc_label"
            placeholder="e.g. Home, Campus, Workplace"
            value={locationForm.label}
            onChange={(e) => setLocationForm({ ...locationForm, label: e.target.value })}
            required
          />

          <label htmlFor="loc_type">Type</label>
          <select
            id="loc_type"
            value={locationForm.location_type}
            onChange={(e) => setLocationForm({ ...locationForm, location_type: e.target.value })}
          >
            <option value="frequent">Frequent (up to 2)</option>
            <option value="live">Live / Current (up to 1, optional)</option>
          </select>

          <label htmlFor="loc_lat">Latitude</label>
          <input
            id="loc_lat"
            type="number"
            step="any"
            value={locationForm.lat}
            onChange={(e) => setLocationForm({ ...locationForm, lat: e.target.value })}
            required
          />

          <label htmlFor="loc_lng">Longitude</label>
          <input
            id="loc_lng"
            type="number"
            step="any"
            value={locationForm.lng}
            onChange={(e) => setLocationForm({ ...locationForm, lng: e.target.value })}
            required
          />

          <button type="button" onClick={handleUseMyLocation}>
            Use My Current Location
          </button>
          <button type="submit" disabled={addingLocation}>
            {addingLocation ? "Adding..." : "Add Location"}
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