import { useEffect, useState } from "react";
import { searchDonors } from "../api/hospitals";

export default function DonorSearch({ selected, onSelect }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const trimmed = term.trim();
    if (trimmed.length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchDonors(trimmed)
        .then((data) => {
          if (!cancelled) {
            setResults(data);
            setError("");
          }
        })
        .catch((err) => {
          if (!cancelled) setError(err.message);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term]);

  function label(donor) {
    const name = donor.full_name || `Donor #${donor.id}`;
    const type = donor.blood_type || "blood type not set";
    const nid = donor.national_id ? ` · ID ${donor.national_id}` : "";
    return `${name} · ${type}${nid}`;
  }

  if (selected) {
    return (
      <div className="donor-selected">
        <span>{label(selected)}</span>
        <button type="button" onClick={() => onSelect(null)}>
          Change
        </button>
      </div>
    );
  }

  return (
    <div className="donor-search">
      <input
        type="search"
        placeholder="Search by name or national ID"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {error && <p className="auth-error">{error}</p>}
      {results.length > 0 && (
        <ul className="donor-results">
          {results.map((d) => (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(d);
                  setTerm("");
                  setResults([]);
                }}
              >
                {label(d)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}