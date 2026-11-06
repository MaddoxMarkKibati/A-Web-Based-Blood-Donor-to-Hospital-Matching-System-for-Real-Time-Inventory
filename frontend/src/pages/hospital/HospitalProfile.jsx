import { useEffect, useState } from "react";
import LocationPicker from "../../components/LocationPicker";
import Skeleton from "../../components/Skeleton";
import { fetchMyHospital, updateMyHospital } from "../../api/hospitals";

export default function HospitalProfile() {
  const [hospital, setHospital] = useState(null);
  const [pin, setPin] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchMyHospital()
      .then((h) => {
        setHospital(h);
        if (h.location) {
          setPin({
            lat: String(h.location.coordinates[1]),
            lng: String(h.location.coordinates[0]),
          });
        }
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setError("");
    setMessage("");
    setSaving(true);
    try {
      const updated = await updateMyHospital({
        location: { type: "Point", coordinates: [Number(pin.lng), Number(pin.lat)] },
      });
      setHospital(updated);
      setMessage("Hospital location saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <h1>Hospital</h1>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}
      {loading && <Skeleton />}

      {!loading && hospital && (
        <>
          <section className="page-panel request-form">
            <h2>{hospital.name}</h2>
            <p>{hospital.address}</p>
            {hospital.contact_info && <p>{hospital.contact_info}</p>}
          </section>

          <section className="page-panel">
            <h2>Hospital location</h2>
            <p>
              Donors who accept an alert get directions to this pin. Place it at the entrance or
              blood bank where donors should go.
            </p>
            <LocationPicker
              lat={pin.lat}
              lng={pin.lng}
              onChange={({ lat, lng }) => setPin({ lat, lng })}
            />
            <p>
              <button
                type="button"
                className="btn-primary"
                disabled={saving || pin.lat === ""}
                onClick={handleSave}
              >
                {saving ? "Saving..." : "Save location"}
              </button>
            </p>
          </section>
        </>
      )}
    </div>
  );
}