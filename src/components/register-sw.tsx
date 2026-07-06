"use client";

import { useEffect } from "react";

export function RegisterSW() {
    useEffect(() => {
        if ("serviceWorker" in navigator) {
            navigator.serviceWorker.register("/sw.js").catch(() => {
                // Enregistrement silencieux : l'app fonctionne sans le SW.
            });
        }
    }, []);

    return null;
}
