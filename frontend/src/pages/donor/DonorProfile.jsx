import { useEffect, useState } from "react";
import BloodTypeTag from "../../components/BloodTypeTag";
import { BLOOD_TYPES } from "../../utils/stock";
import { fetchMyProfile, updateMyProfile } from "../../api/donors";

const GENDERS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

export default function DonorProfile() {
  const [profile, setProfile] = useState(null);
  const [lockedType, setLockedType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMyProfile()
      .then((p) => {
        setProfile(p);
        setLockedType(p.blood_type || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function setField(name, value) {
    setProfile((p) => ({ ...p, [name]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const updated = await updateMyProfile({
        first_name: profile.first_name,
        middle_names: profile.middle_names,
        last_name: profile.last_name,
        phone: profile.phone,
        blood_type: profile.blood_type,
        date_of_birth: profile.date_of_birth || null,
        gender: profile.gender,
        weight_kg: profile.weight_kg || null,
        height_cm: profile.height_cm || null,
        national_id: profile.national_id || null,
      });
      setProfile(updated);
      setLockedType(updated.blood_type || "");
      setMessage("Profile saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="page"><p>Loading...</p></div>;
  if (!profile) return <div className="page"><p className="auth-error">{error}</p></div>;

  return (
    <div className="page">
      <h1>Profile</h1>

      <section className="page-panel">
        <h2>Eligibility</h2>
        {profile.is_eligible ? (
          <p className="donor-card-status is-eligible">Eligible to donate</p>
        ) : (
          <>
            <p className="donor-card-status not-eligible">Not eligible to receive alerts yet</p>
            <ul className="attention-list">
              {profile.eligibility_issues.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}
      </section>

      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-success">{message}</p>}

      <form onSubmit={handleSave} className="profile-form">
        <section className="page-panel">
          <h2>Name and contact</h2>
          <label htmlFor="first_name">First name</label>
          <input id="first_name" value={profile.first_name ?? ""} onChange={(e) => setField("first_name", e.target.value)} />
          <label htmlFor="middle_names">Middle names</label>
          <input id="middle_names" value={profile.middle_names ?? ""} onChange={(e) => setField("middle_names", e.target.value)} />
          <label htmlFor="last_name">Last name</label>
          <input id="last_name" value={profile.last_name ?? ""} onChange={(e) => setField("last_name", e.target.value)} />
          <label htmlFor="phone">Phone</label>
          <input id="phone" value={profile.phone ?? ""} onChange={(e) => setField("phone", e.target.value)} />
        </section>

        <section className="page-panel">
          <h2>Health details</h2>
          <p>Hospitals use these to check that donating is safe for you.</p>

          <label htmlFor="blood_type">Blood type</label>
          {lockedType ? (
            <p>
              <BloodTypeTag type={lockedType} size="md" />{" "}
              <span className="location-usage">
                Confirmed. Only a hospital or KNBTS staff member can change it.
              </span>
            </p>
          ) : (
            <select id="blood_type" value={profile.blood_type ?? ""} onChange={(e) => setField("blood_type", e.target.value)}>
              <option value="">Select...</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          )}

          <label htmlFor="date_of_birth">Date of birth</label>
          <input id="date_of_birth" type="date" value={profile.date_of_birth ?? ""} onChange={(e) => setField("date_of_birth", e.target.value)} />

          <label htmlFor="gender">Gender</label>
          <select id="gender" value={profile.gender ?? ""} onChange={(e) => setField("gender", e.target.value)}>
            <option value="">Select...</option>
            {GENDERS.map((g) => (
              <option key={g.value} value={g.value}>{g.label}</option>
            ))}
          </select>

          <label htmlFor="weight_kg">Weight (kg)</label>
          <input id="weight_kg" type="number" step="any" min="0" value={profile.weight_kg ?? ""} onChange={(e) => setField("weight_kg", e.target.value)} />

          <label htmlFor="height_cm">Height (cm)</label>
          <input id="height_cm" type="number" step="any" min="0" value={profile.height_cm ?? ""} onChange={(e) => setField("height_cm", e.target.value)} />
        </section>

        <section className="page-panel">
          <h2>Identification</h2>
          <label htmlFor="national_id">National ID number</label>
          <input id="national_id" value={profile.national_id ?? ""} onChange={(e) => setField("national_id", e.target.value)} />
        </section>

        <button type="submit" className="btn-primary" disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </div>
  );
}