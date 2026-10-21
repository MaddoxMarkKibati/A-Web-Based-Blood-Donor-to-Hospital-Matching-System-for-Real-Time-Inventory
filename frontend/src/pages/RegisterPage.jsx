import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/auth";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("donor");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [middleNames, setMiddleNames] = useState("");
  const [lastName, setLastName] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await registerUser({ email, password, role, first_name: firstName, middle_names: middleNames, last_name: lastName });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h1>Register</h1>

        {error && <p className="auth-error">{error}</p>}
                <label htmlFor="first_name">First Name</label>
        <input
          id="first_name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />

        <label htmlFor="middle_names">Middle Name(s) (optional)</label>
        <input
          id="middle_names"
          value={middleNames}
          onChange={(e) => setMiddleNames(e.target.value)}
        />

        <label htmlFor="last_name">Last Name</label>
        <input
          id="last_name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />

        <label htmlFor="role">I am a</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="donor">Blood Donor</option>
          <option value="hospital_staff">Hospital Staff</option>
        </select>

        <button type="submit" disabled={submitting}>
          {submitting ? "Registering..." : "Register"}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </div>
  );
}