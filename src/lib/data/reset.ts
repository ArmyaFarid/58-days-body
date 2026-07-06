import "server-only";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import {
    settings,
    weightLogs,
    workoutSessions,
    habitLogs,
    photos,
    measurements,
} from "@/lib/db/schema";
import { getBlobToken } from "@/lib/blob-token";

// Remet à zéro les données d'UN utilisateur (et ses blobs photos). Le compte
// et le mot de passe sont conservés ; il repasse par l'onboarding.
export async function resetAllData(userId: number): Promise<void> {
    const token = getBlobToken();
    const photoRows = await db.select().from(photos).where(eq(photos.userId, userId));
    for (const p of photoRows) {
        try {
            await del(p.blobUrl, token ? { token } : undefined);
        } catch {
            // On continue même si un blob a déjà disparu.
        }
    }

    await db.delete(photos).where(eq(photos.userId, userId));
    await db.delete(weightLogs).where(eq(weightLogs.userId, userId));
    await db.delete(habitLogs).where(eq(habitLogs.userId, userId));
    await db.delete(measurements).where(eq(measurements.userId, userId));
    await db.delete(workoutSessions).where(eq(workoutSessions.userId, userId)); // set_logs en cascade
    await db.delete(settings).where(eq(settings.userId, userId));
}
