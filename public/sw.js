// FulQrun Service Worker
// Provides offline capability and caching for the PWA

const CACHE_NAME = 'fulqrun-v1.0.0'
const STATIC_CACHE_NAME = 'fulqrun-static-v1.0.0'
const DYNAMIC_CACHE_NAME = 'fulqrun-dynamic-v1.0.0'

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/leads',
  '/opportunities',
  '/contacts',
  '/companies',
  '/auth/login',
  '/manifest.json',
  '/offline.html'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  '/api/',
  '/supabase/'
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve cached content when offline
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return
  }
  
  event.respondWith(
    handleRequest(request)
  )
})

async function handleRequest(request) {
  const url = new URL(request.url)
  
  try {
    // Try network first for API requests
    if (isApiRequest(url)) {
      return await networkFirstStrategy(request)
    }
    
    // Try cache first for static assets
    if (isStaticAsset(url)) {
      return await cacheFirstStrategy(request)
    }
    
    // Default to network first with cache fallback
    return await networkFirstStrategy(request)
    
  } catch (error) {
    console.error('Service Worker: Request failed', error)
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return await getOfflinePage()
    }
    
    // Return cached version if available
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return a generic offline response
    return new Response('Offline - Content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    })
  }
}

// Cache first strategy - check cache first, then network
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    throw error
  }
}

// Network first strategy - try network first, then cache
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

// Check if request is for an API endpoint
function isApiRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => url.pathname.startsWith(pattern))
}

// Check if request is for a static asset
function isStaticAsset(url) {
  const staticExtensions = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2']
  return staticExtensions.some(ext => url.pathname.endsWith(ext))
}

// Get offline page
async function getOfflinePage() {
  const cache = await caches.open(STATIC_CACHE_NAME)
  const offlinePage = await cache.match('/offline.html')
  
  if (offlinePage) {
    return offlinePage
  }
  
  // Return a simple offline page if not cached
  return new Response(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>FulQrun - Offline</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f9fafb;
          color: #374151;
          text-align: center;
        }
        .container {
          max-width: 400px;
          margin: 100px auto;
          background: white;
          padding: 40px;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        h1 { color: #4f46e5; margin-bottom: 20px; }
        p { margin-bottom: 30px; line-height: 1.6; }
        button {
          background: #4f46e5;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 16px;
        }
        button:hover { background: #4338ca; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>📱 FulQrun</h1>
        <h2>You're Offline</h2>
        <p>It looks like you're not connected to the internet. Some features may not be available, but you can still view cached content.</p>
        <button onclick="window.location.reload()">Try Again</button>
      </div>
    </body>
    </html>
  `, {
    headers: {
      'Content-Type': 'text/html'
    }
  })
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Sync offline data when connection is restored
    console.log('Service Worker: Performing background sync')
    
    // You can implement specific sync logic here
    // For example, sync offline form submissions, cached API calls, etc.
    
  } catch (error) {
    console.error('Service Worker: Background sync failed', error)
  }
}

// Push notification handling (for future implementation)
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  if (event.data) {
    const data = event.data.json()
    
    const options = {
      body: data.body || 'New notification from FulQrun',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: data.tag || 'fulqrun-notification',
      data: data.data || {}
    }
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'FulQrun', options)
    )
  }
})

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification clicked')
  
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow('/dashboard')
  )
})
