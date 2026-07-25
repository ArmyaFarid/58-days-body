import type { Exercise, Session } from "./types";

/**
 * Modifications de séance datées.
 *
 * Une séance déjà passée doit s'afficher telle qu'elle était le jour où elle a
 * été faite : `sessionForDate` rejoue la version d'époque pour toute date
 * antérieure au changement. Les séries enregistrées sous l'ancienne clé restent
 * donc visibles à leur place, et la nouvelle station n'apparaît pas sur les
 * jours où elle n'existait pas encore.
 */

/** 5e station du circuit du samedi avant le remplacement. */
const PUMP_ROWING: Exercise = {
    key: "pump-rowing",
    name: "Rowing inversé sous la table",
    sets: "3 tours",
    reps: "max −2",
    lexiconKey: "rowing-inverse",
};

/** Première date où « tirage assis à la bande » remplace le rowing inversé. */
const PUMP_TIRAGE_ASSIS_FROM = "2026-07-25";

/**
 * Exercices sortis des séances actives : leurs setLogs restent en base, on garde
 * leur libellé pour que l'historique de perfs reste lisible.
 */
export const LEGACY_EXERCISES: Exercise[] = [PUMP_ROWING];

/** La séance telle qu'elle était à la date donnée (ISO). */
export function sessionForDate(session: Session, date: string): Session {
    if (session.dayType !== "pump" || date >= PUMP_TIRAGE_ASSIS_FROM) return session;
    return {
        ...session,
        exercises: session.exercises.map((ex) => (ex.key === "pump-tirage-assis" ? PUMP_ROWING : ex)),
    };
}
