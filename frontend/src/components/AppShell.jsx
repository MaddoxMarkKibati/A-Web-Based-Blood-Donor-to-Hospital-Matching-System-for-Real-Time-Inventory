import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { NAV, ROLE_LABEL } from "../navigation";

export default function AppShell() {
  const { user, logout } = useAuth();
  const items = NAV[user.role] || [];

  return (
    <div className="app-shell">
      <div className="shell-top">
        <span className="shell-brand">Blood donor matching</span>
        <div className="shell-actions">
          <span className="shell-user">{user.email}</span>
          <ThemeToggle />
          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      <aside className="shell-side">
        <p className="shell-role">{ROLE_LABEL[user.role] || user.role}</p>
        <nav className="shell-nav" aria-label="Main">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end}>
                {Icon && <Icon size={18} aria-hidden="true" />}
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  );
}