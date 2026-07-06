import "server-only";
import { and, desc, eq, lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { workoutSessions, setLogs } from "@/lib/db/schema";

export interface SetLog {
    exerciseKey: string;
    setIndex: number;
    reps: number | null;
    band: string | null;
    variant: string | null;
    notes: string | null;
}

export interface WorkoutSession {
    id: number;
    date: string;
    dayType: string;
    phase: string;
    completed: boolean;
}

export async function getOrCreateSession(
    date: string,
    dayType: string,
    phase: string,
): Promise<WorkoutSession> {
    const existing = await db
        .select()
        .from(workoutSessions)
        .where(eq(workoutSessions.date, date))
        .limit(1);
    if (existing[0]) {
        const r = existing[0];
        return { id: r.id, date: r.date, dayType: r.dayType, phase: r.phase, completed: r.completed };
    }
    const inserted = await db
        .insert(workoutSessions)
        .values({ date, dayType, phase })
        .returning();
    const r = inserted[0];
    return { id: r.id, date: r.date, dayType: r.dayType, phase: r.phase, completed: r.completed };
}

export async function getSetLogsForSession(sessionId: number): Promise<SetLog[]> {
    const rows = await db.select().from(setLogs).where(eq(setLogs.sessionId, sessionId));
    return rows.map((r) => ({
        exerciseKey: r.exerciseKey,
        setIndex: r.setIndex,
        reps: r.reps,
        band: r.band,
        variant: r.variant,
        notes: r.notes,
    }));
}

/** Les séries de la dernière fois que cet exercice a été fait (avant `beforeDate`). */
export async function getLastPerformance(
    exerciseKey: string,
    beforeDate: string,
): Promise<SetLog[]> {
    const rows = await db
        .select({
            date: workoutSessions.date,
            setIndex: setLogs.setIndex,
            reps: setLogs.reps,
            band: setLogs.band,
            variant: setLogs.variant,
            notes: setLogs.notes,
        })
        .from(setLogs)
        .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
        .where(and(eq(setLogs.exerciseKey, exerciseKey), lt(workoutSessions.date, beforeDate)))
        .orderBy(desc(workoutSessions.date), setLogs.setIndex);

    if (!rows.length) return [];
    const maxDate = rows[0].date;
    return rows
        .filter((r) => r.date === maxDate)
        .map((r) => ({
            exerciseKey,
            setIndex: r.setIndex,
            reps: r.reps,
            band: r.band,
            variant: r.variant,
            notes: r.notes,
        }));
}

export interface SaveSetInput {
    sessionId: number;
    exerciseKey: string;
    setIndex: number;
    reps: number | null;
    band: string | null;
    variant: string | null;
    notes: string | null;
}

export async function saveSetLog(input: SaveSetInput): Promise<void> {
    await db
        .insert(setLogs)
        .values(input)
        .onConflictDoUpdate({
            target: [setLogs.sessionId, setLogs.exerciseKey, setLogs.setIndex],
            set: {
                reps: input.reps,
                band: input.band,
                variant: input.variant,
                notes: input.notes,
            },
        });
}

export async function setSessionCompleted(sessionId: number, completed: boolean): Promise<void> {
    await db
        .update(workoutSessions)
        .set({ completed, completedAt: completed ? new Date() : null })
        .where(eq(workoutSessions.id, sessionId));
}

export interface ExerciseHistoryEntry {
    date: string;
    sets: { setIndex: number; reps: number | null; band: string | null }[];
}

/**
 * Historique de tous les exercices loggés, regroupé par clé puis par date
 * (récent d'abord), en une seule requête.
 */
export async function getAllExerciseHistories(): Promise<Record<string, ExerciseHistoryEntry[]>> {
    const rows = await db
        .select({
            date: workoutSessions.date,
            exerciseKey: setLogs.exerciseKey,
            setIndex: setLogs.setIndex,
            reps: setLogs.reps,
            band: setLogs.band,
        })
        .from(setLogs)
        .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
        .orderBy(desc(workoutSessions.date), setLogs.setIndex);

    const result: Record<string, ExerciseHistoryEntry[]> = {};
    for (const r of rows) {
        const entries = (result[r.exerciseKey] ??= []);
        let entry = entries.find((e) => e.date === r.date);
        if (!entry) {
            entry = { date: r.date, sets: [] };
            entries.push(entry);
        }
        entry.sets.push({ setIndex: r.setIndex, reps: r.reps, band: r.band });
    }
    return result;
}
