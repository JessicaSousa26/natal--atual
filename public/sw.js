/* sw.js — PWA cache (static assets + HTML fallback) */
const VERSION = 'torre4-v1.5.2';
const STATIC_CACHE = `static-${VERSION}`;

const CORE_ASSETS = [
  './',
  './index.html',
  './ranking.html',
  './encerramento.html',
  './manifest.json',
  './js/app.js',
  './js/firebase.js',
  './js/theme.js',
  './assets/ornament.svg',
  './assets/jingle-bells.wav',
  './assets/jingle-bells.mp3'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(STATIC_CACHE).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k.startsWith('static-') && k !== STATIC_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// Strategy: HTML -> network first; other -> cache first
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(req).then(res => {
        // Guard: só tentar armazenar respostas válidas e de esquemas http(s)
        try {
          const url = new URL(req.url);
          if ((url.protocol === 'http:' || url.protocol === 'https:') && res && res.status === 200) {
            const copy = res.clone();
            caches.open(STATIC_CACHE).then(c => c.put(req, copy)).catch(() => {});
          }
        } catch (err) {
          // url parsing ou cache falhou — ignorar para não poluir o log
        }
        return res;
      }).catch(() => caches.match(req).then(r => r || caches.match('./index.html')))
    );
    return;
  }
    e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      try {
        const url = new URL(req.url);
        if ((url.protocol === 'http:' || url.protocol === 'https:') && res && res.status === 200) {
          const copy = res.clone();
          caches.open(STATIC_CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
      } catch (err) {
        // ignorar URLs inválidas (ex: chrome-extension://) ou erros de cache
      }
      return res;
    }).catch(() => cached))
  );
});
