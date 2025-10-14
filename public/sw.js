const CACHE_NAME = 'dance4you-v1';
const urlsToCache = [
  '/',
  '/events',
  '/submit-event',
  '/learn-live',
  '/regular-classes',
  '/chat',
  '/manifest.json',
  '/logo-dance.svg',
  '/logo-dance1.svg',
  '/hero-placeholder.svg'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  event.waitUntil(self.clients.claim());
});

// Push notification event
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  let notificationData = {
    title: 'Dance 4 You',
    body: 'You have a new message',
    icon: '/logo-dance.svg',
    badge: '/logo-dance.svg',
    tag: 'chat-message',
    data: {
      url: '/chat'
    }
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        title: data.title || 'Dance 4 You',
        body: data.body || 'You have a new message',
        icon: data.icon || '/logo-dance.svg',
        badge: data.badge || '/logo-dance.svg',
        tag: data.tag || 'chat-message',
        data: {
          url: data.url || '/chat',
          conversationId: data.conversationId,
          messageId: data.messageId
        },
        actions: [
          {
            action: 'reply',
            title: 'Reply',
            icon: '/logo-dance.svg'
          },
          {
            action: 'view',
            title: 'View Chat',
            icon: '/logo-dance.svg'
          }
        ],
        requireInteraction: true,
        silent: false
      };
    } catch (error) {
      console.error('Error parsing push notification data:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;
  
  if (action === 'reply') {
    // Open chat with focus on reply
    event.waitUntil(
      clients.openWindow(data.url + '?reply=true&conversation=' + (data.conversationId || ''))
    );
  } else if (action === 'view' || !action) {
    // Open chat normally
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then((clientList) => {
          // Check if chat is already open
          for (const client of clientList) {
            if (client.url.includes('/chat') && 'focus' in client) {
              return client.focus();
            }
          }
          // Open new chat window
          if (clients.openWindow) {
            return clients.openWindow(data.url || '/chat');
          }
        })
    );
  }
});

// Background sync for offline message sending
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'chat-sync') {
    event.waitUntil(syncChatMessages());
  }
});

// Sync chat messages when back online
async function syncChatMessages() {
  try {
    // This would sync with your IndexedDB storage
    console.log('Syncing chat messages...');
    
    // Get pending messages from IndexedDB
    const db = await openChatDB();
    const transaction = db.transaction(['pendingMessages'], 'readonly');
    const store = transaction.objectStore('pendingMessages');
    const pendingMessages = await getAllFromStore(store);
    
    // Send pending messages to server
    for (const message of pendingMessages) {
      try {
        const response = await fetch('/api/chat/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message)
        });
        
        if (response.ok) {
          // Remove from pending messages
          const deleteTransaction = db.transaction(['pendingMessages'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('pendingMessages');
          await deleteFromStore(deleteStore, message.id);
        }
      } catch (error) {
        console.error('Failed to sync message:', error);
      }
    }
  } catch (error) {
    console.error('Chat sync failed:', error);
  }
}

// Helper functions for IndexedDB operations
function openChatDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('DanceForYouChat', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function deleteFromStore(store, key) {
  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}