"use client";

import { useEffect, useRef } from "react";

const DELAY_MS = 400;
const EVERY_MS = 90;

/**
 * Bouton −/+ : un appui agit une fois, un appui long répète l'action en rafale.
 * Le clavier (Entrée, Espace) déclenche une seule fois via onClick.
 */
export function useRepeatPress(action: () => void) {
    const latest = useRef(action);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const repeat = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        latest.current = action;
    });

    function stop() {
        if (timer.current) clearTimeout(timer.current);
        if (repeat.current) clearInterval(repeat.current);
        timer.current = null;
        repeat.current = null;
    }

    useEffect(() => stop, []);

    return {
        onPointerDown(e: React.PointerEvent) {
            if (e.button !== 0) return;
            if (navigator.vibrate) navigator.vibrate(8);
            latest.current();
            timer.current = setTimeout(() => {
                repeat.current = setInterval(() => latest.current(), EVERY_MS);
            }, DELAY_MS);
        },
        onPointerUp: stop,
        onPointerLeave: stop,
        onPointerCancel: stop,
        onClick(e: React.MouseEvent) {
            // detail = 0 : activation au clavier (le pointeur a déjà agi sinon).
            if (e.detail === 0) latest.current();
        },
        onContextMenu(e: React.MouseEvent) {
            e.preventDefault();
        },
    };
}
