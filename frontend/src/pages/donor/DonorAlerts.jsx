import { useEffect, useState } from "react";
import BloodTypeTag from "../../components/BloodTypeTag";
import PushToggle from "../../components/PushToggle";
import { fetchMyNotifications, respondToNotification } from "../../api/donors";
import Skeleton from "../../components/Skeleton";

function isOpen(alert) {
  return alert.status === "pending" && (!alert.request_status || alert.request_status === "pending");
}

function closedNote(alert) {
  if (alert.status === "accepted") return "You accepted this request. The hospital can see your name and blood type.";
  if (alert.status === "declined") return "You declined this request.";
  if (alert.status === "expired") return "This alert expired before you answered.";
  return "This request is no longer open.";
}

function whenText(iso) {
  return new Date(iso).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" });
}

function AlertCard({ alert, busy, onRespond }) {
  const open = isOpen(alert);
  const critical = alert.urgency_level === "critical";
  const hasRequest = Boolean(alert.blood_type);

  return (
    <article className={`alert-card ${critical && open ? "is-critical" : ""}`}>
      <div className="alert-card-head">
        {hasRequest && <BloodTypeTag type={alert.blood_type} size="md" />}
        <div>
          <h3 className="alert-card-title">
            {hasRequest
              ? `${alert.units_needed} ${alert.units_needed === 1 ? "unit" : "units"} needed at ${alert.regional_storage_center_name}`
              : alert.message_type || "Alert"}
          </h3>
          <p className="alert-card-meta">
            {critical && <span className="badge badge-critical">Critical</span>}{" "}
            {whenText(alert.date)}
            {alert.distance_km != null &&
              `. About ${alert.distance_km} km from your nearest saved location.`}
          </p>
        </div>
      </div>

      {open ? (
        <div className="alert-card-actions">
          <button
            type="button"
            className="btn-primary"
            disabled={busy}
            onClick={() => onRespond(alert.id, "accepted")}
          >
            Accept request
          </button>
          <button type="button" disabled={busy} onClick={() => onRespond(alert.id, "declined")}>
            Decline
          </button>
        </div>
      ) : (
        <p className="alert-card-note">{closedNote(alert)}</p>
      )}
    </article>
  );
}

export default function DonorAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [respondingId, setRespondingId] = useState(null);

  useEffect(() => {
    fetchMyNotifications()
      .then(setAlerts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleRespond(id, status) {
    setError("");
    setRespondingId(id);
    try {
      const updated = await respondToNotification(id, status);
      setAlerts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError(err.message);
    } finally {
      setRespondingId(null);
    }
  }

  const open = alerts.filter(isOpen);
  const earlier = alerts.filter((a) => !isOpen(a));

  return (
    <div className="page">
      <h1>Alerts</h1>
      {error && <p className="auth-error">{error}</p>}

      <PushToggle />

      <h2>Open</h2>
      {loading && <Skeleton />}
      {!loading && open.length === 0 && (
        <p>No open alerts. When a hospital near you needs your blood type, it appears here.</p>
      )}
      <div className="alert-list">
        {open.map((a) => (
          <AlertCard key={a.id} alert={a} busy={respondingId === a.id} onRespond={handleRespond} />
        ))}
      </div>

      {earlier.length > 0 && (
        <>
          <h2>Earlier</h2>
          <div className="alert-list">
            {earlier.map((a) => (
              <AlertCard key={a.id} alert={a} busy={false} onRespond={handleRespond} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}