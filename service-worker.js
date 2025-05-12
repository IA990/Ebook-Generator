// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

if (workbox) {
  console.log('Workbox is loaded');

  // Precache manifest will be injected by Workbox during build
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);

  // Cache PDF-lib and fonts as critical assets
  workbox.routing.registerRoute(
    ({url}) => url.href.includes('pdf-lib.min.js') || url.href.includes('fonts.googleapis.com'),
    new workbox.strategies.CacheFirst({
      cacheName: 'critical-assets',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
        }),
      ],
    })
  );

  // NetworkFirst strategy for API calls
  workbox.routing.registerRoute(
    ({url}) => url.pathname.startsWith('/api/'),
    new workbox.strategies.NetworkFirst({
      cacheName: 'api-cache',
      networkTimeoutSeconds: 10,
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 5 * 60, // 5 minutes
        }),
      ],
    })
  );

  // Fallback to offline.html for navigation requests when offline
  workbox.routing.setCatchHandler(async ({event}) => {
    if (event.request.destination === 'document') {
      return caches.match('/offline.html');
    }
    return Response.error();
  });

  // Background sync for failed API requests
  const bgSyncPlugin = new workbox.backgroundSync.BackgroundSyncPlugin('apiQueue', {
    maxRetentionTime: 24 * 60, // Retry for max of 24 Hours
  });

  workbox.routing.registerRoute(
    /\/api\/.*\/*.json/,
    new workbox.strategies.NetworkOnly({
      plugins: [bgSyncPlugin],
    }),
    'POST'
  );

} else {
  console.log('Workbox could not be loaded. No offline support.');
}
