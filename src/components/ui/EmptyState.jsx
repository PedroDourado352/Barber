function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state">
      {Icon && (
        <span className="empty-icon">
          <Icon size={26} />
        </span>
      )}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  )
}

export default EmptyState
