// Service worker : rend la PWA installable, garde une page hors ligne, et met en
// cache UNIQUEMENT les fichiers statiques versionnés de Next (/_next/static, nom
// de fichier haché donc immuable). Les pages et les données passent toujours par
// le réseau : jamais de séance ou de chiffre périmé.
const CACHE = "sport58-v1";
const OFFLINE_URL = "/offline.html";
const PRECACHE = [OFFLINE_URL, "/icon.svg", "/icon-192.png"];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)));
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
            .then(() => self.clients.claim()),
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    // Navigation : réseau d'abord, page hors ligne si le réseau ne répond pas.
    if (request.mode === "navigate") {
        event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
        return;
    }

    const url = new URL(request.url);
    if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
        event.respondWith(
            caches.match(request).then(
                (hit) =>
                    hit ??
                    fetch(request).then((res) => {
                        if (res.ok) {
                            const copy = res.clone();
                            caches.open(CACHE).then((cache) => cache.put(request, copy));
                        }
                        return res;
                    }),
            ),
        );
    }
});
