import { useCallback, useEffect, useState } from "react";
import NewRequestForm from "../../components/NewRequestForm";
import RequestCard from "../../components/RequestCard";
import { fetchRegionalStorageCenters, fetchMyRequests } from "../../api/hospitals";

export default function HospitalRequests() {
  const [centers, setCenters] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadRequests = useCallback(() => {
    return fetchMyRequests()
      .then((list) => setRequests([...list].sort((a, b) => b.id - a.id)))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    Promise.all([
      fetchRegionalStorageCenters().then(setCenters),
      loadRequests(),
    ])
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [loadRequests]);

  const centerName = (id) => centers.find((c) => c.id === id)?.region_name ?? "Unknown centre";

  return (
    <div className="page">
      <h1>Requests</h1>
      {error && <p className="auth-error">{error}</p>}
      {loading && <p>Loading...</p>}

      {!loading && centers.length > 0 && <NewRequestForm centers={centers} onCreated={loadRequests} />}

      {!loading && (
        <section>
          <h2>Your requests</h2>
          {requests.length === 0 ? (
            <p>You have not posted any requests yet. Use the form above to post your first one.</p>
          ) : (
            requests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                centerName={centerName(r.regional_storage_center)}
                onChanged={loadRequests}
              />
            ))
          )}
        </section>
      )}
    </div>
  );
}