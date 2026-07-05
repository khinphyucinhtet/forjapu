import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { receiverNavItems } from '../utils/app'
import { markReminderStatus, useCurrentUser, useReminders, useSettings } from '../utils/storage'

export default function JapuHome() {
  const user = useCurrentUser()
  const reminders = useReminders()
  const settings = useSettings()
  const nextReminder = reminders.find((reminder) => reminder.active) || reminders[0]
  const [dialog, setDialog] = useState(null)
  const [error, setError] = useState('')

  async function handleMarkTaken() {
    if (!nextReminder) {
      return
    }

    if (!settings.reminderCheckIn) {
      try {
        await markReminderStatus(nextReminder, 'Taken')
        setError('')
        setDialog({
          type: 'success',
          title: 'Taw Tal Taw Tal',
          message: `${nextReminder.title} was marked as taken.`,
        })
      } catch (statusError) {
        setError(statusError.message)
      }
      return
    }

    setError('')
    setDialog({ type: 'confirm' })
  }

  async function handleReminderDecision(decision) {
    if (!nextReminder) {
      setDialog(null)
      return
    }

    if (decision === 'yes') {
      try {
        await markReminderStatus(nextReminder, 'Taken')
        setError('')
        setDialog({
          type: 'success',
          title: 'Taw Tal Taw Tal',
          message: `${nextReminder.title} was marked as taken.`,
        })
      } catch (statusError) {
        setError(statusError.message)
      }
      return
    }

    try {
      await markReminderStatus(nextReminder, 'Pending')
      setError('')
      setDialog({
        type: 'warning',
        title: 'Drink Drink You Stupid',
        message: `${nextReminder.title} is still waiting for you.`,
      })
    } catch (statusError) {
      setError(statusError.message)
    }
  }

  return (
    <div className="page-shell theme-receiver">
      <div className="phone-shell">
        <AppHeader
          title={`Welcome, ${user?.name || 'Japu'} ☀`}
          subtitle="Have a nice day."
          theme="receiver"
        />

        <main className="page-content">
          <section className="hero-card receiver-hero dashboard-hero">
            <div>
              <p className="eyebrow">Good morning, {user?.name || 'Japu'}!</p>
              <h2>You are cared for. ☽</h2>
              <p>Take care today.</p>
            </div>
            <div className="hero-mascot">🦕</div>
          </section>

          <section className="panel-card overview-card">
            <div className="overview-main">
              <div>
                <p className="eyebrow">Next reminder</p>
                <strong>{nextReminder?.title || 'No reminder yet'}</strong>
                <p>{nextReminder?.time || 'Ask Pinky to add one'}</p>
              </div>
              <span className="overview-icon receiver">⌁</span>
            </div>
            <button className="primary-button full-width" onClick={() => void handleMarkTaken()} disabled={!nextReminder}>
              Mark as taken
            </button>
          </section>
          {error ? <p className="form-error">{error}</p> : null}
        </main>

        <BottomNav items={receiverNavItems} />
      </div>

      {dialog ? (
        <div className="modal-overlay" role="presentation">
          <div className={`modal-card modal-card-${dialog.type}`}>
            {dialog.type === 'confirm' ? (
              <>
                <div className="modal-copy">
                  <h3>Reminder check</h3>
                  <p>Did you take {nextReminder?.title || 'your reminder'}?</p>
                </div>
                <div className="modal-actions modal-actions-split">
                  <button className="ghost-button" onClick={() => void handleReminderDecision('no')}>
                    No
                  </button>
                  <button className="primary-button" onClick={() => void handleReminderDecision('yes')}>
                    Yes
                  </button>
                </div>
              </>
            ) : dialog.type === 'warning' ? (
              <>
                <button className="modal-close-button" onClick={() => setDialog(null)} aria-label="Close popup">
                  ×
                </button>
                <div className="modal-copy">
                  <h3>{dialog.title}</h3>
                  <p>{dialog.message}</p>
                </div>
              </>
            ) : (
              <>
                <div className="modal-copy center">
                  <h3>{dialog.title}</h3>
                  <p>{dialog.message}</p>
                </div>
                <div className="modal-actions modal-actions-center">
                  <button className="primary-button" onClick={() => setDialog(null)}>
                    OK
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
