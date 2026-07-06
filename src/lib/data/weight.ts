import "server-only";
import { eq } from "drizzle-orm";
import { startOfWeek, format } from "date-fns";
import { db } from "@/lib/db";
import { weightLogs } from "@/lib/db/schema";
import { fromISO } from "@/lib/date";

export interface WeightEntry {
    date: string;
    weightKg: number;
}

export async function getWeights(): Promise<WeightEntry[]> {
    const rows = await db.select().from(weightLogs).orderBy(weightLogs.date);
    return rows.map((r) => ({ date: r.date, weightKg: r.weightKg }));
}

export async function getWeightForDate(date: string): Promise<number | null> {
    const rows = await db.select().from(weightLogs).where(eq(weightLogs.date, date)).limit(1);
    return rows[0]?.weightKg ?? null;
}

export async function upsertWeight(date: string, weightKg: number): Promise<void> {
    await db
        .insert(weightLogs)
        .values({ date, weightKg })
        .onConflictDoUpdate({ target: weightLogs.date, set: { weightKg } });
}

export interface WeeklyAverage {
    weekStart: string;
    avg: number;
    count: number;
}

/** Moyennes hebdomadaires (semaine commençant le lundi). */
export function computeWeeklyAverages(weights: WeightEntry[]): WeeklyAverage[] {
    const buckets = new Map<string, number[]>();
    for (const w of weights) {
        const weekStart = format(startOfWeek(fromISO(w.date), { weekStartsOn: 1 }), "yyyy-MM-dd");
        const arr = buckets.get(weekStart) ?? [];
        arr.push(w.weightKg);
        buckets.set(weekStart, arr);
    }
    return [...buckets.entries()]
        .map(([weekStart, vals]) => ({
            weekStart,
            avg: vals.reduce((a, b) => a + b, 0) / vals.length,
            count: vals.length,
        }))
        .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
}

export interface WeightTrend {
    latest: WeightEntry | null;
    currentWeekAvg: number | null;
    previousWeekAvg: number | null;
    /** Variation kg/semaine entre les deux dernières semaines complètes. */
    deltaPerWeek: number | null;
    /** Suggestion nutritionnelle selon les règles du programme. */
    suggestion: "surplus" | "deficit" | null;
    suggestionText: string | null;
}

export function computeTrend(weights: WeightEntry[]): WeightTrend {
    const latest = weights.length ? weights[weights.length - 1] : null;
    const weekly = computeWeeklyAverages(weights);
    const current = weekly.at(-1) ?? null;
    const previous = weekly.at(-2) ?? null;

    let deltaPerWeek: number | null = null;
    if (current && previous) {
        deltaPerWeek = current.avg - previous.avg;
    }

    let suggestion: WeightTrend["suggestion"] = null;
    let suggestionText: string | null = null;
    if (deltaPerWeek !== null) {
        if (deltaPerWeek > 0.5) {
            suggestion = "deficit";
            suggestionText = "Prise > 0,5 kg/sem → retire ~200 kcal/jour.";
        } else if (deltaPerWeek < 0.2) {
            suggestion = "surplus";
            suggestionText = "Prise < 0,2 kg/sem → ajoute ~250 kcal/jour (si ça dure 2 semaines).";
        }
    }

    return {
        latest,
        currentWeekAvg: current?.avg ?? null,
        previousWeekAvg: previous?.avg ?? null,
        deltaPerWeek,
        suggestion,
        suggestionText,
    };
}
