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
