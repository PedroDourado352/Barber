function StatCard({ label, value, change, note, icon: Icon, tone }) {
  return <article className="stat-card"><div className={`stat-icon ${tone}`}><Icon size={18} /></div><div className="stat-label">{label}</div><div className="stat-value">{value}</div><div className="stat-footer"><span className={`stat-change ${tone}`}>{change}</span><span>{note}</span></div></article>
}

export default StatCard