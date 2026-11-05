export default function Skeleton({ lines = 4 }) {
  return (
    <div className="skeleton" role="status" aria-label="Loading">
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} className="skeleton-line" style={{ width: `${100 - (i % 3) * 18}%` }} />
      ))}
    </div>
  );
}