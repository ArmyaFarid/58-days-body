import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { habitLogs } from "@/lib/db/schema";

export type HabitField = "creatine" | "kcal3000" | "protein140" | "sleepBefore23";

export interface HabitDay {
    date: string;
    creatine: boolean;
    kcal3000: boolean;
    protein140: boolean;
    sleepBefore23: boolean;
}

const EMPTY = (date: string): HabitDay => ({
    date,
    creatine: false,
    kcal3000: false,
    protein140: false,
    sleepBefore23: false,
});

export async function getHabit(date: string): Promise<HabitDay> {
    const rows = await db.select().from(habitLogs).where(eq(habitLogs.date, date)).limit(1);
    const r = rows[0];
    if (!r) return EMPTY(date);
    return {
        date: r.date,
        creatine: r.creatine,
        kcal3000: r.kcal3000,
        protein140: r.protein140,
        sleepBefore23: r.sleepBefore23,
    };
}

export async function getAllHabits(): Promise<HabitDay[]> {
    const rows = await db.select().from(habitLogs).orderBy(habitLogs.date);
    return rows.map((r) => ({
        date: r.date,
        creatine: r.creatine,
        kcal3000: r.kcal3000,
        protein140: r.protein140,
        sleepBefore23: r.sleepBefore23,
    }));
}

export async function setHabit(date: string, field: HabitField, value: boolean): Promise<void> {
    const current = await getHabit(date);
    const next = { ...current, [field]: value };
    await db
        .insert(habitLogs)
        .values({
            date,
            creatine: next.creatine,
            kcal3000: next.kcal3000,
            protein140: next.protein140,
            sleepBefore23: next.sleepBefore23,
        })
        .onConflictDoUpdate({ target: habitLogs.date, set: { [field]: value } });
}
