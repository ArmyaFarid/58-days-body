import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

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
