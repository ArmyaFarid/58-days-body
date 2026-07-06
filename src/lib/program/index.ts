import { differenceInCalendarDays, parseISO } from "date-fns";
import type { DayType, Phase } from "./types";
import { SESSIONS } from "./sessions";

export * from "./types";
export { SESSIONS } from "./sessions";
export { LEXICON, youtubeSearchUrl } from "./lexicon";

export const PROGRAM_LENGTH = 58;

export const PHASES: Phase[] = [
    {
        key: "bloc1",
        label: "Bloc 1 — Accumulation",
        startDay: 1,
        endDay: 25,
        description: "Construis le volume, apprends les mouvements, bats le carnet à chaque séance.",
    },
    {
        key: "delestage",
        label: "Délestage",
        startDay: 26,
        endDay: 29,
        description:
            "Jours 1, 2 et 4 seulement, 2 séries/exercice, à 3–4 reps de l'échec, corde légère. On récupère.",
    },
    {
        key: "bloc2",
        label: "Bloc 2 — Intensification",
        startDay: 30,
        endDay: 54,
        description:
            "Mêmes séances, mais on pousse : myo-reps, rest-pause et dropsets sur les exercices concernés.",
    },
    {
        key: "taper",
        label: "Taper / Pump",
        startDay: 55,
        endDay: 58,
        description:
            "2 séances pump (style jour 6), glucides et eau normaux — tu pars plein et vascularisé.",
    },
];

/** Jour du programme (1 = date de début). Peut être < 1 ou > 58. */
export function getDayNumber(startDate: string, today: Date = new Date()): number {
    return differenceInCalendarDays(today, parseISO(startDate)) + 1;
}

export function getPhaseForDay(day: number): Phase | null {
    if (day < 1 || day > PROGRAM_LENGTH) return null;
    return PHASES.find((p) => day >= p.startDay && day <= p.endDay) ?? null;
}

/** getDay() JS : 0 = dimanche … 6 = samedi. */
const WEEKDAY_TO_DAYTYPE: Record<number, DayType> = {
    0: "repos",
    1: "poussee-a",
    2: "tirage-a",
    3: "jambes",
    4: "poussee-b",
    5: "tirage-b",
    6: "pump",
};

export function getDayTypeForDate(date: Date = new Date()): DayType {
    return WEEKDAY_TO_DAYTYPE[date.getDay()];
}

export function getSession(dayType: DayType) {
    return SESSIONS[dayType];
}

/** Nombre de séries à logger, dérivé du champ `sets` (« 4 », « 3 tours »…). */
export function parseSetCount(sets: string): number {
    const m = sets.match(/^\d+/);
    const n = m ? parseInt(m[0], 10) : 3;
    return Math.min(8, Math.max(1, n));
}

/** En délestage, seuls Poussée A, Tirage A et Poussée B sont travaillés. */
const DELESTAGE_DAYTYPES: DayType[] = ["poussee-a", "tirage-a", "poussee-b"];

export function isTrainingDay(dayType: DayType, phaseKey: Phase["key"] | null): boolean {
    if (dayType === "repos") return false;
    if (phaseKey === "delestage") return DELESTAGE_DAYTYPES.includes(dayType);
    return true;
}

/** Classement des exercices par efficacité pour les priorités du programme. */
export const EXERCISE_RANKING: string[] = [
    "Élévations latérales à la bande (largeur d'épaules)",
    "Tractions (le V)",
    "Pike push-ups (masse d'épaules)",
    "Rowing inversé + tirage bande (épaisseur du dos)",
    "Pompes déclinées (haut des pecs)",
    "Dips",
    "Curls bande + extensions au-dessus de la tête (bras)",
    "Face pull (protège les épaules pendant 58 jours de pressing)",
];

export const PROGRESSION_LEVERS: { title: string; text: string }[] = [
    { title: "Reps", text: "+1 rep quelque part vs la semaine passée (note tout)." },
    {
        title: "Bande",
        text: "Haut de fourchette atteint → raccourcis la bande, puis résistance supérieure, puis empile (10 → 20 → 30 → 10+20 → 20+30…).",
    },
    {
        title: "Variation plus dure",
        text: "pompes → déclinées → archer · pike → pieds surélevés → mur · tractions assistées 30 → 20 → 10 → strictes → prise large.",
    },
    { title: "Tempo", text: "Excentrique 3–4 s, pause 1 s en étirement." },
];

export const BLOC2_TECHNIQUES: { title: string; text: string }[] = [
    {
        title: "Myo-reps",
        text: "Élévations latérales et curls : activation 15–20 reps près de l'échec, puis 4 × 5 avec 15 s de repos.",
    },
    {
        title: "Rest-pause",
        text: "Dernière série de tractions, dips, pike push-ups : échec → 15 s → max → 15 s → max.",
    },
    {
        title: "Dropset bande",
        text: "À l'échec sur la 20 kg → attrape la 10 kg → max reps (curls, élévations, extensions).",
    },
    {
        title: "Dropset mécanique pompes",
        text: "Déclinées → standards → genoux, à l'échec chaque fois (1×/séance de poussée).",
    },
    { title: "Échec complet", text: "Autorisé sur toutes les isolations." },
];

export interface ExerciseRef {
    key: string;
    name: string;
    lexiconKey: string;
}

/** Tous les exercices du catalogue, dédupliqués par clé. */
export const ALL_EXERCISES: ExerciseRef[] = (() => {
    const map = new Map<string, ExerciseRef>();
    for (const session of Object.values(SESSIONS)) {
        for (const ex of session.exercises) {
            if (!map.has(ex.key)) {
                map.set(ex.key, { key: ex.key, name: ex.name, lexiconKey: ex.lexiconKey });
            }
        }
    }
    return [...map.values()];
})();

export function getExerciseName(key: string): string {
    return ALL_EXERCISES.find((e) => e.key === key)?.name ?? key;
}

/** Clés de tractions — pour le jalon « tractions strictes » (sans assistance). */
export const TRACTION_KEYS = ["tractions-pronation", "tractions-neutre-supination", "pump-tractions"];

/** Les 8 exercices clés — utilisés pour les illustrations SVG (étape 11). */
export const KEY_EXERCISES: string[] = [
    "elevations-laterales",
    "tractions",
    "pike-push-ups",
    "rowing-inverse",
    "pompes-declinees",
    "dips-chaises",
    "curl-bande",
    "face-pull",
];
