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

  // Determine notification type and set appropriate actions
  const notificationType = data.notificationType || 'default';
  let actions = [];
  
  if (notificationType === 'early-warning') {
    // 5-minute early warning: Complete or Skip
    actions = [
      { action: 'complete', title: '✓ Complete' },
      { action: 'skip', title: '⏭ Skip' }
    ];
  } else if (notificationType === 'block-start') {
    // Block starting now: Snooze
    actions = [
      { action: 'snooze', title: '⏰ Snooze 5min' },
      { action: 'open', title: 'Open App' }
    ];
  } else {
    // Default actions
    actions = [
      { action: 'open', title: 'Open App' },
      { action: 'dismiss', title: 'Dismiss' }
    ];
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
    actions: actions
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Time Diet', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('🔔 Notification clicked:', event.action, event.notification.data);
  
  const action = event.action;
  const notificationData = event.notification.data;
  
  event.notification.close();

  // Handle different actions
  if (action === 'dismiss') {
    return;
  }
  
  if (action === 'complete') {
    // Send message to app to complete the timeblock
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          clientList[i].postMessage({
            type: 'COMPLETE_TIMEBLOCK',
            blockId: notificationData.blockId,
            date: notificationData.date
          });
        }
        // Also open/focus the app
        if (clientList.length > 0) {
          return clientList[0].focus();
        } else if (self.clients.openWindow) {
          return self.clients.openWindow('/');
        }
      })
    );
    return;
  }
  
  if (action === 'skip') {
    // Send message to app to skip the timeblock
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          clientList[i].postMessage({
            type: 'SKIP_TIMEBLOCK',
            blockId: notificationData.blockId,
            date: notificationData.date
          });
        }
        // Don't open the app for skip - just dismiss
      })
    );
    return;
  }
  
  if (action === 'snooze') {
    // Send message to app to snooze notification (reschedule in 5 minutes)
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          clientList[i].postMessage({
            type: 'SNOOZE_NOTIFICATION',
            blockId: notificationData.blockId,
            date: notificationData.date,
            snoozeMinutes: 5
          });
        }
      })
    );
    return;
  }

  // Default: Open or focus the app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // If app is already open, focus it and send refresh message
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Send message to app to refresh and scroll
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            action: 'refresh-and-scroll'
          });
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
