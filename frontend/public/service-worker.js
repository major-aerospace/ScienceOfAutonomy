/* Science of Autonomy — Service Worker
 * Strategy:
 *   - App shell: cache-first with stale-while-revalidate fallback
 *   - API JSON (lessons, tracks, social-clips): network-first, fallback to cache
 *   - Static assets (.js, .css, fonts): cache-first
 *   - 3D / WASM / GLB: cache-first (rarely change)
 * Designed for the visited-lessons offline-read MVP requirement.
 */

const VERSION = "soa-v2";
const SHELL_CACHE = `${VERSION}-shell`;
const API_CACHE = `${VERSION}-api`;
const ASSET_CACHE = `${VERSION}-assets`;

const SHELL_URLS = [
  "/",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

function isApi(url) {
  return url.pathname.startsWith("/api/");
}
function isStaticAsset(url) {
  return /\.(js|css|woff2?|ttf|otf|png|jpg|jpeg|svg|webp|gltf|glb|wasm)$/.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Only handle same-origin + same-protocol; skip cross-origin (fonts, gstatic etc.)
  // (Fonts from Google can still be cached opaquely if requested)
  if (isApi(url)) {
    // Cache lesson + tracks + social-clips for offline reading
    if (/\/api\/(tracks|lessons|studio\/social-clips)/.test(url.pathname)) {
      event.respondWith(networkFirst(req, API_CACHE));
      return;
    }
    // Other API: just network
    return;
  }
  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(req, ASSET_CACHE));
    return;
  }
  // Navigation requests -> app shell fallback
  if (req.mode === "navigate") {
    event.respondWith(networkFirst(req, SHELL_CACHE, "/"));
    return;
  }
});

async function networkFirst(req, cacheName, fallbackPath) {
  const cache = await caches.open(cacheName);
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (e) {
    const cached = await cache.match(req);
    if (cached) return cached;
    if (fallbackPath) {
      const fb = await caches.match(fallbackPath);
      if (fb) return fb;
    }
    return new Response(JSON.stringify({ offline: true }), { status: 503, headers: { "Content-Type": "application/json" } });
  }
}

async function cacheFirst(req, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(req);
  if (cached) {
    // Refresh in background
    fetch(req).then((res) => { if (res && res.status === 200) cache.put(req, res.clone()); }).catch(() => {});
    return cached;
  }
  try {
    const res = await fetch(req);
    if (res && res.status === 200) cache.put(req, res.clone());
    return res;
  } catch (e) {
    return new Response("", { status: 503 });
  }
}
