import type { ExerciseBlock, LoggedSet } from "./types";

export type Logs = Record<string, Record<number, LoggedSet>>;

export interface Target {
    ex: number;
    set: number;
}

export function initialLogs(blocks: ExerciseBlock[]): Logs {
    return Object.fromEntries(blocks.map((b) => [b.key, { ...b.logged }]));
}

export function firstOpenSet(block: ExerciseBlock, logs: Logs): number {
    const done = logs[block.key] ?? {};
    for (let i = 0; i < block.setCount; i++) {
        if (!done[i]) return i;
    }
    return -1;
}

export function isExerciseDone(block: ExerciseBlock, logs: Logs): boolean {
    return firstOpenSet(block, logs) === -1;
}

/**
 * Prochaine série à faire. Séance classique : on finit l'exercice en cours,
 * puis les suivants dans l'ordre. Circuit : un tour complet avant le suivant.
 * Les exercices passés sont ignorés.
 */
export function nextTarget(
    blocks: ExerciseBlock[],
    logs: Logs,
    skipped: ReadonlySet<string>,
    from: number,
    isCircuit: boolean,
): Target | null {
    const candidates = blocks.map((b, i) => ({ b, i })).filter(({ b }) => !skipped.has(b.key));
    if (isCircuit) {
        const maxSets = Math.max(0, ...candidates.map(({ b }) => b.setCount));
        for (let s = 0; s < maxSets; s++) {
            for (const { b, i } of candidates) {
                if (s < b.setCount && !logs[b.key]?.[s]) return { ex: i, set: s };
            }
        }
        return null;
    }
    const n = blocks.length;
    for (let k = 0; k < n; k++) {
        const i = (from + k) % n;
        const b = blocks[i];
        if (skipped.has(b.key)) continue;
        const s = firstOpenSet(b, logs);
        if (s !== -1) return { ex: i, set: s };
    }
    return null;
}

/** Premier nombre d'une consigne (« 8–15 » → 8) ; null pour « max ». */
export function targetFloor(reps: string): number | null {
    if (/max/i.test(reps)) return null;
    const m = reps.match(/\d+/);
    return m ? parseInt(m[0], 10) : null;
}

export function sumReps(sets: Record<number, LoggedSet> | undefined, only?: number[]): number {
    if (!sets) return 0;
    return Object.entries(sets)
        .filter(([i]) => !only || only.includes(Number(i)))
        .reduce((acc, [, s]) => acc + (s.reps ?? 0), 0);
}
