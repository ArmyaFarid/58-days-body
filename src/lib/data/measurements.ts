import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { measurements } from "@/lib/db/schema";

export interface Measurement {
    date: string;
    shoulders: number | null;
    chest: number | null;
    arm: number | null;
    waist: number | null;
    thigh: number | null;
}

export async function getMeasurements(): Promise<Measurement[]> {
    const rows = await db.select().from(measurements).orderBy(measurements.date);
    return rows.map((r) => ({
        date: r.date,
        shoulders: r.shoulders,
        chest: r.chest,
        arm: r.arm,
        waist: r.waist,
        thigh: r.thigh,
    }));
}

export async function getMeasurementForDate(date: string): Promise<Measurement | null> {
    const rows = await db.select().from(measurements).where(eq(measurements.date, date)).limit(1);
    const r = rows[0];
    if (!r) return null;
    return {
        date: r.date,
        shoulders: r.shoulders,
        chest: r.chest,
        arm: r.arm,
        waist: r.waist,
        thigh: r.thigh,
    };
}

export type MeasurementValues = Omit<Measurement, "date">;

export async function upsertMeasurement(date: string, values: MeasurementValues): Promise<void> {
    await db
        .insert(measurements)
        .values({ date, ...values })
        .onConflictDoUpdate({ target: measurements.date, set: values });
}
