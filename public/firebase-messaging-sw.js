// Firebase Cloud Messaging Service Worker for Merchant Radar Egypt
// Handles background push notifications when the app or tab is closed.

importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  projectId: "axiomatic-kayak-dfs6l",
  appId: "1:171672752175:web:419bae75f57459db2876da",
  apiKey: "AIzaSyDPT4ugCGlk3bRTD-uZJ0CQCeBzcAYlI2I",
  authDomain: "axiomatic-kayak-dfs6l.firebaseapp.com",
  storageBucket: "axiomatic-kayak-dfs6l.firebasestorage.app",
  messagingSenderId: "171672752175"
});

const messaging = firebase.messaging();

// Handle background messages delivered through Firebase Cloud Messaging
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background FCM message:', payload);

  const title = payload.notification?.title || payload.data?.title || 'رادار التاجر الذكي ⚡';
  const body = payload.notification?.body || payload.data?.body || 'تنبيه جديد بشأن الأسعار أو مزامنة المنصات في السوق المصري';
  const icon = payload.notification?.icon || '/pwa-192x192.png';
  const badge = '/icon.svg';
  const tag = payload.data?.tag || `radar-${Date.now()}`;
  const clickUrl = payload.data?.click_action || payload.data?.url || '/';

  const notificationOptions = {
    body: body,
    icon: icon,
    badge: badge,
    dir: 'rtl',
    lang: 'ar',
    tag: tag,
    renotify: true,
    requireInteraction: true,
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: clickUrl,
      type: payload.data?.type || 'general_alert',
      timestamp: Date.now(),
      rawPayload: payload.data || {}
    },
    actions: [
      { action: 'open_radar', title: 'فتح الرادار ⚡' },
      { action: 'dismiss', title: 'تجاهل ✕' }
    ]
  };

  return self.registration.showNotification(title, notificationOptions);
});

// Standard Push Event listener fallback (for simulated Web Push or server push)
self.addEventListener('push', function(event) {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || data.notification?.title || 'رادار التاجر الذكي ⚡';
    const body = data.body || data.notification?.body || 'تنبيه فوري بشأن الأسعار أو المنصات';
    const options = {
      body: body,
      icon: data.icon || '/pwa-192x192.png',
      badge: '/icon.svg',
      dir: 'rtl',
      lang: 'ar',
      tag: data.tag || `fcm-push-${Date.now()}`,
      renotify: true,
      requireInteraction: true,
      vibrate: [250, 100, 250],
      data: {
        url: data.url || data.data?.url || '/',
        type: data.type || data.data?.type || 'push_alert'
      },
      actions: [
        { action: 'open_radar', title: 'عرض التفاصيل ⚡' }
      ]
    };
    event.waitUntil(self.registration.showNotification(title, options));
  } catch (err) {
    const rawText = event.data.text();
    event.waitUntil(
      self.registration.showNotification('رادار التاجر الذكي ⚡', {
        body: rawText,
        icon: '/pwa-192x192.png',
        badge: '/icon.svg',
        dir: 'rtl',
        lang: 'ar'
      })
    );
  }
});

// Notification click event handler - Focus existing window or open new window
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // If already open, post message and focus
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data: event.notification.data
          });
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
