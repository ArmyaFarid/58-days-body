"use client";

import { saveSetLogAction } from "@/lib/actions";

/** Série à envoyer au serveur (mêmes champs que saveSetLogAction). */
export interface PendingSet {
    sessionId: number;
    exerciseKey: string;
    setIndex: number;
    reps: number | null;
    band: string | null;
    variant: string | null;
    notes: string | null;
}

const KEY = "pending-sets";
export const PENDING_EVENT = "pending-sets-change";

function same(a: PendingSet, b: { sessionId: number; exerciseKey: string; setIndex: number }): boolean {
    return a.sessionId === b.sessionId && a.exerciseKey === b.exerciseKey && a.setIndex === b.setIndex;
}

export function pendingSets(): PendingSet[] {
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? "[]") as PendingSet[];
    } catch {
        return [];
    }
}

function write(list: PendingSet[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch {
        // Stockage indisponible : la série reste affichée, mais ne survivra pas à un rechargement.
    }
    window.dispatchEvent(new Event(PENDING_EVENT));
}

/** Garde la série sur le téléphone ; la dernière saisie d'une même série remplace la précédente. */
export function queueSet(set: PendingSet) {
    write([...pendingSets().filter((p) => !same(p, set)), set]);
}

/** Retire une série en attente (annulation). Renvoie true si elle était en attente. */
export function unqueueSet(ref: { sessionId: number; exerciseKey: string; setIndex: number }): boolean {
    const list = pendingSets();
    const next = list.filter((p) => !same(p, ref));
    if (next.length !== list.length) write(next);
    return next.length !== list.length;
}

class NetworkTimeout extends Error {}

/** Erreur due au réseau (hors ligne, requête interrompue, trop lente) plutôt qu'à une donnée refusée. */
export function isNetworkError(error: unknown): boolean {
    return (
        (typeof navigator !== "undefined" && !navigator.onLine) ||
        error instanceof TypeError ||
        error instanceof NetworkTimeout
    );
}

/**
 * Enregistre une série ; sans réseau (ou réponse trop lente), elle est gardée sur le
 * téléphone et partira au retour du réseau. Renvoie true si elle a été mise en attente.
 * Réenvoyer la même série est sans effet de bord (mise à jour de la même ligne).
 */
export async function saveSetOrQueue(set: PendingSet, timeoutMs = 8000): Promise<boolean> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
        queueSet(set);
        return true;
    }
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
        await Promise.race([
            saveSetLogAction(set),
            new Promise((_, reject) => {
                timer = setTimeout(() => reject(new NetworkTimeout()), timeoutMs);
            }),
        ]);
        return false;
    } catch (error) {
        if (!isNetworkError(error)) throw error;
        queueSet(set);
        return true;
    } finally {
        clearTimeout(timer);
    }
}

let flushing = false;

/** Envoie les séries en attente, dans l'ordre. S'arrête à la première erreur réseau. */
export async function flushPendingSets(): Promise<number> {
    if (flushing || (typeof navigator !== "undefined" && !navigator.onLine)) return 0;
    flushing = true;
    let sent = 0;
    try {
        for (const set of pendingSets()) {
            try {
                await saveSetLogAction(set);
            } catch (error) {
                if (isNetworkError(error)) break;
                // Refus du serveur (séance supprimée…) : inutile de réessayer.
            }
            write(pendingSets().filter((p) => !same(p, set)));
            sent++;
        }
    } finally {
        flushing = false;
    }
    return sent;
}
