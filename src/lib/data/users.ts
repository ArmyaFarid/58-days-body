import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export interface UserRow {
    id: number;
    username: string;
    passwordHashB64: string;
    programId: string | null;
}

function toRow(r: typeof users.$inferSelect): UserRow {
    return {
        id: r.id,
        username: r.username,
        passwordHashB64: r.passwordHashB64,
        programId: r.programId,
    };
}

export async function getUserByUsername(username: string): Promise<UserRow | null> {
    const rows = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return rows[0] ? toRow(rows[0]) : null;
}

export async function getUserById(id: number): Promise<UserRow | null> {
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return rows[0] ? toRow(rows[0]) : null;
}

export async function createUser(
    username: string,
    passwordHashB64: string,
    programId: string | null = null,
): Promise<UserRow> {
    const rows = await db
        .insert(users)
        .values({ username, passwordHashB64, programId })
        .returning();
    return toRow(rows[0]);
}

/** Programme de l'utilisateur (NULL ⇒ défaut applicatif). */
export async function getUserProgramId(id: number): Promise<string | null> {
    const rows = await db.select({ programId: users.programId }).from(users).where(eq(users.id, id)).limit(1);
    return rows[0]?.programId ?? null;
}

export async function updateUserPassword(userId: number, passwordHashB64: string): Promise<void> {
    await db.update(users).set({ passwordHashB64 }).where(eq(users.id, userId));
}

export async function countUsers(): Promise<number> {
    const rows = await db.select({ n: sql<number>`count(*)::int` }).from(users);
    return rows[0]?.n ?? 0;
}
