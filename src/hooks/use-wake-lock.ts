"use client";

import { useEffect } from "react";

/** Garde l'écran allumé tant que `active` est vrai (séance en cours). */
export function useWakeLock(active: boolean) {
    useEffect(() => {
        if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) return;
        let lock: WakeLockSentinel | null = null;
        let stopped = false;

        async function request() {
            try {
                lock = await navigator.wakeLock.request("screen");
            } catch {
                // Refusé (économie d'énergie…) : l'écran se mettra en veille normalement.
            }
        }

        // Le verrou tombe quand l'app passe en arrière-plan : on le reprend au retour.
        function onVisible() {
            if (document.visibilityState === "visible" && !stopped) request();
        }

        request();
        document.addEventListener("visibilitychange", onVisible);
        return () => {
            stopped = true;
            document.removeEventListener("visibilitychange", onVisible);
            lock?.release().catch(() => {});
        };
    }, [active]);
}
