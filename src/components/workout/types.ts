export interface LoggedSet {
    reps: number | null;
    band: string | null;
}

export interface ExerciseBlock {
    key: string;
    name: string;
    sets: string;
    reps: string;
    band?: string;
    notes?: string;
    intensification?: string;
    bandMode: "resistance" | "assist" | "none" | "time";
    lexiconKey: string;
    lexiconName: string;
    lexiconText: string;
    youtubeUrl: string;
    setCount: number;
    /** Séries déjà loggées aujourd'hui, indexées par numéro de série (0-based). */
    logged: Record<number, LoggedSet>;
    /** Perf de la dernière fois, indexée par numéro de série. */
    last: Record<number, LoggedSet>;
    /** Sélecteur de variante activé pour ce programme. */
    variantsEnabled: boolean;
    /** Échelle de variantes prédéfinies (crans plus durs). */
    variants: string[];
    /** Variante retenue pour cette séance (partagée par les séries). */
    variant: string | null;
    /** Variante de la dernière séance de cet exercice. */
    lastVariant: string | null;
}
