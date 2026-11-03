import { useEffect, useState } from "react";
import { fetchRequestMonitor } from "../api/admin";

function formatWhen(iso) {
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

export default function RequestMonitor() {
  const [status, setStatus] = useState("pending");
  const [refreshKey, setRefreshKey] = useState(0);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchRequestMonitor(status)
      .then((data) => {
        if (!cancelled) setRequests(data);
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
  }, [status, refreshKey]);

  return (
    <section>
      <h2>Blood Requests</h2>
      <p>
        Requests from hospitals, critical first, with how donors responded. A request
        with 0 donors alerted usually means no eligible donor is within 25 km.
      </p>
      <div className="monitor-controls">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="pending">Open requests</option>
          <option value="all">All requests</option>
        </select>
        <button type="button" onClick={() => setRefreshKey((k) => k + 1)} disabled={loading}>
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <p className="auth-error">{error}</p>}
      {!loading && !error && requests.length === 0 && <p>No requests to show.</p>}

      {requests.length > 0 && (
        <div className="monitor-wrap">
          <table className="monitor-table">
            <thead>
              <tr>
                <th>Request</th>
                <th>Urgency</th>
                <th>Centre</th>
                <th>Posted by</th>
                <th>Posted</th>
                <th>Status</th>
                <th>Alerted</th>
                <th>Accepted</th>
                <th>Pending</th>
                <th>Declined</th>
                <th>Expired</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id}>
                  <td>
                    {r.blood_type} x{r.units_needed}
                  </td>
                  <td>
                    <span className={`badge ${r.urgency_level === "critical" ? "badge-critical" : "badge-standard"}`}>
                      {r.urgency_level}
                    </span>
                  </td>
                  <td>{r.regional_storage_center_name}</td>
                  <td>{r.staff_name || "—"}</td>
                  <td>{formatWhen(r.created_at)}</td>
                  <td>{r.status}</td>
                  <td>{r.alerted}</td>
                  <td className={r.accepted >= r.units_needed ? "monitor-covered" : ""}>
                    {r.accepted}/{r.units_needed}
                  </td>
                  <td>{r.pending}</td>
                  <td>{r.declined}</td>
                  <td>{r.expired}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}