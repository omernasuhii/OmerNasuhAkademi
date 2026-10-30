importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyCvB6Kv8X9NrivMjt2oK9mPiOnp8LMTZk0",
  authDomain: "gen-lang-client-0140076974.firebaseapp.com",
  projectId: "gen-lang-client-0140076974",
  storageBucket: "gen-lang-client-0140076974.firebasestorage.app",
  messagingSenderId: "748745706799",
  appId: "1:748745706799:web:2881b13fbfc5d8ec5ea5da"
});

const messaging = firebase.messaging();

// Track recent notifications to prevent duplicate alerts
const recentNotificationTags = new Set();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] onBackgroundMessage received:', payload);
  
  // 1. Deduplication check using unique message ID / tag
  const notificationId = payload.data?.id || payload.messageId || payload.data?.tag || `${payload.notification?.title || payload.data?.title || ''}-${payload.notification?.body || payload.data?.body || ''}`;
  if (recentNotificationTags.has(notificationId)) {
    console.log('[firebase-messaging-sw.js] Duplicate notification suppressed:', notificationId);
    return;
  }
  
  recentNotificationTags.add(notificationId);
  setTimeout(() => recentNotificationTags.delete(notificationId), 15000);

  // 2. If the payload already contains a top-level 'notification' object, 
  // the Firebase Web SDK (firebase-messaging-compat) displays it automatically in the background.
  // Calling self.registration.showNotification() here causes an identical SECOND duplicate notification.
  if (payload.notification && (payload.notification.title || payload.notification.body)) {
    console.log('[firebase-messaging-sw.js] Notification payload automatically handled by Firebase SDK. Suppressing manual duplicate.');
    return;
  }

  // 3. For data-only push messages, display the notification manually with deterministic tag
  const notificationTitle = payload.data?.title || 'FocusON Akademi';
  const deterministicTag = 'focuson-' + (payload.data?.id || payload.messageId || `${notificationTitle}-${payload.data?.body || ''}`);

  const notificationOptions = {
    body: payload.data?.body || 'Yeni bir bildiriminiz var.',
    icon: '/images/ON-Logo.png',
    badge: '/images/ON-Logo.png',
    vibrate: [200, 100, 200],
    tag: deterministicTag,
    renotify: false,
    data: {
      link: payload.data?.link || payload.fcmOptions?.link || '/',
      ...(payload.data || {})
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.link || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return;
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
