import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customFoods } from "@/lib/db/schema";
import { CATEGORIES, type Food, type FoodCategory } from "@/lib/nutrition";

function asCategory(value: string): FoodCategory {
    return (CATEGORIES as string[]).includes(value)
        ? (value as FoodCategory)
        : "Lipides et extras";
}

// Bibliothèque commune : les aliments perso sont partagés par tous les comptes.
// `user_id` ne sert qu'à tracer l'auteur ; aucune lecture ni écriture ne filtre
// dessus. Les repas partagés peuvent ainsi référencer n'importe quel aliment.

/** Aliments personnalisés (tous comptes), au format Food (comme le catalogue). */
export async function getCustomFoods(): Promise<Food[]> {
    const rows = await db.select().from(customFoods).orderBy(customFoods.name);
    return rows.map((r) => ({
        key: r.key,
        name: r.name,
        portionLabel: r.portionLabel,
        metric: r.metric,
        protein: r.protein,
        calories: r.calories,
        fat: r.fat ?? 0,
        category: asCategory(r.category),
    }));
}

export interface NewCustomFood {
    name: string;
    portionLabel: string;
    metric: string;
    protein: number;
    calories: number;
    fat: number;
    category: FoodCategory;
}

export async function addCustomFood(userId: number, input: NewCustomFood): Promise<Food> {
    const key = `custom-${crypto.randomUUID()}`;
    await db.insert(customFoods).values({
        userId,
        key,
        name: input.name,
        portionLabel: input.portionLabel,
        metric: input.metric,
        protein: input.protein,
        calories: input.calories,
        fat: input.fat,
        category: input.category,
    });
    return { key, ...input };
}

export async function updateCustomFood(key: string, input: NewCustomFood): Promise<Food> {
    await db
        .update(customFoods)
        .set({
            name: input.name,
            portionLabel: input.portionLabel,
            metric: input.metric,
            protein: input.protein,
            calories: input.calories,
            fat: input.fat,
            category: input.category,
        })
        .where(eq(customFoods.key, key));
    return { key, ...input };
}

export async function deleteCustomFood(key: string): Promise<void> {
    await db.delete(customFoods).where(eq(customFoods.key, key));
}
