import { useEffect, useState } from "react";
import StockOverview from "../../components/StockOverview";
import { fetchRegionalStorageCenters } from "../../api/hospitals";
import { fetchAllInventory, fetchThresholds, fetchRequestMonitor } from "../../api/admin";
import { BLOOD_TYPES, stockLevel } from "../../utils/stock";
import CoverageMap from "../../components/CoverageMap";

function plural(n, one, many) {
  return `${n} ${n === 1 ? one : many}`;
}

function buildStatus(centers, inventory, thresholds, pendingRequests) {
  const minimumFor = (bt) => thresholds.find((t) => t.blood_type === bt)?.minimum_units ?? 10;

  const totals = Object.fromEntries(BLOOD_TYPES.map((bt) => [bt, 0]));
  const perCenter = {};
  for (const item of inventory) {
    totals[item.blood_type] += item.units_available;
    perCenter[item.regional_storage_center] =
      (perCenter[item.regional_storage_center] ?? 0) + item.units_available;
  }

  const critical = BLOOD_TYPES.filter((bt) => stockLevel(totals[bt], minimumFor(bt)) === "critical");
  const low = BLOOD_TYPES.filter((bt) => stockLevel(totals[bt], minimumFor(bt)) === "low");
  const emptyCenters = centers.filter((c) => (perCenter[c.id] ?? 0) === 0);

  const parts = [];
  if (critical.length > 0) {
    parts.push(`${plural(critical.length, "blood type is", "blood types are")} critical (${critical.join(", ")})`);
  }
  if (low.length > 0) {
    parts.push(`${plural(low.length, "is", "are")} low (${low.join(", ")})`);
  }
  if (critical.length === 0 && low.length === 0) {
    parts.push("every blood type is at or above its reserve minimum");
  }
  parts.push(`${plural(pendingRequests, "request is", "requests are")} pending`);
  if (emptyCenters.length > 0) {
    parts.push(`${plural(emptyCenters.length, "centre has", "centres have")} no stock`);
  }

  const text = parts.join(", ");
  return text.charAt(0).toUpperCase() + text.slice(1) + ".";
}

export default function AdminOverview() {
  const [centers, setCenters] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [thresholds, setThresholds] = useState([]);
  const [pending, setPending] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchRegionalStorageCenters().then(setCenters),
      fetchAllInventory().then(setInventory),
      fetchThresholds().then(setThresholds),
      fetchRequestMonitor("pending").then((list) => setPending(Array.isArray(list) ? list.length : 0)),
    ])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Overview</h1>
      {error && <p className="auth-error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && (
        <>
          <p className="status-line">{buildStatus(centers, inventory, thresholds, pending)}</p>
          <CoverageMap centers={centers} inventory={inventory} thresholds={thresholds} />
          <StockOverview centers={centers} inventory={inventory} thresholds={thresholds} />
        </>
      )}
    </div>
  );
}