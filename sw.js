/**
 * SpaceFlow — Service Worker
 * Cache-first for shell assets; network-first for JSON presets.
 */

const CACHE_NAME = 'spaceflow-v3';

// Core shell assets to pre-cache on install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './player.html',
  './welcome.html',
  './manifest.json',

  // CSS
  './css/main.css',
  './css/player.css',
  './css/canvas.css',
  './css/controls.css',
  './css/states.css',
  './css/markdown-viewer.css',

  // JS entry points
  './js/main.js',
  './js/player.js',

  // JS modules
  './js/config/constants.js',
  './js/config/defaults.js',
  './js/core/Camera.js',
  './js/core/colorUtils.js',
  './js/core/Emitter.js',
  './js/core/Projection.js',
  './js/core/utils.js',
  './js/core/ZigzagLine.js',
  './js/export/DepthExporter.js',
  './js/export/PNGExporter.js',
  './js/export/SVGExporter.js',
  './js/export/VideoRecorder.js',
  './js/input/KeyboardHandler.js',
  './js/input/MouseHandler.js',
  './js/rendering/SketchFactory.js',
  './js/storage/localStorage.js',
  './js/storage/StateManager.js',
  './js/ui/UIController.js',

  // Libraries
  './lib/p5.min.js',
  './lib/CCapture.all.min.js',
  './lib/jszip.min.js',
  './lib/marked.min.js',

  // Config
  './config/appInfo.json',
  './config/keyboardShortcuts.json',
  './config/overlayPresets.js',
  './config/uiPresets.json',
  './config/presets/manifest.json',
];

// ─── Install: pre-cache shell ────────────────────────────────────────────────

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ─── Activate: purge old caches ──────────────────────────────────────────────

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: stale-while-revalidate ───────────────────────────────────────────

self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET requests from our own origin
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  // Network-first for JSON preset files (user content, must stay fresh)
  if (request.url.includes('/config/presets/') && request.url.endsWith('.json')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
