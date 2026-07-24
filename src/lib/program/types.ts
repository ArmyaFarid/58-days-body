export type DayType =
    | "poussee-a"
    | "tirage-a"
    | "jambes"
    | "poussee-b"
    | "tirage-b"
    | "pump"
    | "repos"
    // Programme « masse-femme » (3 séances/semaine)
    | "femme-a"
    | "femme-b"
    | "femme-c";

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
    /** Saisie en secondes (gainage, tenues) plutôt qu'en reps. */
    time?: boolean;
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

// ─── Abstraction multi-programmes ───

export type ProgramId = "programme-58" | "masse-femme";

export type HabitFieldKey = "creatine" | "kcal3000" | "protein140" | "sleepBefore23";

export interface ProgramFeatures {
    /** Upload de photos de progression. */
    photos: boolean;
    /** Case créatine dans la checklist. */
    creatine: boolean;
    /** Techniques d'intensification (Bloc 2) affichées sur la séance. */
    intensification: boolean;
    /** Suivi des lipides (3e compteur nutrition + objectif). */
    trackFat: boolean;
    /** Poids cible défini dans les réglages (programme ouvert sans fin). */
    targetWeight: boolean;
    /** Mensurations = indicateur principal (affichées avant le poids). */
    measurementsPrimary: boolean;
    /** Accueil : nutrition affichée avant la séance. */
    nutritionFirst: boolean;
    /** Case « séance faite » (dérivée) dans la checklist. */
    sessionHabit: boolean;
    /** Sélecteur de variante/complexité par exercice (suivi + affiché). */
    variants: boolean;
}

/** Phase courante affichée à l'accueil. */
export interface PhaseInfo {
    key: string;
    /** Ex. « Phase 1 (prise rapide) ». */
    label: string;
    /** Court, pour le badge. Ex. « Phase 1 ». */
    shortLabel: string;
    description: string;
}

export interface PhaseGoals {
    protein: number;
    calories: number;
    /** Lipides (g). Absent ⇒ programme sans suivi lipides. */
    fat?: number;
}

export interface TrendConfig {
    /** Texte neutre (aucune suggestion), affiché dans Suivi. */
    targetText: string;
    /** Delta hebdo (kg) au-dessus duquel on suggère de réduire. */
    highGain: number;
    /** Delta hebdo (kg) en dessous duquel on suggère d'ajouter. */
    lowGain: number;
    /** Exiger 2 semaines consécutives sous `lowGain` avant de suggérer d'ajouter. */
    lowGainTwoWeeks: boolean;
    deficitText: string;
    surplusText: string;
}

export interface Program {
    id: ProgramId;
    /** Libellé pour le sélecteur d'inscription. */
    label: string;
    /** Durée en jours, ou `null` si ouvert (sans date de fin). */
    length: number | null;
    /** Dispose d'une page de référence dédiée (/programme). */
    hasReferencePage: boolean;
    sessions: Record<string, Session>;
    lexicon: Record<string, LexiconEntry>;
    features: ProgramFeatures;
    /** Habitudes (colonnes) à afficher, dans l'ordre. */
    habitFields: HabitFieldKey[];
    /** Libellés custom par habitude (sinon libellé par défaut). */
    habitLabels?: Partial<Record<HabitFieldKey, { label: string; short: string }>>;
    /** Type de séance pour un jour de la semaine (0 = dimanche … 6 = samedi). */
    dayTypeForWeekday(weekday: number): DayType;
    isTrainingDay(dayType: DayType, phaseKey: string | null): boolean;
    getPhase(dayNumber: number): PhaseInfo | null;
    /** Objectifs nutrition par défaut pour une phase (secours si réglages NULL). */
    nutritionForPhase(phaseKey: string | null): PhaseGoals;
    /** Clé de la phase qui utilise les colonnes d'objectifs *_2 (programmes multi-phases). */
    nutritionPhase2Key?: string;
    trend: TrendConfig;
}
