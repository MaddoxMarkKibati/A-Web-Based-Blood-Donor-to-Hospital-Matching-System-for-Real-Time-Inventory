import { Link } from "react-router-dom";

export default function EmptyState({ title, children, actionTo, actionLabel }) {
  return (
    <div className="empty-state">
      <p className="empty-title">{title}</p>
      {children && <p className="empty-text">{children}</p>}
      {actionTo && (
        <Link to={actionTo} className="empty-action">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}