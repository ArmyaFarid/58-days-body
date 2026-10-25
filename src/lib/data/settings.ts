import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { getActiveProgram, updateUserProgram, type UserProgramPatch } from "@/lib/data/user-programs";
import { getProgram, getDayNumber } from "@/lib/program";
import { todayISO, fromISO } from "@/lib/date";

export async function getStartDate(userId: number): Promise<string | null> {
    const rows = await db
        .select()
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);
    return rows[0]?.startDate ?? null;
}

export async function setStartDate(userId: number, date: string): Promise<void> {
    await db
        .insert(settings)
        .values({ userId, startDate: date })
        .onConflictDoUpdate({ target: settings.userId, set: { startDate: date } });
}

export interface NutritionGoals {
    proteinGoal: number;
    calorieGoal: number;
    /** Objectif lipides (g) ou NULL si le programme ne suit pas le gras. */
    fatGoal: number | null;
}

/** Objectifs nutrition du PROGRAMME ACTIF, pour sa phase courante (secours = défauts du programme). */
export async function getNutritionGoals(userId: number): Promise<NutritionGoals> {
    const active = await getActiveProgram(userId);
    const program = active?.program ?? getProgram(null);
    const row = active?.row ?? null;
    const dayNumber = row ? getDayNumber(row.startDate, fromISO(todayISO())) : 1;
    const phase = program.getPhase(dayNumber);
    const usePhase2 =
        program.nutritionPhase2Key != null && phase?.key === program.nutritionPhase2Key;
    const defaults = program.nutritionForPhase(phase?.key ?? null);

    const proteinGoal = (usePhase2 ? row?.proteinGoal2 : row?.proteinGoal) ?? defaults.protein;
    const calorieGoal = (usePhase2 ? row?.calorieGoal2 : row?.calorieGoal) ?? defaults.calories;
    const fatGoal = (usePhase2 ? row?.fatGoal2 : row?.fatGoal) ?? defaults.fat ?? null;
    return { proteinGoal, calorieGoal, fatGoal };
}

/** Objectifs par phase tels que STOCKÉS (avec défauts programme) — pour les réglages. */
export interface SettingsView {
    targetWeightKg: number | null;
    holdPhase1: boolean;
    creatine: boolean;
    phase1: NutritionGoals;
    phase2: NutritionGoals;
}

export async function getSettingsView(userId: number): Promise<SettingsView> {
    const active = await getActiveProgram(userId);
    const program = active?.program ?? getProgram(null);
    const row = active?.row ?? null;
    const d1 = program.nutritionForPhase(null);
    const p2key = program.nutritionPhase2Key ?? null;
    const d2 = program.nutritionForPhase(p2key);
    return {
        targetWeightKg: row?.targetWeightKg ?? null,
        holdPhase1: row?.holdPhase1 ?? false,
        creatine: row?.creatine ?? false,
        phase1: {
            proteinGoal: row?.proteinGoal ?? d1.protein,
            calorieGoal: row?.calorieGoal ?? d1.calories,
            fatGoal: row?.fatGoal ?? d1.fat ?? null,
        },
        phase2: {
            proteinGoal: row?.proteinGoal2 ?? d2.protein,
            calorieGoal: row?.calorieGoal2 ?? d2.calories,
            fatGoal: row?.fatGoal2 ?? d2.fat ?? null,
        },
    };
}

/** Met à jour les réglages du programme actif (uniquement les champs fournis). */
export async function updateSettings(userId: number, patch: UserProgramPatch): Promise<void> {
    const active = await getActiveProgram(userId);
    if (!active) return;
    await updateUserProgram(userId, active.row.programId, patch);
}
