import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export async function getStartDate(): Promise<string | null> {
    const rows = await db.select().from(settings).orderBy(desc(settings.id)).limit(1);
    return rows[0]?.startDate ?? null;
}

export async function setStartDate(date: string): Promise<void> {
    // On ne conserve qu'une seule ligne de configuration.
    await db.delete(settings);
    await db.insert(settings).values({ startDate: date });
}
