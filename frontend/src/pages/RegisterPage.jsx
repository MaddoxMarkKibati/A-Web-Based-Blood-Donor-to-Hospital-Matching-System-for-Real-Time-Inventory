import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../api/auth";
import AuthLayout from "../components/AuthLayout";

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
      await registerUser({
        email,
        password,
        role,
        first_name: firstName,
        middle_names: middleNames,
        last_name: lastName,
      });
      navigate("/login");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create an account" subtitle="Register as a blood donor or as hospital staff.">
      <form onSubmit={handleSubmit} className="auth-form">
        {error && <p className="auth-error">{error}</p>}

        <div className="auth-row">
          <div>
            <label htmlFor="first_name">First name</label>
            <input
              id="first_name"
              autoComplete="given-name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
          </div>
          <div>
            <label htmlFor="last_name">Last name</label>
            <input
              id="last_name"
              autoComplete="family-name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />
          </div>
        </div>

        <label htmlFor="middle_names">Middle name(s) (optional)</label>
        <input
          id="middle_names"
          value={middleNames}
          onChange={(e) => setMiddleNames(e.target.value)}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <p className="auth-hint">At least 8 characters.</p>

        <label htmlFor="role">I am a</label>
        <select id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="donor">Blood donor</option>
          <option value="hospital_staff">Hospital staff</option>
        </select>

        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Registering..." : "Register"}
        </button>

        <p>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </form>
    </AuthLayout>
  );
}