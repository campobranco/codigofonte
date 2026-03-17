/* SW Kill Switch - Campo Branco */
/* Este arquivo força a desinstalação de qualquer Service Worker ativo e limpa os caches. */

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  self.registration.unregister()
    .then(() => self.clients.matchAll())
    .then((clients) => {
      clients.forEach(client => {
        if (client.url && 'navigate' in client) {
          client.navigate(client.url);
        }
      });
    });
});
