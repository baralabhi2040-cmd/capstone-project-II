function StatCard({ title, value, subtitle, tone = "cyan" }) {
  return (
    <div className={`card stat-card tone-${tone}`}>
      <p className="stat-title">{title}</p>
      <div className="stat-value">{value}</div>
      {subtitle ? <p className="small stat-subtitle">{subtitle}</p> : null}
    </div>
  );
}

export default StatCard;
