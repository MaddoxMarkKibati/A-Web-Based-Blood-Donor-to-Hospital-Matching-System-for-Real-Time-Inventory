import { useState } from "react";
import BloodTypeTag from "./BloodTypeTag";
import { fetchRequestResponses, updateRequestStatus } from "../api/hospitals";

const STATUS_LABEL = {
  pending: "Pending",
  fulfilled: "Fulfilled",
  cancelled: "Cancelled",
};

const RESPONSE_LABEL = {
  accepted: "Accepted",
  pending: "Awaiting reply",
  declined: "Declined",
  expired: "Expired",
};

export default function RequestCard({ request, centerName, onChanged }) {
  const [open, setOpen] = useState(false);
  const [responses, setResponses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggleResponders() {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      setError("");
      try {
        setResponses(await fetchRequestResponses(request.id));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
  }

  async function changeStatus(status) {
    if (status === "cancelled" && !window.confirm("Cancel this request? Donors will stop being alerted.")) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await updateRequestStatus(request.id, status);
      if (onChanged) onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const alerted = request.alerted_count ?? 0;
  const accepted = request.accepted_count ?? 0;
  const created = request.created_at ? new Date(request.created_at).toLocaleString() : "";

  return (
    <article className="page-panel req-card">
      <div className="req-card-head">
        <BloodTypeTag type={request.blood_type} size="md" />
        <div className="req-card-main">
          <strong>
            {request.units_needed} {request.units_needed === 1 ? "unit" : "units"}
          </strong>
          <span className="req-card-meta">
            {centerName}
            {created && ` - ${created}`}
          </span>
        </div>
        <div className="req-card-badges">
          {request.urgency_level === "critical" && <span className="badge-critical">Critical</span>}
          <span className={`req-status req-status-${request.status}`}>
            {STATUS_LABEL[request.status] ?? request.status}
          </span>
        </div>
      </div>

      <p className="req-card-counts">
        {alerted} alerted, {accepted} accepted of {request.units_needed} needed
      </p>

      {error && <p className="auth-error">{error}</p>}

      <div className="req-card-actions">
        <button type="button" onClick={toggleResponders} aria-expanded={open}>
          {open ? "Hide responders" : "Show responders"}
        </button>
        {request.status === "pending" && (
          <>
            <button type="button" className="btn-primary" disabled={busy} onClick={() => changeStatus("fulfilled")}>
              Mark fulfilled
            </button>
            <button type="button" disabled={busy} onClick={() => changeStatus("cancelled")}>
              Cancel request
            </button>
          </>
        )}
      </div>

      {open && (
        <div className="req-responders">
          {loading && <p>Loading...</p>}
          {!loading && responses && responses.length === 0 && <p>No donors were alerted for this request.</p>}
          {!loading && responses && responses.length > 0 && (
            <ul>
              {responses.map((r) => (
                <li key={r.id}>
                  <span>{r.donor_name || "Unnamed donor"}</span>
                  <BloodTypeTag type={r.blood_type} size="sm" />
                  <span className={`resp-status resp-${r.status}`}>{RESPONSE_LABEL[r.status] ?? r.status}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </article>
  );
}