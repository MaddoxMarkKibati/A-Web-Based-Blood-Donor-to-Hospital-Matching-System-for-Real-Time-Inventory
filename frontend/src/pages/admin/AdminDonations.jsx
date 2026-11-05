import { useEffect, useState } from "react";
import RecordDonationForm from "../../components/RecordDonationForm";
import RecentDonations from "../../components/RecentDonations";
import { fetchRegionalStorageCenters } from "../../api/hospitals";
import Skeleton from "../../components/Skeleton";

export default function AdminDonations() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [version, setVersion] = useState(0);

  useEffect(() => {
    fetchRegionalStorageCenters()
      .then(setCenters)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h1>Donations</h1>
      <p>
        Record a donation after a donor gives blood. The units are added to the centre's
        stock, and the donor becomes ineligible for alerts until their next eligible date.
      </p>
      {error && <p className="auth-error">{error}</p>}
      {loading && <Skeleton />}
      {!loading && centers.length > 0 && (
        <RecordDonationForm centers={centers} onRecorded={() => setVersion((v) => v + 1)} />
      )}
      {!loading && <RecentDonations refreshKey={version} />}
    </div>
  );
}