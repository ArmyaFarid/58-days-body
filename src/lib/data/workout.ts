import "server-only";
import { and, desc, eq, gte, inArray, isNull, lt, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { workoutSessions, setLogs } from "@/lib/db/schema";
import { programDayTypes, type Program } from "@/lib/program";

/**
 * Séances d'un programme : celles enregistrées sous ce programme, plus les
 * séances antérieures au multi-programme (program_id NULL) dont le type
 * appartient à ce programme.
 */
function programScope(program: Program): SQL {
    return or(
        eq(workoutSessions.programId, program.id),
        and(isNull(workoutSessions.programId), inArray(workoutSessions.dayType, programDayTypes(program))),
    )!;
}

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
    userId: number,
    program: Program,
    date: string,
    dayType: string,
    phase: string,
): Promise<WorkoutSession> {
    const existing = await db
        .select()
        .from(workoutSessions)
        .where(
            and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date), programScope(program)),
        )
        .limit(1);
    if (existing[0]) {
        const r = existing[0];
        return { id: r.id, date: r.date, dayType: r.dayType, phase: r.phase, completed: r.completed };
    }
    const inserted = await db
        .insert(workoutSessions)
        .values({ userId, programId: program.id, date, dayType, phase })
        .returning();
    const r = inserted[0];
    return { id: r.id, date: r.date, dayType: r.dayType, phase: r.phase, completed: r.completed };
}

/** Lecture seule : la séance du jour si elle existe déjà (sans la créer). */
export async function getSessionForDate(
    userId: number,
    program: Program,
    date: string,
): Promise<WorkoutSession | null> {
    const rows = await db
        .select()
        .from(workoutSessions)
        .where(
            and(eq(workoutSessions.userId, userId), eq(workoutSessions.date, date), programScope(program)),
        )
        .limit(1);
    const r = rows[0];
    if (!r) return null;
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

/** Les séries de la dernière fois que cet exercice a été fait sous ce programme. */
export async function getLastPerformance(
    userId: number,
    program: Program,
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
        .where(
            and(
                eq(workoutSessions.userId, userId),
                programScope(program),
                eq(setLogs.exerciseKey, exerciseKey),
                lt(workoutSessions.date, beforeDate),
            ),
        )
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
    userId: number;
    sessionId: number;
    exerciseKey: string;
    setIndex: number;
    reps: number | null;
    band: string | null;
    variant: string | null;
    notes: string | null;
}

export async function saveSetLog(input: SaveSetInput): Promise<void> {
    // Sécurité : vérifie que la séance appartient bien à l'utilisateur.
    const owned = await db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.id, input.sessionId), eq(workoutSessions.userId, input.userId)))
        .limit(1);
    if (!owned[0]) throw new Error("Séance introuvable.");

    await db
        .insert(setLogs)
        .values({
            sessionId: input.sessionId,
            exerciseKey: input.exerciseKey,
            setIndex: input.setIndex,
            reps: input.reps,
            band: input.band,
            variant: input.variant,
            notes: input.notes,
        })
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

/** Applique une variante à toutes les séries déjà loggées d'un exercice (session). */
export async function updateExerciseVariant(
    userId: number,
    sessionId: number,
    exerciseKey: string,
    variant: string | null,
): Promise<void> {
    const owned = await db
        .select({ id: workoutSessions.id })
        .from(workoutSessions)
        .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)))
        .limit(1);
    if (!owned[0]) throw new Error("Séance introuvable.");

    await db
        .update(setLogs)
        .set({ variant })
        .where(and(eq(setLogs.sessionId, sessionId), eq(setLogs.exerciseKey, exerciseKey)));
}

export async function setSessionCompleted(
    userId: number,
    sessionId: number,
    completed: boolean,
): Promise<void> {
    await db
        .update(workoutSessions)
        .set({ completed, completedAt: completed ? new Date() : null })
        .where(and(eq(workoutSessions.id, sessionId), eq(workoutSessions.userId, userId)));
}

export interface ExerciseHistoryEntry {
    date: string;
    /** Variante/complexité de la séance (partagée par les séries). */
    variant: string | null;
    sets: { setIndex: number; reps: number | null; band: string | null }[];
}

export async function getAllExerciseHistories(
    userId: number,
    program: Program,
): Promise<Record<string, ExerciseHistoryEntry[]>> {
    const rows = await db
        .select({
            date: workoutSessions.date,
            exerciseKey: setLogs.exerciseKey,
            setIndex: setLogs.setIndex,
            reps: setLogs.reps,
            band: setLogs.band,
            variant: setLogs.variant,
        })
        .from(setLogs)
        .innerJoin(workoutSessions, eq(setLogs.sessionId, workoutSessions.id))
        .where(and(eq(workoutSessions.userId, userId), programScope(program)))
        .orderBy(desc(workoutSessions.date), setLogs.setIndex);

    const result: Record<string, ExerciseHistoryEntry[]> = {};
    for (const r of rows) {
        const entries = (result[r.exerciseKey] ??= []);
        let entry = entries.find((e) => e.date === r.date);
        if (!entry) {
            entry = { date: r.date, variant: null, sets: [] };
            entries.push(entry);
        }
        if (r.variant && !entry.variant) entry.variant = r.variant;
        entry.sets.push({ setIndex: r.setIndex, reps: r.reps, band: r.band });
    }
    return result;
}

/** Dates des séances complétées sous ce programme, depuis `fromDate` (inclus). */
export async function getCompletedSessionDates(
    userId: number,
    program: Program,
    fromDate: string,
): Promise<string[]> {
    const rows = await db
        .select({ date: workoutSessions.date })
        .from(workoutSessions)
        .where(
            and(
                eq(workoutSessions.userId, userId),
                programScope(program),
                eq(workoutSessions.completed, true),
                gte(workoutSessions.date, fromDate),
            ),
        );
    return rows.map((r) => r.date);
}
