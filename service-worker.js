/* SkillUp Juniors Attendance — offline service worker.
   Active only when the app is served over http(s) (e.g. GitHub Pages / Netlify).
   Caches the app shell so it loads with no internet. */
const CACHE = 'skillup-att-v3';
const ASSETS = [
  './',
  'index.html',
  'xlsx.full.min.js',
  'manifest.webmanifest'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
          .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // ONLY handle this app's own files. Anything cross-origin — the Google Sheets
  // sync endpoint, CDNs, etc. — must go straight to the network untouched,
  // otherwise the service worker breaks those requests (CORS / network errors).
  let url;
  try { url = new URL(e.request.url); } catch (_) { return; }
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => hit))
  );
});
