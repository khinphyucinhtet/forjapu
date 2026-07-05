const CACHE_NAME = 'forjapu-shell-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg']

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  )
})

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => cachedResponse || fetch(event.request)),
  )
})

self.addEventListener('notificationclick', (event) => {
  const targetUrl = event.notification?.data?.url || '/'

  event.notification.close()
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existingClient = windowClients.find((client) => 'focus' in client)

      if (existingClient) {
        return existingClient.focus().then(() => existingClient.navigate(targetUrl))
      }

      return clients.openWindow(targetUrl)
    }),
  )
})
