// Service Worker para UpValor PWA - v4 (cache seguro)
const CACHE_NAME = 'upvalor-v4';
const STATIC_ASSETS = [
    '/manifest.json',
    '/logo.png',
];

// Instalar e fazer cache APENAS dos assets estáticos mínimos
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// Ativar e limpar TODOS os caches antigos
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch: NUNCA cachear HTML/JS/CSS — apenas imagens e manifest
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Não interceptar requests de API
    if (url.pathname.startsWith('/api/')) return;

    // Não interceptar navegação (HTML) nem scripts (JS/CSS)
    // Isso garante que o navegador SEMPRE busque a versão mais recente do app
    const ext = url.pathname.split('.').pop();
    if (
        event.request.mode === 'navigate' ||
        ext === 'js' || ext === 'css' || ext === 'html' ||
        url.pathname === '/' ||
        url.pathname.startsWith('/_next/')
    ) {
        return; // Deixa o navegador buscar normalmente do servidor
    }

    // Para imagens e manifest: cache-first (rápido e não muda frequentemente)
    event.respondWith(
        caches.match(event.request).then((cached) => {
            return cached || fetch(event.request).then((res) => {
                if (res && res.status === 200 && event.request.method === 'GET') {
                    const clone = res.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                }
                return res;
            });
        })
    );
});
