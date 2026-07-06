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
    lexiconKey: string;
    lexiconName: string;
    lexiconText: string;
    youtubeUrl: string;
    setCount: number;
    /** Séries déjà loggées aujourd'hui, indexées par numéro de série (0-based). */
    logged: Record<number, LoggedSet>;
    /** Perf de la dernière fois, indexée par numéro de série. */
    last: Record<number, LoggedSet>;
}
