import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import { receiverNavItems } from '../utils/app'
import { buildReminderDashboard, formatHeadingDate } from '../utils/dashboard'
import { useReminderHistory, useReminders } from '../utils/storage'

function DonutChart({ completedCount, ignoredCount, completionRate }) {
  const radius = 50
  const circumference = 2 * Math.PI * radius
  const total = completedCount + ignoredCount
  const completedLength = total ? (completedCount / total) * circumference : 0
  const ignoredLength = Math.max(circumference - completedLength, 0)

  return (
    <div className="donut-card">
      <svg className="donut-chart" viewBox="0 0 140 140" role="img" aria-label="7 day reminder completion chart">
        <circle className="donut-ring-bg" cx="70" cy="70" r={radius} />
        <circle
          className="donut-ring-taken"
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={`${completedLength} ${circumference}`}
        />
        <circle
          className="donut-ring-pending"
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={`${ignoredLength} ${circumference}`}
          strokeDashoffset={-completedLength}
        />
      </svg>
      <div className="donut-center-copy">
        <strong>{completionRate}%</strong>
        <span>done</span>
      </div>
    </div>
  )
}

export default function JapuHistory() {
  const reminders = useReminders()
  const history = useReminderHistory()
  const dashboard = buildReminderDashboard(reminders, history)

  return (
    <div className="page-shell theme-receiver">
      <div className="phone-shell">
        <AppHeader
          title="History"
          subtitle="Track reminder progress and your weekly routine."
          theme="receiver"
        />

        <main className="page-content">
          <section className="stats-grid compact">
            <article className="stat-card">
              <span>Total alerts</span>
              <strong>{dashboard.totalReminders}</strong>
            </article>
            <article className="stat-card">
              <span>Active now</span>
              <strong>{dashboard.activeReminders}</strong>
            </article>
            <article className="stat-card">
              <span>Completed 7d</span>
              <strong>{dashboard.completedCount}</strong>
            </article>
            <article className="stat-card">
              <span>Ignored 7d</span>
              <strong>{dashboard.ignoredCount}</strong>
            </article>
          </section>

          <section className="panel-card">
            <div className="panel-title-row">
              <h3>Past 7 days</h3>
              <span className="panel-chip">{dashboard.totalTracked} check-ins</span>
            </div>

            <div className="dashboard-donut-layout">
              <DonutChart
                completedCount={dashboard.completedCount}
                ignoredCount={dashboard.ignoredCount}
                completionRate={dashboard.completionRate}
              />

              <div className="dashboard-legend">
                <div className="dashboard-legend-row">
                  <span className="legend-dot taken" />
                  <div>
                    <strong>Completed</strong>
                    <p>{dashboard.completedCount} reminders marked as taken.</p>
                  </div>
                </div>
                <div className="dashboard-legend-row">
                  <span className="legend-dot pending" />
                  <div>
                    <strong>Ignored / not done</strong>
                    <p>{dashboard.ignoredCount} reminders still pending.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-title-row">
              <h3>Daily progress</h3>
              <span className="panel-chip">Last 7 days</span>
            </div>

            <div className="dashboard-progress-list">
              {dashboard.dayBreakdown.map((day) => (
                <div key={day.key} className="dashboard-progress-row">
                  <div className="dashboard-progress-meta">
                    <strong>{day.label}</strong>
                    <span>
                      {day.taken} done / {day.ignored} ignored
                    </span>
                  </div>
                  <div className="dashboard-progress-bar">
                    <div
                      className="dashboard-progress-fill"
                      style={{ width: `${Math.max(day.ratio * 100, day.total ? 10 : 0)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-title-row">
              <h3>Recent logs</h3>
              <span className="panel-chip">{dashboard.recentEntries.length} latest</span>
            </div>

            <div className="history-list">
              {dashboard.recentEntries.length ? (
                dashboard.recentEntries.map((entry) => (
                  <div key={entry.id} className="history-row">
                    <div>
                      <strong>{entry.title}</strong>
                      <p>
                        {formatHeadingDate(entry.date)} at {entry.time}
                      </p>
                    </div>
                    <span className={`status-pill ${entry.status.toLowerCase()}`}>{entry.status}</span>
                  </div>
                ))
              ) : (
                <p className="helper-text">No reminder history yet. It will show up after check-ins.</p>
              )}
            </div>
          </section>
        </main>

        <BottomNav items={receiverNavItems} />
      </div>
    </div>
  )
}
