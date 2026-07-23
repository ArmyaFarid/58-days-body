import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { customFoods } from "@/lib/db/schema";
import { CATEGORIES, type Food, type FoodCategory } from "@/lib/nutrition";

function asCategory(value: string): FoodCategory {
    return (CATEGORIES as string[]).includes(value)
        ? (value as FoodCategory)
        : "Lipides et extras";
}

/** Aliments personnalisés de l'utilisateur, au format Food (comme le catalogue). */
export async function getCustomFoods(userId: number): Promise<Food[]> {
    const rows = await db
        .select()
        .from(customFoods)
        .where(eq(customFoods.userId, userId))
        .orderBy(customFoods.name);
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

export async function updateCustomFood(
    userId: number,
    key: string,
    input: NewCustomFood,
): Promise<Food> {
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
        .where(and(eq(customFoods.userId, userId), eq(customFoods.key, key)));
    return { key, ...input };
}

export async function deleteCustomFood(userId: number, key: string): Promise<void> {
    await db
        .delete(customFoods)
        .where(and(eq(customFoods.userId, userId), eq(customFoods.key, key)));
}
