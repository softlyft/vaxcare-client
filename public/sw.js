// Service Worker for VaxCare Africa
const CACHE_NAME = 'vaxcare-v1';
const urlsToCache = [
  '/',
  '/dashboard',
  '/patients',
  '/sync',
  '/login',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip external URLs and non-http requests
  if (!event.request.url.startsWith('http') || !event.request.url.includes('localhost:3000')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }
        
        // Fetch from network with proper redirect handling
        return fetch(event.request, {
          redirect: 'follow',
          mode: 'cors'
        }).then((response) => {
          // If it's a redirect response, cache the final destination
          if (response.redirected) {
            console.log('Request was redirected to:', response.url);
          }
          return response;
        }).catch((error) => {
          console.log('Fetch failed for:', event.request.url, error);
          // Return a fallback response for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/dashboard');
          }
          // For other requests, let them fail gracefully
          return new Response('Network error', { status: 408 });
        });
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
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
