import "server-only";
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

// Remet l'app à zéro : supprime toutes les données (et les blobs photos), mais
// conserve le mot de passe (table credentials). L'utilisateur repasse par l'onboarding.
export async function resetAllData(): Promise<void> {
    const token = getBlobToken();
    const photoRows = await db.select().from(photos);
    for (const p of photoRows) {
        try {
            await del(p.blobUrl, token ? { token } : undefined);
        } catch {
            // On continue même si un blob a déjà disparu.
        }
    }

    await db.delete(photos);
    await db.delete(weightLogs);
    await db.delete(habitLogs);
    await db.delete(measurements);
    await db.delete(workoutSessions); // supprime les set_logs en cascade
    await db.delete(settings);
}
