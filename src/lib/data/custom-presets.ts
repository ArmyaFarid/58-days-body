import "server-only";
import { eq } from "drizzle-orm";
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

// Bibliothèque commune : les repas sont partagés par tous les comptes. `user_id`
// ne sert qu'à tracer l'auteur ; aucune lecture ni écriture ne filtre dessus.

export async function getCustomPresets(): Promise<CustomPreset[]> {
    const rows = await db.select().from(customPresets).orderBy(customPresets.name);
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
    id: number,
    name: string,
    items: PresetItem[],
): Promise<CustomPreset> {
    const rows = await db
        .update(customPresets)
        .set({ name, items })
        .where(eq(customPresets.id, id))
        .returning();
    const r = rows[0];
    return { id: r.id, name: r.name, items: r.items };
}

/** Items d'un repas de la bibliothèque commune (null si introuvable). */
export async function getCustomPresetItems(id: number): Promise<PresetItem[] | null> {
    const rows = await db
        .select({ items: customPresets.items })
        .from(customPresets)
        .where(eq(customPresets.id, id))
        .limit(1);
    return rows[0]?.items ?? null;
}

export async function deleteCustomPreset(id: number): Promise<void> {
    await db.delete(customPresets).where(eq(customPresets.id, id));
}
