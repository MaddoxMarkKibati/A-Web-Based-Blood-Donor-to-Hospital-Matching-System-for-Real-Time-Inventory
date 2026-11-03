export default function BloodTypeTag({ type, size = "md" }) {
  if (!type) {
    return <span className="blood-tag blood-tag-empty">Not set</span>;
  }

  const abo = type.slice(0, -1);
  const negative = type.endsWith("-");
  const spoken = `${abo} ${negative ? "negative" : "positive"}`;

  return (
    <span className={`blood-tag blood-tag-${size}`} role="img" aria-label={spoken}>
      <span aria-hidden="true">{abo}</span>
      <sup className="blood-tag-rh" aria-hidden="true">
        {negative ? "−" : "+"}
      </sup>
    </span>
  );
}