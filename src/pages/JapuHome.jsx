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

  function handleMarkTaken() {
    if (!nextReminder) {
      return
    }

    if (!settings.reminderCheckIn) {
      markReminderStatus(nextReminder, 'Taken')
      setDialog({
        type: 'success',
        title: 'Taw Tal Taw Tal',
        message: `${nextReminder.title} was marked as taken.`,
      })
      return
    }

    setDialog({ type: 'confirm' })
  }

  function handleReminderDecision(decision) {
    if (!nextReminder) {
      setDialog(null)
      return
    }

    if (decision === 'yes') {
      markReminderStatus(nextReminder, 'Taken')
      setDialog({
        type: 'success',
        title: 'Taw Tal Taw Tal',
        message: `${nextReminder.title} was marked as taken.`,
      })
      return
    }

    markReminderStatus(nextReminder, 'Pending')
    setDialog({
      type: 'warning',
      title: 'Drink Drink You Stupid',
      message: `${nextReminder.title} is still waiting for you.`,
    })
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
            <button className="primary-button full-width" onClick={handleMarkTaken} disabled={!nextReminder}>
              Mark as taken
            </button>
          </section>
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
                  <button className="ghost-button" onClick={() => handleReminderDecision('no')}>
                    No
                  </button>
                  <button className="primary-button" onClick={() => handleReminderDecision('yes')}>
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
