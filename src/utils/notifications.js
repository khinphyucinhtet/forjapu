export function isIosDevice() {
  if (typeof window === 'undefined') {
    return false
  }

  const userAgent = window.navigator.userAgent || ''
  return /iPad|iPhone|iPod/i.test(userAgent)
}

export function isStandaloneApp() {
  if (typeof window === 'undefined') {
    return false
  }

  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function canRequestNotificationPermission() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false
  }

  if (isIosDevice() && !isStandaloneApp()) {
    return false
  }

  return true
}

export function getNotificationSetupHint() {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return 'This device or browser does not support web notifications.'
  }

  if (isIosDevice() && !isStandaloneApp()) {
    return 'On iPhone, add ForJapu to the Home Screen first, then open the installed app and enable notifications there.'
  }

  if (Notification.permission === 'granted') {
    return 'Notifications are enabled. Keep internet on for live sync. Background alerts on iPhone still require the installed app experience.'
  }

  return 'Turn on notifications and keep internet on for live reminder sync.'
}

export async function showAppNotification({ title, body, tag, url }) {
  if (typeof window === 'undefined' || typeof Notification === 'undefined') {
    return false
  }

  if (Notification.permission !== 'granted') {
    return false
  }

  const options = {
    body,
    tag,
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url },
  }

  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready

      if (registration?.showNotification) {
        await registration.showNotification(title, options)
        return true
      }
    }
  } catch {
    // Fall back to the regular Notification API below.
  }

  new Notification(title, options)
  return true
}
