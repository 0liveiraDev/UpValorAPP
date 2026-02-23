// Service Worker para UpValor PWA
const CACHE_NAME = 'upvalor-v1';
const STATIC_ASSETS = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/icon-512.png',
];

// Instalar e fazer cache dos assets estáticos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Ativar e limpar caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: network first, fallback para cache
self.addEventListener('fetch', (event) => {
    // Não interceptar requests de API
    if (event.request.url.includes('/api/')) return;

    event.respondWith(
        fetch(event.request)
            .then((res) => {
                // Guardar cópia no cache
                if (res && res.status === 200 && event.request.method === 'GET') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return res;
            })
            .catch(() => caches.match(event.request))
    );
});
