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
    fat: number;
}

export interface Macro {
    protein: number;
    calories: number;
    fat: number;
}

/** Macros (par portion) d'un aliment : catalogue ou aliment perso (extraFoods). */
export function foodMacro(foodKey: string, extraFoods: Food[] = []): Macro | undefined {
    const f = BY_KEY[foodKey] ?? extraFoods.find((x) => x.key === foodKey);
    return f ? { protein: f.protein, calories: f.calories, fat: f.fat } : undefined;
}

/**
 * Une portion loggée, avec ses macros FIGÉES au moment de la saisie (snapshot).
 * Ainsi, modifier un aliment plus tard ne change pas les journées passées.
 */
export interface LoggedEntry {
    foodKey: string;
    portions: number;
    protein: number;
    calories: number;
    fat: number;
}

export function totalsOfEntries(entries: LoggedEntry[]): NutritionTotals {
    let protein = 0;
    let calories = 0;
    let fat = 0;
    for (const e of entries) {
        protein += e.protein * e.portions;
        calories += e.calories * e.portions;
        fat += e.fat * e.portions;
    }
    return {
        protein: Math.round(protein),
        calories: Math.round(calories),
        fat: Math.round(fat),
    };
}
