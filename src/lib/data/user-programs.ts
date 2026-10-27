import "server-only";
import { cache } from "react";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, userPrograms, users } from "@/lib/db/schema";
import { getProgram, getDayNumber, type Program, type ScheduleContext } from "@/lib/program";
import { todayISO, fromISO } from "@/lib/date";

// « abandoned » : retiré de « Mes programmes » mais toutes ses données sont
// conservées ; le reprendre depuis le catalogue repart d'une nouvelle date.
export type ProgramStatus = "active" | "paused" | "abandoned";

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
    /** Programmes suivis (actifs et en pause, hors abandonnés), ordre d'ajout. */
    all: UserProgram[];
}

function toRow(r: typeof userPrograms.$inferSelect): UserProgram {
    return {
        programId: r.programId,
        startDate: r.startDate,
        status: r.status === "paused" || r.status === "abandoned" ? r.status : "active",
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
        .where(and(eq(userPrograms.userId, userId), ne(userPrograms.status, "abandoned")))
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

/** Programmes abandonnés : toujours reprenables, même retirés du catalogue. */
export async function getAbandonedProgramIds(userId: number): Promise<string[]> {
    const rows = await db
        .select({ programId: userPrograms.programId })
        .from(userPrograms)
        .where(and(eq(userPrograms.userId, userId), eq(userPrograms.status, "abandoned")));
    return rows.map((r) => r.programId);
}

/** Programmes suivis, hors abandonnés. */
export async function getUserPrograms(userId: number): Promise<UserProgram[]> {
    let rows = await loadRows(userId);
    if (rows.length === 0) {
        await backfillFromSettings(userId);
        rows = await loadRows(userId);
    }
    return rows;
}

/**
 * Programme affiché : le dernier consulté s'il est actif, sinon le premier actif.
 * Tout en pause : le dernier consulté reste affiché (en pause). Aucun programme
 * suivi (tout abandonné, ou pas encore d'onboarding) : null.
 * Mémorisé par requête : le layout et la page partagent le même résultat.
 */
export const getActiveProgram = cache(async (userId: number): Promise<ActiveProgram | null> => {
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
});

export function scheduleContext(row: UserProgram, date: string = todayISO()): ScheduleContext {
    return { dayNumber: getDayNumber(row.startDate, fromISO(date)), holdPhase1: row.holdPhase1 };
}

export async function addUserProgram(userId: number, programId: string, startDate: string): Promise<void> {
    await db
        .insert(userPrograms)
        .values({ userId, programId, startDate })
        .onConflictDoUpdate({
            target: [userPrograms.userId, userPrograms.programId],
            // Déjà suivi : on le réactive en gardant ses réglages. Un programme
            // abandonné repart de la nouvelle date de début.
            set: {
                status: "active",
                startDate: sql`case when ${userPrograms.status} = 'abandoned' then excluded.start_date else ${userPrograms.startDate} end`,
            },
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
