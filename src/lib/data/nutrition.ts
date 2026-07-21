import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodLogs } from "@/lib/db/schema";
import { foodMacro, totalsOfEntries, type LoggedEntry, type NutritionTotals } from "@/lib/nutrition";
import { getCustomFoods } from "@/lib/data/custom-foods";

/** Portions du jour, indexées par clé d'aliment (sans macros). */
export async function getFoodPortions(
    userId: number,
    date: string,
): Promise<Record<string, number>> {
    const rows = await db
        .select({ foodKey: foodLogs.foodKey, portions: foodLogs.portions })
        .from(foodLogs)
        .where(and(eq(foodLogs.userId, userId), eq(foodLogs.date, date)));
    const map: Record<string, number> = {};
    for (const r of rows) map[r.foodKey] = r.portions;
    return map;
}

/**
 * Portions loggées du jour, avec macros résolues (snapshot en base, ou catalogue
 * courant en secours pour les lignes sans snapshot).
 */
export async function getLoggedEntries(userId: number, date: string): Promise<LoggedEntry[]> {
    const [rows, custom] = await Promise.all([
        db
            .select({
                foodKey: foodLogs.foodKey,
                portions: foodLogs.portions,
                protein: foodLogs.protein,
                calories: foodLogs.calories,
            })
            .from(foodLogs)
            .where(and(eq(foodLogs.userId, userId), eq(foodLogs.date, date))),
        getCustomFoods(userId),
    ]);
    return rows.map((r) => resolveEntry(r, custom));
}

function resolveEntry(
    r: { foodKey: string; portions: number; protein: number | null; calories: number | null },
    custom: Awaited<ReturnType<typeof getCustomFoods>>,
): LoggedEntry {
    if (r.protein != null && r.calories != null) {
        return { foodKey: r.foodKey, portions: r.portions, protein: r.protein, calories: r.calories };
    }
    const macro = foodMacro(r.foodKey, custom) ?? { protein: 0, calories: 0 };
    return { foodKey: r.foodKey, portions: r.portions, ...macro };
}

/**
 * Fixe le nombre de portions d'un aliment pour un jour, en figeant ses macros
 * (par portion). 0 ⇒ supprime la ligne.
 */
export async function setFoodPortion(
    userId: number,
    date: string,
    foodKey: string,
    portions: number,
    protein: number,
    calories: number,
): Promise<void> {
    if (portions <= 0) {
        await db
            .delete(foodLogs)
            .where(
                and(
                    eq(foodLogs.userId, userId),
                    eq(foodLogs.date, date),
                    eq(foodLogs.foodKey, foodKey),
                ),
            );
        return;
    }
    await db
        .insert(foodLogs)
        .values({ userId, date, foodKey, portions, protein, calories })
        .onConflictDoUpdate({
            target: [foodLogs.userId, foodLogs.date, foodLogs.foodKey],
            set: { portions, protein, calories },
        });
}

export interface NutritionDay extends NutritionTotals {
    date: string;
}

/** Totaux par jour (N derniers jours), macros figées, récent d'abord. */
export async function getNutritionHistory(
    userId: number,
    days: number = 14,
): Promise<NutritionDay[]> {
    const [rows, custom] = await Promise.all([
        db
            .select({
                date: foodLogs.date,
                foodKey: foodLogs.foodKey,
                portions: foodLogs.portions,
                protein: foodLogs.protein,
                calories: foodLogs.calories,
            })
            .from(foodLogs)
            .where(eq(foodLogs.userId, userId))
            .orderBy(desc(foodLogs.date)),
        getCustomFoods(userId),
    ]);

    const byDate = new Map<string, LoggedEntry[]>();
    for (const r of rows) {
        const list = byDate.get(r.date) ?? [];
        list.push(resolveEntry(r, custom));
        byDate.set(r.date, list);
    }
    return [...byDate.entries()]
        .slice(0, days)
        .map(([date, entries]) => ({ date, ...totalsOfEntries(entries) }));
}

/** Aliments les plus utilisés sur N jours (somme des portions), pour « Fréquents ». */
export async function getFrequentFoodKeys(
    userId: number,
    days: number = 30,
    limit: number = 6,
): Promise<string[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceISO = since.toISOString().slice(0, 10);

    const rows = await db
        .select({
            foodKey: foodLogs.foodKey,
            total: sql<number>`sum(${foodLogs.portions})`,
        })
        .from(foodLogs)
        .where(and(eq(foodLogs.userId, userId), gte(foodLogs.date, sinceISO)))
        .groupBy(foodLogs.foodKey)
        .orderBy(desc(sql`sum(${foodLogs.portions})`))
        .limit(limit);

    return rows.map((r) => r.foodKey);
}
