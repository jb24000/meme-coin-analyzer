// Meme Coin Analyzer - Service Worker
// Version 1.0.0

const CACHE_NAME = 'meme-coin-analyzer-v1.0.0';
const DATA_CACHE_NAME = 'meme-coin-analyzer-data-v1.0.0';

// Static assets to cache immediately
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/icons/icon-192x192.png',
  '/assets/icons/icon-512x512.png',
  // Add other static assets as needed
];

// API endpoints to cache with network-first strategy
const API_CACHE_PATTERNS = [
  /^https:\/\/api\.dexscreener\.com/,
  /^https:\/\/api\.etherscan\.io/,
  /^https:\/\/api\.coingecko\.com/,
  /^https:\/\/api\.twitter\.com/
];

// Offline fallback responses
const OFFLINE_FALLBACKS = {
  '/': '/index.html',
  '/api/': {
    error: 'Network unavailable. Using cached data.',
    offline: true,
    timestamp: Date.now()
  }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Static assets cached successfully');
        // Force activation of new service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches
            if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Handle different types of requests
  if (isAPIRequest(request.url)) {
    // API requests: Network first, cache as fallback
    event.respondWith(handleAPIRequest(request));
  } else if (isStaticAsset(request.url)) {
    // Static assets: Cache first, network as fallback
    event.respondWith(handleStaticRequest(request));
  } else {
    // Default: Cache first for HTML, network first for others
    event.respondWith(handleDefaultRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(DATA_CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error(`HTTP ${networkResponse.status}`);
    
  } catch (error) {
    console.log('[SW] Network request failed, trying cache:', request.url);
    
    // Try cache as fallback
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Add offline indicator to cached responses
      const modifiedResponse = addOfflineHeaders(cachedResponse);
      return modifiedResponse;
    }
    
    // Return offline fallback
    return createOfflineFallback(request);
  }
}

// Handle static asset requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback to network
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
    
  } catch (error) {
    console.log('[SW] Static asset request failed:', request.url);
    return new Response('Asset not available offline', { status: 404 });
  }
}

// Handle default requests
async function handleDefaultRequest(request) {
  try {
    // For HTML pages, try cache first
    if (request.headers.get('accept')?.includes('text/html')) {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Try network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Ultimate fallback
    if (request.headers.get('accept')?.includes('text/html')) {
      return caches.match('/index.html');
    }
    
    return new Response('Not available offline', { status: 404 });
  }
}

// Helper functions
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url));
}

function isStaticAsset(url) {
  return url.includes('/assets/') || 
         url.includes('/icons/') || 
         url.includes('.css') || 
         url.includes('.js') ||
         url.includes('.png') ||
         url.includes('.jpg') ||
         url.includes('.svg');
}

function addOfflineHeaders(response) {
  const headers = new Headers(response.headers);
  headers.set('X-Served-By', 'ServiceWorker');
  headers.set('X-Cache-Status', 'HIT');
  headers.set('X-Offline-Mode', 'true');
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

function createOfflineFallback(request) {
  const fallbackData = {
    error: 'You are offline. This is cached or demo data.',
    offline: true,
    timestamp: Date.now(),
    url: request.url
  };
  
  return new Response(JSON.stringify(fallbackData), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Offline-Mode': 'true'
    }
  });
}

// Background Sync - for tracking token outcomes when back online
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'token-outcome-sync') {
    event.waitUntil(syncTokenOutcomes());
  }
  
  if (event.tag === 'analysis-data-sync') {
    event.waitUntil(syncAnalysisData());
  }
});

// Sync token outcome data
async function syncTokenOutcomes() {
  try {
    console.log('[SW] Syncing token outcomes...');
    
    // Get pending outcomes from IndexedDB or localStorage
    const pendingOutcomes = JSON.parse(
      localStorage.getItem('pendingOutcomes') || '[]'
    );
    
    for (const outcome of pendingOutcomes) {
      try {
        // Send to your backend API
        await fetch('/api/sync/outcomes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(outcome)
        });
        
        console.log('[SW] Outcome synced:', outcome.contractAddress);
      } catch (error) {
        console.error('[SW] Failed to sync outcome:', error);
      }
    }
    
    // Clear synced outcomes
    localStorage.setItem('pendingOutcomes', '[]');
    
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}

