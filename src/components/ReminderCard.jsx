function getReminderBadge(title) {
  const normalizedTitle = title.toLowerCase()

  if (normalizedTitle.includes('vitamin')) {
    return '✦'
  }

  if (normalizedTitle.includes('night')) {
    return '☾'
  }

  return '⌁'
}

export default function ReminderCard({
  reminder,
  note,
  onToggle,
  onEdit,
  onDelete,
  onComplete,
}) {
  return (
    <article className="reminder-card">
      <div className="reminder-card-main">
        <div className="reminder-summary">
          <span className="reminder-badge">{getReminderBadge(reminder.title)}</span>
          <strong>{reminder.title}</strong>
          <p>{reminder.time}</p>
          {note ? <span className="reminder-note">{note}</span> : null}
        </div>
        {onToggle ? (
          <button className={`toggle-pill ${reminder.active ? 'on' : ''}`} onClick={onToggle}>
            <span />
          </button>
        ) : (
          <span className="panel-chip">{reminder.active ? 'Active' : 'Paused'}</span>
        )}
      </div>

      {(onEdit || onDelete || onComplete) && (
        <div className="card-actions">
          {onComplete ? (
            <button className="secondary-button" onClick={onComplete}>
              Mark as taken
            </button>
          ) : null}
          {onEdit ? (
            <button className="ghost-button" onClick={onEdit}>
              Edit
            </button>
          ) : null}
          {onDelete ? (
            <button className="ghost-button danger" onClick={onDelete}>
              Delete
            </button>
          ) : null}
        </div>
      )}
    </article>
  )
}
