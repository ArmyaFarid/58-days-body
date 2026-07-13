import "server-only";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { foodLogs } from "@/lib/db/schema";
import { computeTotals, type NutritionTotals } from "@/lib/nutrition";
import { getCustomFoods } from "@/lib/data/custom-foods";

/** Portions du jour, indexées par clé d'aliment. */
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

/** Fixe le nombre de portions d'un aliment pour un jour. 0 ⇒ supprime la ligne. */
export async function setFoodPortion(
    userId: number,
    date: string,
    foodKey: string,
    portions: number,
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
        .values({ userId, date, foodKey, portions })
        .onConflictDoUpdate({
            target: [foodLogs.userId, foodLogs.date, foodLogs.foodKey],
            set: { portions },
        });
}

export interface NutritionDay extends NutritionTotals {
    date: string;
}

/** Totaux par jour (N derniers jours avec au moins une portion), récent d'abord. */
export async function getNutritionHistory(
    userId: number,
    days: number = 14,
): Promise<NutritionDay[]> {
    const [rows, custom] = await Promise.all([
        db
            .select({ date: foodLogs.date, foodKey: foodLogs.foodKey, portions: foodLogs.portions })
            .from(foodLogs)
            .where(eq(foodLogs.userId, userId))
            .orderBy(desc(foodLogs.date)),
        getCustomFoods(userId),
    ]);

    const byDate = new Map<string, Record<string, number>>();
    for (const r of rows) {
        const m = byDate.get(r.date) ?? {};
        m[r.foodKey] = r.portions;
        byDate.set(r.date, m);
    }
    return [...byDate.entries()]
        .slice(0, days)
        .map(([date, portions]) => ({ date, ...computeTotals(portions, custom) }));
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
