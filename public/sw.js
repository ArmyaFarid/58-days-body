// Service worker minimal : rend la PWA installable. Pas de cache agressif pour
// éviter de servir des données périmées (l'app dépend de données à jour).
self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", () => {
    // Passthrough réseau — un handler fetch est requis pour l'installabilité.
});
