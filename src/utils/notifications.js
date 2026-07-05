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
