import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, userPrograms, users } from "@/lib/db/schema";
import { getProgram, getDayNumber, type Program, type ScheduleContext } from "@/lib/program";
import { todayISO, fromISO } from "@/lib/date";

export type ProgramStatus = "active" | "paused";

export interface UserProgram {
    programId: string;
    startDate: string;
    status: ProgramStatus;
    holdPhase1: boolean;
    creatine: boolean;
    proteinGoal: number | null;
    calorieGoal: number | null;
    fatGoal: number | null;
    proteinGoal2: number | null;
    calorieGoal2: number | null;
    fatGoal2: number | null;
    targetWeightKg: number | null;
}

/** Programme actif résolu : définition + réglages de la personne. */
export interface ActiveProgram {
    program: Program;
    row: UserProgram;
    /** Tous les programmes suivis (actifs et en pause), ordre d'ajout. */
    all: UserProgram[];
}

function toRow(r: typeof userPrograms.$inferSelect): UserProgram {
    return {
        programId: r.programId,
        startDate: r.startDate,
        status: r.status === "paused" ? "paused" : "active",
        holdPhase1: r.holdPhase1,
        creatine: r.creatine,
        proteinGoal: r.proteinGoal,
        calorieGoal: r.calorieGoal,
        fatGoal: r.fatGoal,
        proteinGoal2: r.proteinGoal2,
        calorieGoal2: r.calorieGoal2,
        fatGoal2: r.fatGoal2,
        targetWeightKg: r.targetWeightKg,
    };
}

async function loadRows(userId: number): Promise<UserProgram[]> {
    const rows = await db
        .select()
        .from(userPrograms)
        .where(eq(userPrograms.userId, userId))
        .orderBy(userPrograms.id);
    return rows.map(toRow);
}

/**
 * Comptes antérieurs au multi-programme : crée la ligne du programme d'origine
 * en COPIANT `settings` (date de début, objectifs, poids cible). `settings`
 * n'est pas modifiée. Sans `settings` (pas encore d'onboarding), rien n'est créé.
 */
async function backfillFromSettings(userId: number): Promise<void> {
    const [s] = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
    if (!s) return;
    const [u] = await db.select({ programId: users.programId }).from(users).where(eq(users.id, userId)).limit(1);
    await db
        .insert(userPrograms)
        .values({
            userId,
            programId: getProgram(u?.programId).id,
            startDate: s.startDate,
            proteinGoal: s.proteinGoal,
            calorieGoal: s.calorieGoal,
            fatGoal: s.fatGoal,
            proteinGoal2: s.proteinGoal2,
            calorieGoal2: s.calorieGoal2,
            fatGoal2: s.fatGoal2,
            targetWeightKg: s.targetWeightKg,
        })
        .onConflictDoNothing();
}

export async function getUserPrograms(userId: number): Promise<UserProgram[]> {
    let rows = await loadRows(userId);
    if (rows.length === 0) {
        await backfillFromSettings(userId);
        rows = await loadRows(userId);
    }
    return rows;
}

/** Programme affiché : le dernier consulté s'il est actif, sinon le premier actif. */
export async function getActiveProgram(userId: number): Promise<ActiveProgram | null> {
    const [all, [u]] = await Promise.all([
        getUserPrograms(userId),
        db
            .select({ active: users.activeProgramId, origin: users.programId })
            .from(users)
            .where(eq(users.id, userId))
            .limit(1),
    ]);
    if (all.length === 0) return null;
    const active = all.filter((r) => r.status === "active");
    const pool = active.length > 0 ? active : all;
    const wanted = u?.active ?? getProgram(u?.origin).id;
    const row = pool.find((r) => r.programId === wanted) ?? pool[0];
    return { program: getProgram(row.programId), row, all };
}

export function scheduleContext(row: UserProgram, date: string = todayISO()): ScheduleContext {
    return { dayNumber: getDayNumber(row.startDate, fromISO(date)), holdPhase1: row.holdPhase1 };
}

export async function addUserProgram(userId: number, programId: string, startDate: string): Promise<void> {
    await db
        .insert(userPrograms)
        .values({ userId, programId, startDate })
        .onConflictDoUpdate({
            target: [userPrograms.userId, userPrograms.programId],
            // Déjà suivi : on le réactive sans toucher à sa date ni à ses réglages.
            set: { status: "active" },
        });
}

export async function setUserProgramStatus(
    userId: number,
    programId: string,
    status: ProgramStatus,
): Promise<void> {
    await db
        .update(userPrograms)
        .set({ status })
        .where(and(eq(userPrograms.userId, userId), eq(userPrograms.programId, programId)));
}

export async function setActiveProgramId(userId: number, programId: string): Promise<void> {
    await db.update(users).set({ activeProgramId: programId }).where(eq(users.id, userId));
}

export interface UserProgramPatch {
    holdPhase1?: boolean;
    creatine?: boolean;
    proteinGoal?: number;
    calorieGoal?: number;
    fatGoal?: number | null;
    proteinGoal2?: number;
    calorieGoal2?: number;
    fatGoal2?: number | null;
    targetWeightKg?: number | null;
}

/** Met à jour uniquement les champs fournis du programme donné. */
export async function updateUserProgram(
    userId: number,
    programId: string,
    patch: UserProgramPatch,
): Promise<void> {
    const set: Record<string, number | boolean | null> = {};
    for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined) set[k] = v;
    }
    if (Object.keys(set).length === 0) return;
    await db
        .update(userPrograms)
        .set(set)
        .where(and(eq(userPrograms.userId, userId), eq(userPrograms.programId, programId)));
}
