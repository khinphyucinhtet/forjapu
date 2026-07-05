import AppHeader from '../components/AppHeader'
import BottomNav from '../components/BottomNav'
import ReminderCard from '../components/ReminderCard'
import { receiverNavItems } from '../utils/app'
import { updateReminder, useReminders } from '../utils/storage'

export default function JapuReminders() {
  const reminders = useReminders()

  async function toggleReminder(reminder) {
    await updateReminder(reminder.id, { active: !reminder.active })
  }

  return (
    <div className="page-shell theme-receiver">
      <div className="phone-shell">
        <AppHeader title="Reminders" theme="receiver" />

        <main className="page-content">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onToggle={() => void toggleReminder(reminder)}
            />
          ))}
        </main>

        <BottomNav items={receiverNavItems} />
      </div>
    </div>
  )
}
