import { useEffect, useState } from "react";
import BloodTypeTag from "../../components/BloodTypeTag";
import { fetchMyDonations } from "../../api/donors";

export default function DonorHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchMyDonations()
      .then(setDonations)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const totalUnits = donations.reduce((sum, d) => sum + d.units_donated, 0);

  return (
    <div className="page">
      <h1>Donation history</h1>
      {error && <p className="auth-error">{error}</p>}
      {loading && <p>Loading...</p>}
      {!loading && !error && donations.length === 0 && (
        <p>No donations recorded yet. After you donate at a KNBTS centre, it appears here.</p>
      )}

      {donations.length > 0 && (
        <>
          <p>
            {donations.length} {donations.length === 1 ? "donation" : "donations"}, {totalUnits}{" "}
            {totalUnits === 1 ? "unit" : "units"} in total.
          </p>
          <div className="monitor-wrap">
            <table className="monitor-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Blood type</th>
                  <th>Units</th>
                  <th>Centre</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((d) => (
                  <tr key={d.id}>
                    <td>{new Date(d.donation_date).toLocaleDateString("en-KE", { dateStyle: "medium" })}</td>
                    <td>
                      <BloodTypeTag type={d.blood_type} size="sm" />
                    </td>
                    <td>{d.units_donated}</td>
                    <td>{d.regional_storage_center_name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}