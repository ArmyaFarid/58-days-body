import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { getUserProgramId } from "@/lib/data/users";
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

async function loadSettings(userId: number) {
    const rows = await db
        .select({
            startDate: settings.startDate,
            proteinGoal: settings.proteinGoal,
            calorieGoal: settings.calorieGoal,
            fatGoal: settings.fatGoal,
            proteinGoal2: settings.proteinGoal2,
            calorieGoal2: settings.calorieGoal2,
            fatGoal2: settings.fatGoal2,
            targetWeightKg: settings.targetWeightKg,
        })
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);
    return rows[0] ?? null;
}

/** Objectifs nutrition pour la PHASE COURANTE (secours = défauts du programme). */
export async function getNutritionGoals(userId: number): Promise<NutritionGoals> {
    const [row, programId] = await Promise.all([loadSettings(userId), getUserProgramId(userId)]);
    const program = getProgram(programId);
    const dayNumber = row?.startDate ? getDayNumber(row.startDate, fromISO(todayISO())) : 1;
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
    phase1: NutritionGoals;
    phase2: NutritionGoals;
}

export async function getSettingsView(userId: number): Promise<SettingsView> {
    const [row, programId] = await Promise.all([loadSettings(userId), getUserProgramId(userId)]);
    const program = getProgram(programId);
    const d1 = program.nutritionForPhase(null);
    const p2key = program.nutritionPhase2Key ?? null;
    const d2 = program.nutritionForPhase(p2key);
    return {
        targetWeightKg: row?.targetWeightKg ?? null,
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

export interface GoalUpdate {
    proteinGoal?: number;
    calorieGoal?: number;
    fatGoal?: number | null;
    proteinGoal2?: number;
    calorieGoal2?: number;
    fatGoal2?: number | null;
    targetWeightKg?: number | null;
}

/** Met à jour uniquement les champs fournis (le reste est inchangé). */
export async function updateSettings(userId: number, patch: GoalUpdate): Promise<void> {
    const set: Record<string, number | null> = {};
    for (const [k, v] of Object.entries(patch)) {
        if (v !== undefined) set[k] = v;
    }
    if (Object.keys(set).length === 0) return;
    await db.update(settings).set(set).where(eq(settings.userId, userId));
}
