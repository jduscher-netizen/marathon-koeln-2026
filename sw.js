// SUB4 — Service Worker für Web Push
const CACHE = 'marathon-koeln-v1';

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
  let data = { title: 'SUB4', body: 'Trainings-Reminder' };
  if (event.data) {
    try { data = event.data.json(); } catch(_) { data.body = event.data.text(); }
  }
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: 'icon-180.png',
    badge: 'icon-180.png',
    tag: data.tag || 'training-reminder',
    data: { url: data.url || '/' },
    requireInteraction: false
  }));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
    for (const c of list) {
      if (c.url.startsWith(self.location.origin)) {
        if ('focus' in c) return c.focus();
      }
    }
    if (clients.openWindow) return clients.openWindow(targetUrl);
  }));
});
