import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customPresets } from "@/lib/db/schema";

export interface PresetItem {
    foodKey: string;
    portions: number;
}

export interface CustomPreset {
    id: number;
    name: string;
    items: PresetItem[];
}

export async function getCustomPresets(userId: number): Promise<CustomPreset[]> {
    const rows = await db
        .select()
        .from(customPresets)
        .where(eq(customPresets.userId, userId))
        .orderBy(customPresets.name);
    return rows.map((r) => ({ id: r.id, name: r.name, items: r.items }));
}

export async function addCustomPreset(
    userId: number,
    name: string,
    items: PresetItem[],
): Promise<CustomPreset> {
    const inserted = await db
        .insert(customPresets)
        .values({ userId, name, items })
        .returning();
    const r = inserted[0];
    return { id: r.id, name: r.name, items: r.items };
}

export async function updateCustomPreset(
    userId: number,
    id: number,
    name: string,
    items: PresetItem[],
): Promise<CustomPreset> {
    const rows = await db
        .update(customPresets)
        .set({ name, items })
        .where(and(eq(customPresets.id, id), eq(customPresets.userId, userId)))
        .returning();
    const r = rows[0];
    return { id: r.id, name: r.name, items: r.items };
}

/** Items d'un preset appartenant à l'utilisateur (null si introuvable). */
export async function getCustomPresetItems(
    userId: number,
    id: number,
): Promise<PresetItem[] | null> {
    const rows = await db
        .select({ items: customPresets.items })
        .from(customPresets)
        .where(and(eq(customPresets.id, id), eq(customPresets.userId, userId)))
        .limit(1);
    return rows[0]?.items ?? null;
}

export async function deleteCustomPreset(userId: number, id: number): Promise<void> {
    await db
        .delete(customPresets)
        .where(and(eq(customPresets.id, id), eq(customPresets.userId, userId)));
}
