import "server-only";
import { and, eq } from "drizzle-orm";
import { startOfWeek, format } from "date-fns";
import { db } from "@/lib/db";
import { weightLogs } from "@/lib/db/schema";
import { fromISO } from "@/lib/date";
import type { TrendConfig } from "@/lib/program";

export interface WeightEntry {
    date: string;
    weightKg: number;
}

export async function getWeights(userId: number): Promise<WeightEntry[]> {
    const rows = await db
        .select()
        .from(weightLogs)
        .where(eq(weightLogs.userId, userId))
        .orderBy(weightLogs.date);
    return rows.map((r) => ({ date: r.date, weightKg: r.weightKg }));
}

export async function getWeightForDate(userId: number, date: string): Promise<number | null> {
    const rows = await db
        .select()
        .from(weightLogs)
        .where(and(eq(weightLogs.userId, userId), eq(weightLogs.date, date)))
        .limit(1);
    return rows[0]?.weightKg ?? null;
}

export async function upsertWeight(userId: number, date: string, weightKg: number): Promise<void> {
    await db
        .insert(weightLogs)
        .values({ userId, date, weightKg })
        .onConflictDoUpdate({ target: [weightLogs.userId, weightLogs.date], set: { weightKg } });
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
    deltaPerWeek: number | null;
    suggestion: "surplus" | "deficit" | null;
    suggestionText: string | null;
}

export function computeTrend(weights: WeightEntry[], config: TrendConfig): WeightTrend {
    const latest = weights.length ? weights[weights.length - 1] : null;
    const weekly = computeWeeklyAverages(weights);
    const current = weekly.at(-1) ?? null;
    const previous = weekly.at(-2) ?? null;
    const beforePrevious = weekly.at(-3) ?? null;

    let deltaPerWeek: number | null = null;
    if (current && previous) {
        deltaPerWeek = current.avg - previous.avg;
    }

    let suggestion: WeightTrend["suggestion"] = null;
    let suggestionText: string | null = null;
    if (deltaPerWeek !== null) {
        if (deltaPerWeek > config.highGain) {
            suggestion = "deficit";
            suggestionText = config.deficitText;
        } else if (deltaPerWeek < config.lowGain) {
            // Certains programmes n'ajoutent des calories qu'après 2 semaines molles.
            const prevDelta =
                previous && beforePrevious ? previous.avg - beforePrevious.avg : null;
            const twoWeeksOk =
                !config.lowGainTwoWeeks ||
                (prevDelta !== null && prevDelta < config.lowGain);
            if (twoWeeksOk) {
                suggestion = "surplus";
                suggestionText = config.surplusText;
            }
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
