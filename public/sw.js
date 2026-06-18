/**
 * Service worker do SalaLivre (PWA).
 *
 * Estratégia conservadora e segura para um app autenticado:
 * - NUNCA faz cache de respostas de API (/api/*) nem de HTML de páginas
 *   (navegações) — esses conteúdos podem ser sensíveis/personalizados e
 *   devem sempre vir frescos do servidor.
 * - Faz cache-first apenas de assets estáticos versionados
 *   (/_next/static) e dos ícones — seguro porque têm hash/são públicos.
 * - Em navegações sem rede, mostra /offline.html.
 * - Só intercepta GET same-origin.
 */
const CACHE = "salalivre-v1";
const PRECACHE = ["/offline.html", "/icons/icon-192.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) =>
        Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
      )
  );
  self.clients.claim();
});

function ehEstaticoCacheavel(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return; // nunca cachear API

  // Navegações (HTML): network-first, com fallback offline. Sem cache.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() => caches.match("/offline.html"))
    );
    return;
  }

  // Assets estáticos versionados: cache-first.
  if (ehEstaticoCacheavel(url)) {
    event.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ||
          fetch(request).then((resposta) => {
            const copia = resposta.clone();
            caches.open(CACHE).then((cache) => cache.put(request, copia));
            return resposta;
          })
      )
    );
  }
});
