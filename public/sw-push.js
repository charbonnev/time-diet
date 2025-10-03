// Custom Service Worker for Push Notifications
console.log('🔔 Push Service Worker loading...');

// Placeholder for PWA manifest injection - required by vite-plugin-pwa
// This will be replaced with the actual precache manifest during build
const precacheManifest = self.__WB_MANIFEST || [];
console.log('🔔 Precache manifest:', precacheManifest);

self.addEventListener('push', function(event) {
  console.log('🔔 Push notification received:', event);
  console.log('🔔 Event data exists:', !!event.data);
  
  if (!event.data) {
    console.log('🔔 Push event but no data');
    return;
  }

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Error parsing push data:', e);
    data = {
      title: 'Time Diet',
      body: event.data.text() || 'New notification',
      icon: '/pwa-192x192.png'
    };
  }

  const options = {
    body: data.body,
    icon: data.icon || '/pwa-192x192.png',
    badge: data.badge || '/pwa-192x192.png',
    data: data.data || {},
    tag: data.tag || 'time-diet-notification',
    requireInteraction: true, // Keep notification visible until user interacts
    renotify: true, // Always show notification even if tag exists
    vibrate: [200, 100, 200], // Vibration pattern for mobile
    silent: false, // Ensure sound plays
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Time Diet', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If app is not open, open it
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

self.addEventListener('notificationclose', function(event) {
  console.log('Notification closed:', event);
  // Track notification dismissal if needed
});

// Handle background sync for offline notifications
self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync-notifications') {
    event.waitUntil(
      // Handle any queued notifications when back online
      console.log('Background sync triggered for notifications')
    );
  }
});

console.log('🔔 Push Service Worker loaded and ready!');

// Add debugging for service worker events
self.addEventListener('install', function() {
  console.log('🔔 Service Worker installing...');
  self.skipWaiting(); // Force the waiting service worker to become the active service worker
});

self.addEventListener('activate', function(event) {
  console.log('🔔 Service Worker activated!');
  event.waitUntil(self.clients.claim()); // Take control of all clients immediately
});

// Debug all message events
self.addEventListener('message', function(event) {
  console.log('🔔 Service Worker received message:', event.data);
});
