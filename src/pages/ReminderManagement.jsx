import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import ReminderCard from '../components/ReminderCard'
import { formatReminderTime, senderNavItems, toReminderTimeValue } from '../utils/app'
import { addReminder, deleteReminder, updateReminder, useReminders } from '../utils/storage'

const emptyDraft = {
  title: '',
  time: '',
  note: '',
  active: true,
}

export default function ReminderManagement() {
  const reminders = useReminders()
  const [draft, setDraft] = useState(emptyDraft)
  const [editingId, setEditingId] = useState(null)
  const [error, setError] = useState('')

  function handleAddReminder() {
    setEditingId(null)
    setDraft(emptyDraft)
    setError('')
  }

  function handleChange(event) {
    const { name, value } = event.target
    setDraft((current) => ({ ...current, [name]: value }))
  }

  function handleSaveReminder(event) {
    event.preventDefault()

    if (!draft.title.trim() || !draft.time.trim()) {
      setError('Please add both a reminder title and time.')
      return
    }

    const payload = {
      title: draft.title.trim(),
      timeValue: draft.time.trim(),
      time: formatReminderTime(draft.time.trim()),
      note: draft.note.trim(),
      active: draft.active,
    }

    if (editingId) {
      updateReminder(editingId, payload)
    } else {
      addReminder(payload)
    }

    setEditingId(null)
    setDraft(emptyDraft)
    setError('')
  }

  function handleEditReminder(reminder) {
    setEditingId(reminder.id)
    setDraft({
      title: reminder.title,
      time: toReminderTimeValue(reminder),
      note: reminder.note || '',
      active: reminder.active,
    })
    setError('')
  }

  function handleCancelEdit() {
    setEditingId(null)
    setDraft(emptyDraft)
    setError('')
  }

  return (
    <div className="page-shell theme-sender">
      <div className="phone-shell">
        <AppHeader
          title="Reminders"
          theme="sender"
          action={
            <button className="mini-action-button" onClick={handleAddReminder}>
              + Add
            </button>
          }
        />

        <main className="page-content">
          <section className="panel-card">
            <form className="panel-form" onSubmit={handleSaveReminder}>
              <div className="field-grid">
                <label className="panel-field">
                  <span>Reminder title</span>
                  <input
                    name="title"
                    value={draft.title}
                    onChange={handleChange}
                    placeholder="Drink water"
                  />
                </label>
                <label className="panel-field">
                  <span>Reminder time</span>
                  <input
                    name="time"
                    type="time"
                    value={draft.time}
                    onChange={handleChange}
                    step="60"
                  />
                </label>
              </div>

              <label className="panel-field">
                <span>Little note</span>
                <textarea
                  name="note"
                  className="panel-textarea"
                  value={draft.note}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Add a sweet reminder note..."
                />
              </label>

              {error ? <p className="form-error">{error}</p> : null}

              <div className="panel-actions">
                <button className="primary-button" type="submit">
                  {editingId ? 'Save changes' : 'Save reminder'}
                </button>
                <button className="secondary-button" type="button" onClick={handleCancelEdit}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              note={reminder.note}
              onToggle={() => updateReminder(reminder.id, { active: !reminder.active })}
              onEdit={() => handleEditReminder(reminder)}
              onDelete={() => deleteReminder(reminder.id)}
            />
          ))}
        </main>

        <BottomNav items={senderNavItems} />
      </div>
    </div>
  )
}
