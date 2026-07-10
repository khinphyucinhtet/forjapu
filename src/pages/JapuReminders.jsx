import { useState } from 'react'
import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import ReminderCard from '../components/ReminderCard'
import { receiverNavItems } from '../utils/app'
import { markReminderStatus, useReminders } from '../utils/storage'

export default function JapuReminders() {
  const reminders = useReminders()
  const [error, setError] = useState('')

  async function toggleReminder(reminder) {
    try {
      await markReminderStatus(reminder, reminder.status === 'completed' ? 'Pending' : 'Taken')
      setError('')
    } catch (statusError) {
      setError(statusError.message)
    }
  }

  return (
    <div className="page-shell theme-receiver">
      <div className="phone-shell">
        <AppHeader title="Reminders" theme="receiver" />

        <main className="page-content">
          {error ? <p className="form-error">{error}</p> : null}
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onComplete={() => void toggleReminder(reminder)}
            />
          ))}
        </main>

        <BottomNav items={receiverNavItems} />
      </div>
    </div>
  )
}
