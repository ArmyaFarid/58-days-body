import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export interface UserRow {
    id: number;
    username: string;
    passwordHashB64: string;
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    const r = rows[0];
    return r ? { id: r.id, username: r.username, passwordHashB64: r.passwordHashB64 } : null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    const r = rows[0];
    return r ? { id: r.id, username: r.username, passwordHashB64: r.passwordHashB64 } : null;
}

export async function createUser(username: string, passwordHashB64: string): Promise<UserRow> {
    const rows = await db.insert(users).values({ username, passwordHashB64 }).returning();
    const r = rows[0];
    return { id: r.id, username: r.username, passwordHashB64: r.passwordHashB64 };
}

export async function updateUserPassword(userId: number, passwordHashB64: string): Promise<void> {
    await db.update(users).set({ passwordHashB64 }).where(eq(users.id, userId));
}

export async function countUsers(): Promise<number> {
    const rows = await db.select({ n: sql<number>`count(*)::int` }).from(users);
    return rows[0]?.n ?? 0;
}
