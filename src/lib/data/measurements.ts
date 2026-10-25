import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { measurements } from "@/lib/db/schema";

export interface Measurement {
    date: string;
    shoulders: number | null;
    chest: number | null;
    arm: number | null;
    waist: number | null;
    thigh: number | null;
    hips: number | null;
}

export async function getMeasurements(userId: number): Promise<Measurement[]> {
    const rows = await db
        .select()
        .from(measurements)
        .where(eq(measurements.userId, userId))
        .orderBy(measurements.date);
    return rows.map((r) => ({
        date: r.date,
        shoulders: r.shoulders,
        chest: r.chest,
        arm: r.arm,
        waist: r.waist,
        thigh: r.thigh,
        hips: r.hips,
    }));
}

export async function getMeasurementForDate(
    userId: number,
    date: string,
): Promise<Measurement | null> {
    const rows = await db
        .select()
        .from(measurements)
        .where(and(eq(measurements.userId, userId), eq(measurements.date, date)))
        .limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
        date: r.date,
        shoulders: r.shoulders,
        chest: r.chest,
        arm: r.arm,
        waist: r.waist,
        thigh: r.thigh,
        hips: r.hips,
    };
}

/** Champ absent (undefined) = non modifié. */
export type MeasurementValues = Partial<Omit<Measurement, "date">>;

export async function upsertMeasurement(
    userId: number,
    date: string,
    values: MeasurementValues,
): Promise<void> {
    const set = Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined));
    const query = db.insert(measurements).values({ userId, date, ...set });
    await (Object.keys(set).length > 0
        ? query.onConflictDoUpdate({ target: [measurements.userId, measurements.date], set })
        : query.onConflictDoNothing());
}
