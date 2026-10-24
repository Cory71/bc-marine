// One reading inside a card: small label, big value, optional detail line
export default function Stat({ label, value, detail, tone }) {
  return (
    <div className="stat">
      <p className="stat__label">{label}</p>
      <p className={`stat__value numeric ${tone ? `stat__value--${tone}` : ''}`}>{value}</p>
      {detail && <p className="stat__detail numeric">{detail}</p>}
    </div>
  );
}
