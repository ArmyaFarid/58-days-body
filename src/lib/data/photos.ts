import "server-only";
import { eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/lib/db";
import { photos } from "@/lib/db/schema";

export interface Photo {
    id: number;
    date: string;
    pose: string;
    blobUrl: string;
}

export async function getPhotos(): Promise<Photo[]> {
    const rows = await db.select().from(photos).orderBy(photos.date);
    return rows.map((r) => ({ id: r.id, date: r.date, pose: r.pose, blobUrl: r.blobUrl }));
}

export async function addPhoto(date: string, pose: string, blobUrl: string): Promise<void> {
    await db.insert(photos).values({ date, pose, blobUrl });
}

export async function deletePhoto(id: number): Promise<void> {
    const rows = await db.select().from(photos).where(eq(photos.id, id)).limit(1);
    const photo = rows[0];
    if (!photo) return;
    try {
        await del(photo.blobUrl);
    } catch {
        // Le blob a peut-être déjà été supprimé — on retire quand même la ligne.
    }
    await db.delete(photos).where(eq(photos.id, id));
}
