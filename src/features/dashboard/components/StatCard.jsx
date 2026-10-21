function StatCard({ label, value, change, note, icon: Icon, tone }) {
  return (
    <article className="flex min-h-[142px] flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-[18px] shadow-[var(--shadow-card)]">
      <div className={`mb-[15px] grid h-9 w-9 place-items-center rounded-[10px] ${tone === 'green' ? 'bg-[var(--green-bg)] text-[var(--green)]' : tone === 'orange' ? 'bg-[var(--amber-bg)] text-[var(--amber)]' : tone === 'blue' ? 'bg-[var(--blue-bg)] text-[var(--blue)]' : 'bg-[var(--purple-bg)] text-[var(--purple)]'}`}>
        <Icon size={18} />
      </div>
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-1 font-['Inter'] text-[27px] font-semibold text-[var(--text)]">{value}</div>
      <div className="flex items-center gap-2 pt-2.5 text-[10.5px] text-[var(--text-dim)]">
        {change && <span className={`rounded px-1.5 py-0.5 font-semibold text-[var(--${tone})]`}>{change}</span>}
        <span>{note}</span>
      </div>
    </article>
  )
}

export default StatCard
