// HurdExpress — Firebase Cloud Messaging service worker (background push).
// Service worker нь .env уншиж чадахгүй тул public Firebase config-г шууд бичнэ.
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js",
);

firebase.initializeApp({
  apiKey: "AIzaSyCohBrA4n2I_Y5E9eXhIhZJvws9iKY2Das",
  authDomain: "hurdexpress-49cd2.firebaseapp.com",
  projectId: "hurdexpress-49cd2",
  storageBucket: "hurdexpress-49cd2.firebasestorage.app",
  messagingSenderId: "409714075005",
  appId: "1:409714075005:web:13d29441b5c8210a495814",
});

const messaging = firebase.messaging();

// Background дээр data-only мессеж ирэхэд notification харуулна.
messaging.onBackgroundMessage((payload) => {
  const data = payload.data || {};
  const title = data.title || "HurdExpress";
  self.registration.showNotification(title, {
    body: data.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: { url: "/" },
  });
});

// Notification дээр дарахад аппыг нээх/фокуслах.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) return client.focus();
        }
        if (self.clients.openWindow) return self.clients.openWindow("/");
      }),
  );
});
