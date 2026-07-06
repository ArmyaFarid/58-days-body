import "server-only";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { credentials } from "@/lib/db/schema";

export async function getStoredPasswordHashB64(): Promise<string | null> {
    const rows = await db.select().from(credentials).orderBy(desc(credentials.id)).limit(1);
    return rows[0]?.passwordHashB64 ?? null;
}

export async function setStoredPasswordHashB64(b64: string): Promise<void> {
    await db.delete(credentials);
    await db.insert(credentials).values({ passwordHashB64: b64 });
}