// Sync analysis data
async function syncAnalysisData() {
  try {
    console.log('[SW] Syncing analysis data...');
    
    const analysisHistory = JSON.parse(
      localStorage.getItem('memeAnalysisHistory') || '[]'
    );
    
    const unsynced = analysisHistory.filter(item => !item.synced);
    
    for (const analysis of unsynced) {
      try {
        await fetch('/api/sync/analysis', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(analysis)
        });
        
        analysis.synced = true;
      } catch (error) {
        console.error('[SW] Failed to sync analysis:', error);
      }
    }
    
    localStorage.setItem('memeAnalysisHistory', JSON.stringify(analysisHistory));
    
  } catch (error) {
    console.error('[SW] Analysis sync failed:', error);
  }
}

// Push notifications (optional feature)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'New update available',
    icon: '/assets/icons/icon-192x192.png',
    badge: '/assets/icons/badge-72x72.png',
    tag: data.tag || 'default',
    requireInteraction: data.requireInteraction || false,
    actions: [
      {
        action: 'view',
        title: 'View Details',
        icon: '/assets/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/assets/icons/action-dismiss.png'
      }
    ],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    }
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Meme Coin Analyzer', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data;
  
  if (action === 'dismiss') {
    return;
  }
  
  // Default action or 'view' action
  const urlToOpen = notificationData?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Try to focus existing window
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Open new window if none exists
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling for client communication
self.addEventListener('message', (event) => {
  const { action, data } = event.data;
  
  switch (action) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CACHE_ANALYSIS':
      cacheAnalysisData(data);
      break;
      
    case 'QUEUE_OUTCOME':
      queueOutcomeSync(data);
      break;
      
    case 'GET_CACHE_INFO':
      getCacheInfo().then(info => {
        event.ports[0].postMessage(info);
      });
      break;
      
    default:
      console.log('[SW] Unknown message action:', action);
  }
});

// Cache analysis data locally
async function cacheAnalysisData(analysisData) {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const response = new Response(JSON.stringify(analysisData), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/analysis/${analysisData.contractAddress}`, response);
    console.log('[SW] Analysis data cached:', analysisData.contractAddress);
  } catch (error) {
    console.error('[SW] Failed to cache analysis:', error);
  }
}

// Queue outcome for background sync
function queueOutcomeSync(outcomeData) {
  try {
    const pending = JSON.parse(localStorage.getItem('pendingOutcomes') || '[]');
    pending.push(outcomeData);
    localStorage.setItem('pendingOutcomes', JSON.stringify(pending));
    
    // Register for background sync
    self.registration.sync.register('token-outcome-sync');
    
    console.log('[SW] Outcome queued for sync:', outcomeData.contractAddress);
  } catch (error) {
    console.error('[SW] Failed to queue outcome:', error);
  }
}

// Get cache information
async function getCacheInfo() {
  const cacheNames = await caches.keys();
  const info = {
    caches: cacheNames.length,
    version: CACHE_NAME,
    timestamp: Date.now()
  };
  
  // Get cache sizes
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    info[cacheName] = keys.length;
  }
  
  return info;
}

// Periodic cache cleanup
setInterval(async () => {
  try {
    const cache = await caches.open(DATA_CACHE_NAME);
    const requests = await cache.keys();
    
    // Remove cached API responses older than 1 hour
    const cutoff = Date.now() - (60 * 60 * 1000);
    
    for (const request of requests) {
      const response = await cache.match(request);
      const timestamp = response.headers.get('X-Cache-Timestamp');
      
      if (timestamp && parseInt(timestamp) < cutoff) {
        await cache.delete(request);
      }
    }
    
    console.log('[SW] Cache cleanup completed');
  } catch (error) {
    console.error('[SW] Cache cleanup failed:', error);
  }
}, 30 * 60 * 1000); // Run every 30 minutes

console.log('[SW] Service Worker loaded successfully');
