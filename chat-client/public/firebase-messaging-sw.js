// Scripts for firebase messaging service worker

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const clean = (val) => (val ? val.replace(/["',]/g, '').trim() : undefined);

// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
  apiKey: clean(import.meta.env.VITE_API_KEY),
  authDomain: clean(import.meta.env.VITE_AUTH_DOMAIN),
  projectId: clean(import.meta.env.VITE_PROJECT_ID),
  storageBucket: clean(import.meta.env.VITE_STORAGE_BUCKET),
  messagingSenderId: clean(import.meta.env.VITE_MESSAGING_SENDER_ID),
  appId: clean(import.meta.env.VITE_APP_ID),
  measurementId: clean(import.meta.env.VITE_MEASUREMENT_ID)
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/vite.svg' // Replace with your app logo
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
