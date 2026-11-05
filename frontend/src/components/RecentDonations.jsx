import EmptyState from "./EmptyState";
import { useEffect, useState } from "react";
import { fetchRecentDonations } from "../api/admin";
import Skeleton from "./Skeleton";

function formatWhen(iso) {
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

export default function RecentDonations({ refreshKey }) {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchRecentDonations()
      .then((data) => {
        if (!cancelled) setDonations(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <section>
      <h2>Recent Donations</h2>
      {error && <p className="auth-error">{error}</p>}
      {loading && <Skeleton lines={3} />}
      {!loading && !error && donations.length === 0 && <EmptyState title="No donations recorded yet">Recorded donations appear here.</EmptyState>}

      {donations.length > 0 && (
        <div className="monitor-wrap">
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Donor</th>
                <th>Blood type</th>
                <th>Units</th>
                <th>Centre</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <tr key={d.id}>
                  <td>{d.donor_name || "—"}</td>
                  <td>{d.blood_type}</td>
                  <td>{d.units_donated}</td>
                  <td>{d.regional_storage_center_name}</td>
                  <td>{formatWhen(d.donation_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}