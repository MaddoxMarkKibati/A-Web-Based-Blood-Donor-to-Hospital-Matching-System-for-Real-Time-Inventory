import { useEffect, useState } from "react";
import ThresholdEditor from "../../components/ThresholdEditor";
import BloodTypeCorrection from "../../components/BloodTypeCorrection";
import { fetchThresholds } from "../../api/admin";
import Skeleton from "../../components/Skeleton";

export default function AdminSettings() {
  const [thresholds, setThresholds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchThresholds()
      .then(setThresholds)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleUpdated(updated) {
    setThresholds((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }

  return (
    <div className="page">
      <h1>Settings</h1>
      {error && <p className="auth-error">{error}</p>}
      {loading && <Skeleton />}
      {!loading && !error && (
        <div className="settings-stack">
          <div className="page-panel request-form">
            <ThresholdEditor thresholds={thresholds} onUpdated={handleUpdated} />
          </div>
          <BloodTypeCorrection />
        </div>
      )}
    </div>
  );
}