import { Link } from 'react-router-dom'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { senderNavItems } from '../utils/app'
import { useCurrentUser, useReminderHistory, useReminders, useWhiteboardData } from '../utils/storage'

export default function PinkyDashboard() {
  const user = useCurrentUser()
  const reminders = useReminders()
  const history = useReminderHistory()
  const whiteboardData = useWhiteboardData()
  const nextReminder =
    reminders.find((reminder) => reminder.active) || reminders[0] || { title: 'No reminder yet', time: 'Set one soon' }
  const remindersSent = reminders.length
  const activeReminders = reminders.filter((reminder) => reminder.active).length
  const boardSends = whiteboardData.sendCount || 0
  const streakDays = history.filter((entry) => entry.status === 'Taken').length

  return (
    <div className="page-shell theme-sender">
      <div className="phone-shell">
        <AppHeader
          title={`Welcome, ${user?.name || 'Pinky'} ♥`}
          subtitle="Here's today's loving overview."
          theme="sender"
        />

        <main className="page-content">
          <section className="hero-card sender-hero dashboard-hero">
            <div>
              <p className="eyebrow">Good morning, {user?.name || 'Pinky'}!</p>
              <h2>You&apos;ve got this! ♡</h2>
              <p>Send a little care today.</p>
            </div>
            <div className="hero-mascot">🐰</div>
          </section>

          <section className="panel-card overview-card">
            <div className="overview-main">
              <div>
                <p className="eyebrow">Next reminder</p>
                <strong>{nextReminder.title}</strong>
                <p>{nextReminder.time}</p>
              </div>
              <span className="overview-icon">⌁</span>
            </div>
            <Link to="/pinky/reminders" className="mini-chip-link">
              View all reminders
            </Link>
          </section>

          <section className="stats-grid compact">
            <article className="stat-card">
              <span>Reminders Sent</span>
              <strong>{remindersSent}</strong>
            </article>
            <article className="stat-card">
              <span>Board Sends</span>
              <strong>{boardSends}</strong>
            </article>
          </section>

          <section className="panel-card">
            <div className="panel-title-row">
              <h3>Quick links</h3>
            </div>
            <div className="quick-actions quick-actions-four">
              <Link to="/pinky/reminders" className="quick-action-card icon-card">
                <span className="action-icon">◫</span>
                <span>Reminders</span>
              </Link>
              <Link to="/pinky/board" className="quick-action-card icon-card">
                <span className="action-icon">✎</span>
                <span>Whiteboard</span>
              </Link>
              <Link to="/pinky/analytics" className="quick-action-card icon-card">
                <span className="action-icon">◔</span>
                <span>History</span>
              </Link>
              <Link to="/pinky/profile" className="quick-action-card icon-card">
                <span className="action-icon">☺</span>
                <span>Profile</span>
              </Link>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-title-row">
              <h3>Today&apos;s overview</h3>
              <span className="panel-chip">Live</span>
            </div>
            <div className="stats-grid">
              <article className="stat-card">
                <span>Active Reminders</span>
                <strong>{activeReminders}</strong>
              </article>
              <article className="stat-card">
                <span>Streak Days</span>
                <strong>{streakDays} days</strong>
              </article>
            </div>
          </section>
        </main>

        <BottomNav items={senderNavItems} />
      </div>
    </div>
  )
}
