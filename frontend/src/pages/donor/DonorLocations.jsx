import EmptyState from "../../components/EmptyState";
import { useEffect, useState } from "react";
import LocationPicker from "../../components/LocationPicker";
import { fetchMyLocations, createLocation, deleteLocation } from "../../api/donors";
import Skeleton from "../../components/Skeleton";

const MAX_FREQUENT = 2;
const MAX_LIVE = 1;
const TYPE_LABEL = { frequent: "Frequent", live: "Live (current)" };

export default function DonorLocations() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ label: "", lat: "", lng: "", location_type: "frequent" });

  async function reload() {
    try {
      setLocations(await fetchMyLocations());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const frequentCount = locations.filter((l) => l.location_type === "frequent").length;
  const liveCount = locations.filter((l) => l.location_type === "live").length;
  const availableTypes = [
    ...(frequentCount < MAX_FREQUENT ? ["frequent"] : []),
    ...(liveCount < MAX_LIVE ? ["live"] : []),
  ];
  const selectedType = availableTypes.includes(form.location_type)
    ? form.location_type
    : availableTypes[0];

  const first = locations[0];
  const mapCenter = first ? [first.point.coordinates[1], first.point.coordinates[0]] : undefined;

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (form.lat === "" || form.lng === "") {
      setError("Tap the map or search for a place to set your pin first.");
      return;
    }
    setSaving(true);
    try {
      await createLocation({
        label: form.label,
        point: { type: "Point", coordinates: [Number(form.lng), Number(form.lat)] },
        location_type: selectedType,
      });
      setForm({ label: "", lat: "", lng: "", location_type: "frequent" });
      setMessage("Location saved.");
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(location) {
    if (!window.confirm(`Remove "${location.label}"?`)) return;
    setError("");
    setMessage("");
    try {
      await deleteLocation(location.id);
      setMessage("Location removed.");
      await reload();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <h1>My locations</h1>
      <p>
        Hospitals find donors within 25 km of a blood centre using these places. Save up to
        two places you visit often, and one optional live location.
      </p>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <h2>Saved places</h2>
      {loading && <Skeleton />}
      {!loading && locations.length === 0 && (
        <EmptyState title="No saved places yet">
          Add one below so hospitals near you can find you.
        </EmptyState>
      )}
      <p className="location-usage">
        Frequent: {frequentCount} of {MAX_FREQUENT}. Live: {liveCount} of {MAX_LIVE}.
      </p>
      <ul className="location-list">
        {locations.map((loc) => (
          <li key={loc.id} className="location-item">
            <div>
              <strong>{loc.label}</strong>
              <span className="location-type">{TYPE_LABEL[loc.location_type]}</span>
              <span className="location-coords">
                {loc.point.coordinates[1].toFixed(4)}, {loc.point.coordinates[0].toFixed(4)}
              </span>
            </div>
            <button type="button" onClick={() => handleRemove(loc)}>
              Remove
            </button>
          </li>
        ))}
      </ul>

      <h2>Add a place</h2>
      {availableTypes.length === 0 ? (
        <p>
          You have used all your saved places. To add a different one, remove an existing place
          first.
        </p>
      ) : (
        <form onSubmit={handleAdd} className="page-panel location-form">
          <label htmlFor="loc_label">Name</label>
          <input
            id="loc_label"
            placeholder="For example Home, Campus or Workplace"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
          />

          <label htmlFor="loc_type">Type</label>
          <select
            id="loc_type"
            value={selectedType}
            onChange={(e) => setForm({ ...form, location_type: e.target.value })}
          >
            <option value="frequent" disabled={frequentCount >= MAX_FREQUENT}>
              Frequent (a place you visit often)
            </option>
            <option value="live" disabled={liveCount >= MAX_LIVE}>
              Live (where you are now, optional)
            </option>
          </select>

          <label>Pin the place on the map</label>
          <LocationPicker
            lat={form.lat}
            lng={form.lng}
            center={mapCenter}
            onChange={({ lat, lng }) => setForm((f) => ({ ...f, lat, lng }))}
          />

          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save location"}
          </button>
        </form>
      )}
      <p className="location-usage">
        Editing a place is not available yet. To change one, remove it and add it again.
      </p>
    </div>
  );
}