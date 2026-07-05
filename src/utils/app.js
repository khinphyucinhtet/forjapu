export const senderNavItems = [
  { label: 'Home', path: '/pinky', icon: '♥' },
  { label: 'Reminders', path: '/pinky/reminders', icon: '◫' },
  { label: 'Board', path: '/pinky/board', icon: '✎' },
  { label: 'History', path: '/pinky/analytics', icon: '◔' },
  { label: 'Settings', path: '/pinky/settings', icon: '⚙' },
]

export const receiverNavItems = [
  { label: 'Home', path: '/japu', icon: '♥' },
  { label: 'Board', path: '/japu/board', icon: '✎' },
  { label: 'History', path: '/japu/history', icon: '◔' },
  { label: 'Settings', path: '/japu/settings', icon: '⚙' },
]

export function formatTimestamp(dateString) {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatTinyTime(dateString) {
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(dateString))
}

export function formatReminderTime(timeValue) {
  if (!timeValue) {
    return ''
  }

  const [hoursText = '0', minutesText = '0'] = String(timeValue).split(':')
  const hours = Number(hoursText)
  const minutes = Number(minutesText)

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return String(timeValue)
  }

  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(2026, 0, 1, hours, minutes))
}

export function toReminderTimeValue(reminder) {
  if (reminder?.timeValue) {
    return reminder.timeValue
  }

  const displayTime = String(reminder?.time || '').trim()
  const timeMatch = displayTime.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)

  if (!timeMatch) {
    return ''
  }

  let hours = Number(timeMatch[1])
  const minutes = timeMatch[2]
  const meridiem = timeMatch[3].toUpperCase()

  if (meridiem === 'PM' && hours !== 12) {
    hours += 12
  }

  if (meridiem === 'AM' && hours === 12) {
    hours = 0
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`
}
