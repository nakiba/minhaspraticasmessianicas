// Service Worker do Diário de Práticas Messiânicas
// Estratégia: tenta a rede primeiro; se não houver internet, usa a cópia
// salva em cache da última vez que o app foi aberto online.
// O HTML, o manifesto, os ícones e a imagem do cabeçalho são cacheados
// na primeira visita online, para o app abrir também offline.

const APP_VERSION = '1.14.4';
const CACHE_NAME = 'praticas-messianicas-cache-v' + APP_VERSION;

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => {
      return Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

// A própria página avisa o Service Worker qual é a sua URL exata assim que
// carrega, para garantir que o cache seja salvo já na primeira visita —
// sem precisar de um segundo carregamento.
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URL' && event.data.url) {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const response = await fetch(event.data.url, {cache: 'no-store'});
          await cache.put(event.data.url, response);
        } catch (err) {
          // sem internet no momento da mensagem; nada a fazer
        }
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  // Só trata requisições de navegação/página (GET). Ignora o resto.
  if (event.request.method !== 'GET') return;

  const reqUrl = new URL(event.request.url);
  // Deixa o navegador atualizar o próprio Service Worker. Interceptar
  // sw.js no iOS/Safari atrasa ou impede a troca de versão.
  if (reqUrl.origin === self.location.origin && reqUrl.pathname.endsWith('/sw.js')) {
    return;
  }

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);

    try {
      const networkResponse = await fetch(event.request);
      try {
        await cache.put(event.request, networkResponse.clone());
      } catch (putErr) {
        // Alguns tipos de requisição não podem ser salvos em cache;
        // isso não deve impedir a resposta normal ao usuário.
      }
      return networkResponse;
    } catch (err) {
      // Sem internet: tenta servir a cópia salva em cache
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) return cachedResponse;

      // Nunca deixa o navegador estourar um erro cru (evita a tela de
      // erro do Safari) — responde com uma mensagem amigável em texto.
      return new Response(
        'Você está offline e esta página ainda não foi salva neste dispositivo. ' +
        'Abra o app uma vez com internet para que ele funcione offline depois.',
        { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } }
      );
    }
  })());
});
