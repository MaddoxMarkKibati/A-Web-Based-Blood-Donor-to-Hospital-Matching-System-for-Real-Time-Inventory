import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import BloodTypeTag from "../../components/BloodTypeTag";
import { fetchMyProfile, fetchMyNotifications, fetchMyLocations } from "../../api/donors";
import Skeleton from "../../components/Skeleton";

export default function DonorHome() {
  const [profile, setProfile] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchMyProfile(), fetchMyNotifications(), fetchMyLocations()])
      .then(([p, n, l]) => {
        setProfile(p);
        setAlerts(n);
        setLocations(l);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><Skeleton /></div>;
  if (error) return <div className="page"><p className="auth-error">{error}</p></div>;

  const openAlerts = alerts.filter(
    (a) => a.status === "pending" && (!a.request_status || a.request_status === "pending")
  ).length;
  const lastDonation = profile.last_donation_date
    ? new Date(profile.last_donation_date).toLocaleDateString("en-KE", { dateStyle: "long" })
    : null;

  const attention = [...profile.eligibility_issues];
  if (locations.length === 0) {
    attention.push("No saved location. Add one so hospitals near you can find you.");
  }

  return (
    <div className="page">
      <h1>Home</h1>

      <section className="donor-card">
        <div className="donor-card-band">{profile.full_name || profile.email}</div>
        <div className="donor-card-body">
          <BloodTypeTag type={profile.blood_type} size="lg" />
          <div>
            <p className={`donor-card-status ${profile.is_eligible ? "is-eligible" : "not-eligible"}`}>
              {profile.is_eligible ? "Eligible to donate" : "Not eligible to receive alerts yet"}
            </p>
            <p className="donor-card-meta">
              {lastDonation ? `Last donation: ${lastDonation}` : "No donation recorded yet"}
            </p>
          </div>
        </div>
      </section>

      {attention.length > 0 && (
        <section className="page-panel">
          <h2>What needs attention</h2>
          <ul className="attention-list">
            {attention.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>
            <Link to="/donor/profile">Update your profile</Link> or{" "}
            <Link to="/donor/locations">add a location</Link>.
          </p>
        </section>
      )}

      <section className="page-panel">
        <h2>Alerts</h2>
        {openAlerts > 0 ? (
          <p>
            You have {openAlerts} open {openAlerts === 1 ? "alert" : "alerts"}.{" "}
            <Link to="/donor/alerts">View alerts</Link>
          </p>
        ) : (
          <p>No open alerts. When a hospital near you needs your blood type, it appears here.</p>
        )}
      </section>
    </div>
  );
}