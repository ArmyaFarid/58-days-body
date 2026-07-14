"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId, changePassword } from "@/lib/auth";
import { setStartDate, getNutritionGoals, setNutritionGoals } from "@/lib/data/settings";
import { getFoodPortions, setFoodPortion } from "@/lib/data/nutrition";
import { getCustomFoods, addCustomFood } from "@/lib/data/custom-foods";
import {
    addCustomPreset,
    deleteCustomPreset,
    getCustomPresetItems,
} from "@/lib/data/custom-presets";
import { PRESETS, CATEGORIES, computeTotals, type FoodCategory } from "@/lib/nutrition";
import { upsertWeight } from "@/lib/data/weight";
import { setHabit, type HabitField } from "@/lib/data/habits";
import { saveSetLog, setSessionCompleted } from "@/lib/data/workout";
import { deletePhoto } from "@/lib/data/photos";
import { upsertMeasurement } from "@/lib/data/measurements";
import { resetAllData } from "@/lib/data/reset";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export async function setStartDateAction(date: string) {
    const userId = await requireUserId();
    const parsed = isoDate.parse(date);
    await setStartDate(userId, parsed);
    revalidatePath("/");
    revalidatePath("/onboarding");
}

const weightSchema = z.object({
    date: isoDate,
    weightKg: z.number().positive().max(400),
});

export async function upsertWeightAction(date: string, weightKg: number) {
    const userId = await requireUserId();
    const parsed = weightSchema.parse({ date, weightKg });
    await upsertWeight(userId, parsed.date, parsed.weightKg);
    revalidatePath("/");
    revalidatePath("/suivi");
}

const habitFields = ["creatine", "kcal3000", "protein140", "sleepBefore23"] as const;

export async function setHabitAction(date: string, field: HabitField, value: boolean) {
    const userId = await requireUserId();
    const parsedDate = isoDate.parse(date);
    const parsedField = z.enum(habitFields).parse(field);
    await setHabit(userId, parsedDate, parsedField, value);
    revalidatePath("/");
    revalidatePath("/suivi");
    revalidatePath("/habitudes");
}

const setLogSchema = z.object({
    sessionId: z.number().int().positive(),
    exerciseKey: z.string().min(1).max(64),
    setIndex: z.number().int().min(0).max(20),
    reps: z.number().int().min(0).max(999).nullable(),
    band: z.string().max(64).nullable(),
    variant: z.string().max(64).nullable(),
    notes: z.string().max(280).nullable(),
});

export async function saveSetLogAction(input: z.infer<typeof setLogSchema>) {
    const userId = await requireUserId();
    const parsed = setLogSchema.parse(input);
    await saveSetLog({ userId, ...parsed });
    revalidatePath("/seance");
}

export async function completeSessionAction(sessionId: number, completed: boolean) {
    const userId = await requireUserId();
    const id = z.number().int().positive().parse(sessionId);
    await setSessionCompleted(userId, id, Boolean(completed));
    revalidatePath("/seance");
    revalidatePath("/");
}

export async function deletePhotoAction(id: number) {
    const userId = await requireUserId();
    const parsed = z.number().int().positive().parse(id);
    await deletePhoto(userId, parsed);
    revalidatePath("/suivi");
}

const measure = z.number().min(0).max(300).nullable();
const measurementSchema = z.object({
    date: isoDate,
    shoulders: measure,
    chest: measure,
    arm: measure,
    waist: measure,
    thigh: measure,
});

export async function upsertMeasurementAction(input: z.infer<typeof measurementSchema>) {
    const userId = await requireUserId();
    const { date, ...values } = measurementSchema.parse(input);
    await upsertMeasurement(userId, date, values);
    revalidatePath("/suivi");
}

export async function changePasswordAction(current: string, next: string) {
    const userId = await requireUserId();
    const result = await changePassword(userId, current, next);
    if (result.error) throw new Error(result.error);
}

export async function resetAllAction() {
    const userId = await requireUserId();
    await resetAllData(userId);
    revalidatePath("/");
    revalidatePath("/suivi");
    revalidatePath("/habitudes");
    revalidatePath("/seance");
}

// ─── Nutrition ───

/** Coche automatiquement les habitudes 140 g / 3000 kcal selon les totaux du jour. */
async function syncNutritionHabits(userId: number, date: string) {
    const [portions, goals, custom] = await Promise.all([
        getFoodPortions(userId, date),
        getNutritionGoals(userId),
        getCustomFoods(userId),
    ]);
    const totals = computeTotals(portions, custom);
    await setHabit(userId, date, "protein140", totals.protein >= goals.proteinGoal);
    await setHabit(userId, date, "kcal3000", totals.calories >= goals.calorieGoal);
}

