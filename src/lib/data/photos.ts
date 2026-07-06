import "server-only";
import { and, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";
import { getBlobToken } from "@/lib/blob-token";

export interface Photo {
    id: number;
    date: string;
    pose: string;
    blobUrl: string;
}

export async function getPhotos(userId: number): Promise<Photo[]> {
    const rows = await db
        .select()
        .from(photos)
        .where(eq(photos.userId, userId))
        .orderBy(photos.date);
    return rows.map((r) => ({ id: r.id, date: r.date, pose: r.pose, blobUrl: r.blobUrl }));
}

export async function getPhotoById(userId: number, id: number): Promise<Photo | null> {
    const rows = await db
        .select()
        .from(photos)
        .where(and(eq(photos.id, id), eq(photos.userId, userId)))
        .limit(1);
    const r = rows[0];
    return r ? { id: r.id, date: r.date, pose: r.pose, blobUrl: r.blobUrl } : null;
}

export async function addPhoto(
    userId: number,
    date: string,
    pose: string,
    blobUrl: string,
): Promise<void> {
    await db.insert(photos).values({ userId, date, pose, blobUrl });
}

export async function deletePhoto(userId: number, id: number): Promise<void> {
    const rows = await db
        .select()
        .from(photos)
        .where(and(eq(photos.id, id), eq(photos.userId, userId)))
        .limit(1);
    const photo = rows[0];
    if (!photo) return;
    const token = getBlobToken();
    try {
        await del(photo.blobUrl, token ? { token } : undefined);
    } catch {
        // Blob déjà supprimé — on retire quand même la ligne.
    }
    await db.delete(photos).where(and(eq(photos.id, id), eq(photos.userId, userId)));
}
