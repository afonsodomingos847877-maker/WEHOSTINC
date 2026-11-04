// Service Worker para WEHOSTHERE PWA
const CACHE_NAME = 'wehosthere-v6';
const urlsToCache = [
  '/',
  '/webmail',
  '/dashboard',
  '/dashboard/email',
  '/dashboard/notifications',
  '/dashboard/settings',
  '/admin',
  '/admin/settings',
  '/manifest.json',
  '/manifest-webmail.json'
];

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        // Forçar ativação imediata do novo service worker
        return self.skipWaiting();
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removendo cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Reclamar clientes imediatamente
      return self.clients.claim();
    })
  );
});

// Interceptação de requisições - Network First para navegação, Cache First para assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorar requisições POST, PUT, DELETE, etc.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Ignorar requisições para Cloudinary e outros domínios externos
  if (url.hostname.includes('cloudinary.com') || 
      url.hostname.includes('res.cloudinary.com') ||
      url.hostname !== self.location.hostname) {
    return;
  }
  
  // Ignorar requisições para API e payloads RSC do Next.js
  if (url.pathname.startsWith('/api/') || url.searchParams.has('_rsc')) {
    return;
  }
  
  // Para requisições de navegação ou bundles JS do Next.js, usar sempre Network First
  if (event.request.mode === 'navigate' || url.pathname.startsWith('/_next/')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }
  
  // Para outros recursos, usar Cache First
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - retorna resposta do cache
        if (response) {
          return response;
        }
        // Clone da requisição
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Verificar se resposta válida
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clonar resposta
          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        });
      })
  );
});

// Push notification handler com suporte a payloads JSON estruturados e som/vibração
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push recebido:', event);
  
  let title = 'WEHOSTHERE Notificação';
  let message = 'Nova notificação da WEHOSTHERE';
  let targetUrl = '/admin?tab=orders';
  let icon = '/mascote-transparent.png';
  let badge = '/mascote-transparent.png';
  let tag = 'wehosthere-alert';

  if (event.data) {
    try {
      const data = event.data.json();
      if (data.title) title = data.title;
      if (data.message) message = data.message;
      else if (data.body) message = data.body;
      if (data.icon) icon = data.icon;
      if (data.badge) badge = data.badge;
      if (data.tag) tag = data.tag;
      if (data.data?.url) targetUrl = data.data.url;
      else if (data.url) targetUrl = data.url;
    } catch (_) {
      message = event.data.text();
    }
  }

  // Determinar label da ação com base no URL de destino
  const actionLabel = targetUrl.includes('/revista') ? 'Ler história' : 'Abrir';

  const options = {
    body: message,
    icon: icon,
    badge: badge,
    vibrate: [200, 100, 200, 100, 200],
    tag: tag,
    renotify: true,
    data: {
      url: targetUrl,
      dateOfArrival: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: actionLabel,
        icon: icon
      },
      {
        action: 'close',
        title: 'Dispensar'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler com foco de janela e navegação direta
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificação clicada:', event);
  
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/admin?tab=orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Se já houver aba aberta do site, foca e redireciona
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Se não houver aba aberta, abre uma nova
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

