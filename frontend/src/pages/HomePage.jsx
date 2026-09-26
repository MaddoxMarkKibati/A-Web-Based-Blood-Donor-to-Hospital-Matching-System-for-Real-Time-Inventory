import { useAuth } from "../context/AuthContext";

export default function HomePage() {
  const { user, logout } = useAuth();

  return (
    <div>
      <h1>Welcome, {user?.email}</h1>
      <p>Role: {user?.role}</p>
      <button onClick={logout}>Log Out</button>
    </div>
  );
}