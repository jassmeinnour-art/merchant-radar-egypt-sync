importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase config - المفتاح هيتحقن من السيرفر
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY,
  authDomain: "axiomatic-kayak-dfs61.firebaseapp.com",
  projectId: "axiomatic-kayak-dfs61",
  storageBucket: "axiomatic-kayak-dfs61.firebasestorage.app",
  messagingSenderId: "171672752175",
  appId: "1:171672752175:web:419bae75f5745d8a0f7e8f"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png'
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});