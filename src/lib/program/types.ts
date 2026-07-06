export type DayType =
    | "poussee-a"
    | "tirage-a"
    | "jambes"
    | "poussee-b"
    | "tirage-b"
    | "pump"
    | "repos";

export type PhaseKey = "bloc1" | "delestage" | "bloc2" | "taper";

export interface Phase {
    key: PhaseKey;
    label: string;
    startDay: number;
    endDay: number;
    description: string;
}

export interface Exercise {
    key: string;
    name: string;
    sets: string;
    reps: string;
    band?: string;
    notes?: string;
    lexiconKey: string;
    /** Technique d'intensification affichée en Bloc 2 (jours 30–54). */
    intensification?: string;
}

export interface Session {
    dayType: DayType;
    title: string;
    focus: string;
    exercises: Exercise[];
    /** Le jour 6 (Pump) est un circuit : mêmes exercices, format différent. */
    isCircuit?: boolean;
    circuitNote?: string;
    finisher?: string;
}

export interface LexiconEntry {
    name: string;
    text: string;
}