const foodPortionSchema = z.object({
    date: isoDate,
    foodKey: z.string().min(1).max(64),
    portions: z.number().int().min(0).max(99),
});

export async function setFoodPortionAction(input: z.infer<typeof foodPortionSchema>) {
    const userId = await requireUserId();
    const { date, foodKey, portions } = foodPortionSchema.parse(input);
    await setFoodPortion(userId, date, foodKey, portions);
    await syncNutritionHabits(userId, date);
    revalidatePath("/");
    revalidatePath("/habitudes");
    revalidatePath("/suivi");
}

export async function getFoodPortionsAction(date: string): Promise<Record<string, number>> {
    const userId = await requireUserId();
    const d = isoDate.parse(date);
    return getFoodPortions(userId, d);
}

export async function applyPresetAction(date: string, presetKey: string) {
    const userId = await requireUserId();
    const d = isoDate.parse(date);
    const key = z.string().min(1).max(32).parse(presetKey);
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) throw new Error("Preset inconnu.");
    const current = await getFoodPortions(userId, d);
    for (const item of preset.items) {
        const next = (current[item.foodKey] ?? 0) + item.portions;
        await setFoodPortion(userId, d, item.foodKey, next);
    }
    await syncNutritionHabits(userId, d);
    revalidatePath("/");
    revalidatePath("/habitudes");
    revalidatePath("/suivi");
}

const goalsSchema = z.object({
    proteinGoal: z.number().int().min(1).max(1000),
    calorieGoal: z.number().int().min(1).max(20000),
});

export async function setNutritionGoalsAction(input: z.infer<typeof goalsSchema>) {
    const userId = await requireUserId();
    const { proteinGoal, calorieGoal } = goalsSchema.parse(input);
    await setNutritionGoals(userId, proteinGoal, calorieGoal);
    revalidatePath("/");
    revalidatePath("/parametres");
}

const newFoodSchema = z.object({
    name: z.string().trim().min(1).max(60),
    portionLabel: z.string().trim().min(1).max(40),
    metric: z.string().trim().max(40),
    protein: z.number().min(0).max(500),
    calories: z.number().min(0).max(5000),
    category: z.string().refine((v) => (CATEGORIES as string[]).includes(v), "Catégorie invalide"),
});

export async function addCustomFoodAction(input: z.infer<typeof newFoodSchema>) {
    const userId = await requireUserId();
    const parsed = newFoodSchema.parse(input);
    const food = await addCustomFood(userId, {
        name: parsed.name,
        portionLabel: parsed.portionLabel,
        metric: parsed.metric,
        protein: parsed.protein,
        calories: parsed.calories,
        category: parsed.category as FoodCategory,
    });
    revalidatePath("/");
    return food;
}

const presetItemSchema = z.object({
    foodKey: z.string().min(1).max(64),
    portions: z.number().int().min(1).max(99),
});

const newPresetSchema = z.object({
    name: z.string().trim().min(1).max(40),
    items: z.array(presetItemSchema).min(1).max(40),
});

export async function addCustomPresetAction(input: z.infer<typeof newPresetSchema>) {
    const userId = await requireUserId();
    const { name, items } = newPresetSchema.parse(input);
    const preset = await addCustomPreset(userId, name, items);
    revalidatePath("/");
    return preset;
}

export async function applyCustomPresetAction(date: string, presetId: number) {
    const userId = await requireUserId();
    const d = isoDate.parse(date);
    const id = z.number().int().positive().parse(presetId);
    const items = await getCustomPresetItems(userId, id);
    if (!items) throw new Error("Repas introuvable.");
    const current = await getFoodPortions(userId, d);
    for (const item of items) {
        const next = (current[item.foodKey] ?? 0) + item.portions;
        await setFoodPortion(userId, d, item.foodKey, next);
    }
    await syncNutritionHabits(userId, d);
    revalidatePath("/");
    revalidatePath("/habitudes");
    revalidatePath("/suivi");
}

export async function deleteCustomPresetAction(presetId: number) {
    const userId = await requireUserId();
    const id = z.number().int().positive().parse(presetId);
    await deleteCustomPreset(userId, id);
    revalidatePath("/");
}
