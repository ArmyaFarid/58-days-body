import "server-only";
import { isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import {
    settings,
    weightLogs,
    workoutSessions,
    habitLogs,
    photos,
    measurements,
} from "@/lib/db/schema";

// Migration mono → multi-utilisateur : rattache les données existantes (créées
// avant l'ajout de user_id, donc user_id NULL) au premier compte (bootstrap).
export async function backfillOrphanData(userId: number): Promise<void> {
    await db.update(settings).set({ userId }).where(isNull(settings.userId));
    await db.update(weightLogs).set({ userId }).where(isNull(weightLogs.userId));
    await db.update(workoutSessions).set({ userId }).where(isNull(workoutSessions.userId));
    await db.update(habitLogs).set({ userId }).where(isNull(habitLogs.userId));
    await db.update(photos).set({ userId }).where(isNull(photos.userId));
    await db.update(measurements).set({ userId }).where(isNull(measurements.userId));
}
