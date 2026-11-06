import { useEffect, useState } from "react";
import BloodTypeTag from "./BloodTypeTag";
import Skeleton from "./Skeleton";
import { fetchMyHospitalInventory } from "../api/hospitals";
import { BLOOD_TYPES } from "../utils/stock";

export default function OwnStock() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyHospitalInventory()
      .then(setItems)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const units = Object.fromEntries(items.map((i) => [i.blood_type, i.units_available]));
  const total = items.reduce((sum, i) => sum + i.units_available, 0);

  return (
    <section className="own-stock">
      <h2>Your hospital's stock</h2>
      <p>Units from donations your staff have recorded at this hospital.</p>
      {loading && <Skeleton lines={2} />}
      {error && <p className="auth-error">{error}</p>}
      {!loading && !error && (
        <>
          <div className="own-stock-grid">
            {BLOOD_TYPES.map((bt) => (
              <div key={bt} className="own-stock-cell">
                <BloodTypeTag type={bt} size="md" />
                <span className="own-stock-units">{units[bt] ?? 0}</span>
                <span className="own-stock-label">{(units[bt] ?? 0) === 1 ? "unit" : "units"}</span>
              </div>
            ))}
          </div>
          <p className="own-stock-total">
            {total} {total === 1 ? "unit" : "units"} in total.
          </p>
        </>
      )}
    </section>
  );
}