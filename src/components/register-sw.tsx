"use client";

import { useEffect } from "react";

export function RegisterSW() {
    useEffect(() => {
        // En dev, les fichiers /_next/static ne sont pas versionnés : pas de cache.
        if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // Enregistrement silencieux : l'app fonctionne sans le SW.
            });
        }
    }, []);

    return null;
}
