import { FOODS, type Food } from "./foods";

export * from "./foods";

export const DEFAULT_PROTEIN_GOAL = 140;
export const DEFAULT_CALORIE_GOAL = 3000;

const BY_KEY: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.key, f]));

export function foodByKey(key: string): Food | undefined {
    return BY_KEY[key];
}

export interface NutritionTotals {
    protein: number;
    calories: number;
}

/** Totaux d'une journée à partir des portions par aliment. Ignore les clés inconnues. */
export function computeTotals(portionsByKey: Record<string, number>): NutritionTotals {
    let protein = 0;
    let calories = 0;
    for (const [key, portions] of Object.entries(portionsByKey)) {
        const food = BY_KEY[key];
        if (!food || !portions) continue;
        protein += food.protein * portions;
        calories += food.calories * portions;
    }
    return { protein: Math.round(protein), calories: Math.round(calories) };
}
