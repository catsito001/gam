// sw.js - Service Worker para Narrion (Gawipy)

// IMPORTANTE: Cambia este número de versión CADA VEZ que hagas una actualización.
// Por ejemplo: 'narrion-cache-v1', 'narrion-cache-v2', etc.
// Usamos 'narrion-cache-v1' como la primera versión para el sitio de mudanza.
const CACHE_NAME = 'narrion-cache-v1';

// Archivos y recursos que queremos cachear.
// He incluido los archivos mencionados en tu index.html que no son externos (CDN).
const urlsToCache = [
  '/',
  'index.html',
  'banner.png', // Tu imagen de banner
  // Puedes añadir aquí otros archivos PWA si los tienes:
  // 'manifest.json',
  // 'icons/icon-192.png',
  // 'icons/icon-512.png'
];

// Evento 'install': Se dispara cuando el Service Worker se instala.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Cache abierto, guardando archivos de la app.');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Esta línea es CRUCIAL. Fuerza al nuevo SW a activarse en cuanto termina
        // la instalación, sin quedarse en estado de "espera".
        return self.skipWaiting();
      })
      .catch(err => {
        console.error('Service Worker: Fallo al cachear archivos.', err);
      })
  );
});

// Evento 'activate': Se dispara cuando el nuevo Service Worker se activa.
self.addEventListener('activate', event => {
  console.log('Service Worker: Activando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Si el nombre del caché no es el actual, lo eliminamos.
          // Esto es VITAL para limpiar las versiones antiguas de tu app (incluyendo Gawipy si existía).
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Borrando caché antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Le dice al SW que tome control de la página inmediatamente.
        return self.clients.claim();
    })
  );
});

// Evento 'fetch': Estrategia "Cache First" o "Cache Only" (si está cacheado).
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, lo devuelve.
        if (response) {
          return response;
        }
        // Si no está en caché, hace una solicitud de red.
        return fetch(event.request);
      }
    )
  );
});
