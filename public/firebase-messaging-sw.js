// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDPT4ugCG1k3bRTD-uZ3QClzQvYQJv2qX7g".replace('AIzaSyDPT4ugCG1k3bRTD-uZ3QClzQvYQJv2qX7g', self.FIREBASE_API_KEY || ''),
  // مؤقتاً حطي المفتاح الجديد هنا بعد ما تغيريه من Google Cloud
  // بس مش هنرفعه - هنستخدم الـ env
  projectId: "axiomatic-kayak-dfs61",
  appId: "1:171672752175:web:419bae75f5745d8a0f7e8f",
  authDomain: "axiomatic-kayak-dfs61.firebaseapp.com",
  storageBucket: "axiomatic-kayak-dfs61.firebasestorage.app",
  messagingSenderId: "171672752175"
});

const messaging = firebase.messaging();

// Handle background messages delivered through FCM
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
});// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDPT4ugCG1k3bRTD-uZ3QClzQvYQJv2qX7g".replace('AIzaSyDPT4ugCG1k3bRTD-uZ3QClzQvYQJv2qX7g', self.FIREBASE_API_KEY || ''),
  // مؤقتاً حطي المفتاح الجديد هنا بعد ما تغيريه من Google Cloud
  // بس مش هنرفعه - هنستخدم الـ env
  projectId: "axiomatic-kayak-dfs61",
  appId: "1:171672752175:web:419bae75f5745d8a0f7e8f",
  authDomain: "axiomatic-kayak-dfs61.firebaseapp.com",
  storageBucket: "axiomatic-kayak-dfs61.firebasestorage.app",
  messagingSenderId: "171672752175"
});

const messaging = firebase.messaging();

// Handle background messages delivered through FCM
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
});ر// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
firebase.initializeApp({
  apiKey: "AIzaSyDPT4ugCG1k3bRTD-uZ3QClzQvYQJv2qX7g".replace('AIzaSyDPT4ugCG1k3bRTD-uZ3QClzQvYQJv2qX7g', self.FIREBASE_API_KEY || ''),
  // مؤقتاً حطي المفتاح الجديد هنا بعد ما تغيريه من Google Cloud
  // بس مش هنرفعه - هنستخدم الـ env
  projectId: "axiomatic-kayak-dfs61",
  appId: "1:171672752175:web:419bae75f5745d8a0f7e8f",
  authDomain: "axiomatic-kayak-dfs61.firebaseapp.com",
  storageBucket: "axiomatic-kayak-dfs61.firebasestorage.app",
  messagingSenderId: "171672752175"
});

const messaging = firebase.messaging();

// Handle background messages delivered through FCM
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
});