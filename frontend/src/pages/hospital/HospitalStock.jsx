import { useEffect, useState } from "react";
import OwnStock from "../../components/OwnStock";
import StockOverview from "../../components/StockOverview";
import Skeleton from "../../components/Skeleton";
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

      <OwnStock />

      <p className="own-stock-bridge">
        The figures below are national blood stock held by KNBTS across all regional centres,
        not the stock of a single hospital. Reserve minimums are set by KNBTS.
      </p>
      {error && <p className="auth-error">{error}</p>}
      {loading && <Skeleton />}
      {!loading && !error && (
        <StockOverview centers={centers} inventory={inventory} thresholds={thresholds} />
      )}
    </div>
  );
}