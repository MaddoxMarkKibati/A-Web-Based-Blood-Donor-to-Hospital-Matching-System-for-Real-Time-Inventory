import { useEffect, useState } from "react";
import NewRequestForm from "../../components/NewRequestForm";
import { fetchRegionalStorageCenters } from "../../api/hospitals";

export default function HospitalRequests() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchRegionalStorageCenters()
      .then(setCenters)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Requests</h1>
      {error && <p className="auth-error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && centers.length > 0 && <NewRequestForm centers={centers} />}
    </div>
  );
}