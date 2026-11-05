import ThemeToggle from "./ThemeToggle";

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-split">
      <aside className="auth-brand">
        <div className="auth-wordmark">
          <span className="auth-drop" aria-hidden="true" />
          <span>Blood Donor Matching</span>
        </div>
        <p className="auth-mission">Connecting blood donors to Kenyan hospitals in real time.</p>
      </aside>

      <main className="auth-main">
        <div className="auth-main-top">
          <ThemeToggle />
        </div>
        <div className="auth-card">
          <h1>{title}</h1>
          {subtitle && <p className="auth-subtitle">{subtitle}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}