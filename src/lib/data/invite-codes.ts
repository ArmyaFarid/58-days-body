import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { inviteCodes } from "@/lib/db/schema";

function randomCode(): string {
    // Code court, lisible (sans caractères ambigus), ex. « K7P2-9QMX ».
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let out = "";
    for (let i = 0; i < 8; i++) {
        if (i === 4) out += "-";
        out += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return out;
}

/** Génère un code d'invitation à usage unique pour le compte `createdBy`. */
export async function createInviteCode(createdBy: number): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
        const code = randomCode();
        try {
            await db.insert(inviteCodes).values({ code, createdBy });
            return code;
        } catch {
            // Collision improbable sur la contrainte unique : on réessaie.
        }
    }
    throw new Error("Génération du code impossible.");
}

/** Codes générés par l'utilisateur, le plus récent d'abord. */
export async function getInviteCodes(createdBy: number): Promise<
    { code: string; usedBy: number | null; createdAt: Date }[]
> {
    const rows = await db
        .select({ code: inviteCodes.code, usedBy: inviteCodes.usedBy, createdAt: inviteCodes.createdAt })
        .from(inviteCodes)
        .where(eq(inviteCodes.createdBy, createdBy))
        .orderBy(inviteCodes.createdAt);
    return rows.reverse();
}

/** Vrai si le code existe et n'a pas encore été utilisé. */
export async function isInviteCodeAvailable(code: string): Promise<boolean> {
    if (!code) return false;
    const rows = await db
        .select({ id: inviteCodes.id })
        .from(inviteCodes)
        .where(and(eq(inviteCodes.code, code), isNull(inviteCodes.usedBy)))
        .limit(1);
    return rows.length > 0;
}

/**
 * Consomme un code d'invitation non utilisé de façon atomique.
 * Retourne true si le code était valide et vient d'être marqué utilisé.
 */
export async function consumeInviteCode(code: string, usedBy: number): Promise<boolean> {
    const updated = await db
        .update(inviteCodes)
        .set({ usedBy, usedAt: new Date() })
        .where(and(eq(inviteCodes.code, code), isNull(inviteCodes.usedBy)))
        .returning({ id: inviteCodes.id });
    return updated.length > 0;
}
