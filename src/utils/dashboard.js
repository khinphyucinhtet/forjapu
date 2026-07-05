function pad(value) {
  return String(value).padStart(2, '0')
}

export function toLocalDateKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatHeadingDate(value) {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function buildRecentDays(totalDays = 7) {
  return Array.from({ length: totalDays }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (totalDays - index - 1))

    return {
      key: toLocalDateKey(date),
      label: new Intl.DateTimeFormat('en', { weekday: 'short' }).format(date),
      date,
    }
  })
}

export function buildReminderDashboard(reminders, history, totalDays = 7) {
  const recentDays = buildRecentDays(totalDays)
  const recentKeySet = new Set(recentDays.map((day) => day.key))
  const recentHistory = history.filter((entry) => recentKeySet.has(toLocalDateKey(entry.date)))
  const completedCount = recentHistory.filter((entry) => entry.status === 'Taken').length
  const ignoredCount = recentHistory.filter((entry) => entry.status !== 'Taken').length
  const totalTracked = completedCount + ignoredCount
  const completionRate = totalTracked ? Math.round((completedCount / totalTracked) * 100) : 0
  const activeReminders = reminders.filter((reminder) => reminder.active).length

  const dayBreakdown = recentDays.map((day) => {
    const dayEntries = recentHistory.filter((entry) => toLocalDateKey(entry.date) === day.key)
    const taken = dayEntries.filter((entry) => entry.status === 'Taken').length
    const ignored = dayEntries.filter((entry) => entry.status !== 'Taken').length
    const total = dayEntries.length

    return {
      ...day,
      taken,
      ignored,
      total,
      ratio: total ? taken / total : 0,
    }
  })

  return {
    totalReminders: reminders.length,
    activeReminders,
    completedCount,
    ignoredCount,
    totalTracked,
    completionRate,
    recentHistory,
    recentEntries: [...history].slice(0, 8),
    dayBreakdown,
    latestDateKey: recentEntriesDateKey(history),
  }
}

function recentEntriesDateKey(history) {
  const latestEntry = history[0]
  return latestEntry ? toLocalDateKey(latestEntry.date) : toLocalDateKey(new Date())
}
