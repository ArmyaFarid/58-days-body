import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";
import { DEFAULT_PROTEIN_GOAL, DEFAULT_CALORIE_GOAL } from "@/lib/nutrition";

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
}

/** Objectifs nutrition de l'utilisateur (défauts applicatifs si non définis). */
export async function getNutritionGoals(userId: number): Promise<NutritionGoals> {
    const rows = await db
        .select({ proteinGoal: settings.proteinGoal, calorieGoal: settings.calorieGoal })
        .from(settings)
        .where(eq(settings.userId, userId))
        .limit(1);
    return {
        proteinGoal: rows[0]?.proteinGoal ?? DEFAULT_PROTEIN_GOAL,
        calorieGoal: rows[0]?.calorieGoal ?? DEFAULT_CALORIE_GOAL,
    };
}

export async function setNutritionGoals(
    userId: number,
    proteinGoal: number,
    calorieGoal: number,
): Promise<void> {
    await db
        .update(settings)
        .set({ proteinGoal, calorieGoal })
        .where(eq(settings.userId, userId));
}
