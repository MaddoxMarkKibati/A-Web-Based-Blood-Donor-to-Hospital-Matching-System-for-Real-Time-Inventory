import { useEffect, useState } from "react";
import StockOverview from "../../components/StockOverview";
import {
  fetchRegionalStorageCenters,
  fetchInventory,
  fetchReserveThresholds,
} from "../../api/hospitals";

export default function HospitalStock() {
  const [centers, setCenters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchRegionalStorageCenters().then(setCenters),
      fetchInventory().then(setInventory),
      fetchReserveThresholds().then(setThresholds),
    ])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Stock</h1>
      <p>
        These figures show national blood stock held by KNBTS across all regional
        centres, not the stock of a single hospital. Reserve minimums are set by KNBTS.
      </p>
      {error && <p className="auth-error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && (
        <StockOverview centers={centers} inventory={inventory} thresholds={thresholds} />
      )}
    </div>
  );
}