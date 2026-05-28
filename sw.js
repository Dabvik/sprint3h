/* Sprint 3H — Service Worker */
const CACHE_NAME = 'sprint3h-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

/* ── Notification scheduler ── */
// Store of scheduled notification timeouts (keyed by id)
const scheduled = new Map();

self.addEventListener('message', event => {
  const { type, payload } = event.data || {};

  if (type === 'SCHEDULE_NOTIF') {
    const { id, delayMs, title, body, tag } = payload;
    // Cancel existing with same id
    if (scheduled.has(id)) clearTimeout(scheduled.get(id));
    const tid = setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        tag: tag || id,
        icon: '/sprint3h/icon.png',
        badge: '/sprint3h/icon.png',
        vibrate: [200, 100, 200, 100, 300],
        requireInteraction: true,
        actions: [
          { action: 'plan', title: '📋 Plan Next Sprint' },
          { action: 'dismiss', title: 'Dismiss' }
        ],
        data: { url: self.registration.scope }
      });
      scheduled.delete(id);
    }, delayMs);
    scheduled.set(id, tid);
  }

  if (type === 'CANCEL_NOTIF') {
    const { id } = payload;
    if (scheduled.has(id)) {
      clearTimeout(scheduled.get(id));
      scheduled.delete(id);
    }
  }

  if (type === 'CANCEL_ALL') {
    scheduled.forEach(tid => clearTimeout(tid));
    scheduled.clear();
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  if (event.action === 'plan' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
        for (const client of list) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow(event.notification.data?.url || '/');
      })
    );
  }
});
