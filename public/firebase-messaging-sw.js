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

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Yeni Bildirim';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/images/ON-Logo.png',
    badge: '/images/ON-Logo.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
