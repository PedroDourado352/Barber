function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="grid justify-items-center gap-3 p-12 text-center">
      {Icon && (
        <span className="grid h-[58px] w-[58px] place-items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-dim)]">
          <Icon size={26} />
        </span>
      )}
      <strong className="text-[15px] font-semibold text-[var(--text)]">{title}</strong>
      {description && <p className="m-0 max-w-[330px] text-xs leading-relaxed text-[var(--text-muted)]">{description}</p>}
      {action}
    </div>
  )
}

export default EmptyState
