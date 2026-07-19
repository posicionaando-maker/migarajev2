// ====== SERVICE WORKER AVANZADO ======

const CACHE_NAME = 'garageshop-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/js/app.js',
    '/js/search.js',
    '/js/pwa.js',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap'
];

const DATA_CACHE = 'garageshop-data-v1';

// ====== INSTALACIÓN ======
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => cache.addAll(STATIC_ASSETS)),
            caches.open(DATA_CACHE)
        ]).then(() => self.skipWaiting())
    );
});

// ====== ACTIVACIÓN ======
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// ====== FETCH ======
self.addEventListener('fetch', event => {
    const request = event.request;
    const url = new URL(request.url);
    
    // Estrategias de caché según tipo de recurso
    
    // 1. Archivos estáticos (CSS, JS, HTML)
    if (STATIC_ASSETS.includes(url.pathname) || url.pathname === '/') {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                }).catch(() => {
                    return caches.match('/index.html');
                });
            })
        );
        return;
    }
    
    // 2. Datos (CSV, JSON)
    if (url.pathname.includes('/data/') || url.pathname.includes('.csv')) {
        event.respondWith(
            fetch(request).then(response => {
                const clone = response.clone();
                caches.open(DATA_CACHE).then(cache => {
                    cache.put(request, clone);
                });
                return response;
            }).catch(() => {
                return caches.match(request);
            })
        );
        return;
    }
    
    // 3. Imágenes
    if (url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
        event.respondWith(
            caches.match(request).then(cached => {
                if (cached) return cached;
                return fetch(request).then(response => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
                    return response;
                }).catch(() => {
                    // Imagen por defecto
                    return caches.match('/assets/default-image.jpg');
                });
            })
        );
        return;
    }
    
    // 4. API y otros
    event.respondWith(
        fetch(request).catch(() => {
            return new Response('Offline', { status: 503 });
        })
    );
});

// ====== MENSAJES ======
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// ====== NOTIFICACIONES PUSH ======
self.addEventListener('push', event => {
    const data = event.data ? event.data.json() : {};
    const options = {
        body: data.body || '¡Nuevos productos disponibles!',
        icon: '/assets/icons/icon-192x192.png',
        badge: '/assets/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: data.url || '/',
        actions: [
            { action: 'open', title: 'Ver productos' },
            { action: 'close', title: 'Cerrar' }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'GarageShop', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    
    if (event.action === 'open') {
        event.waitUntil(
            clients.openWindow(event.notification.data || '/')
        );
    }
});

console.log('📦 Service Worker cargado');
