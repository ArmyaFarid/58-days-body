"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId, changePassword, getSession, setActingUser } from "@/lib/auth";
import { setStartDate, getNutritionGoals, updateSettings } from "@/lib/data/settings";
import { createInviteCode, canActAs } from "@/lib/data/invite-codes";
import { getUserById, deleteUser, getInternatPreference, setInternatPreference } from "@/lib/data/users";
import {
    getUserPrograms,
    addUserProgram,
    setUserProgramStatus,
    setActiveProgramId,
    getAbandonedProgramIds,
} from "@/lib/data/user-programs";
import {
    CATALOG,
    PROGRAMME_58,
    MASSE_FEMME,
    FESSIERS_POSTURE,
    getProgram,
    sessionForDate,
    applyInternat,
    effectiveInternat,
    substitutionsOf,
    type InternatSessionState,
} from "@/lib/program";
import { todayISO } from "@/lib/date";
import { getFoodPortions, getLoggedEntries, setFoodPortion } from "@/lib/data/nutrition";
import {
    getCustomFoods,
    addCustomFood,
    updateCustomFood,
    deleteCustomFood,
} from "@/lib/data/custom-foods";
import {
    addCustomPreset,
    updateCustomPreset,
    deleteCustomPreset,
    getCustomPresetItems,
} from "@/lib/data/custom-presets";
import {
    PRESETS,
    CATEGORIES,
    foodMacro,
    totalsOfEntries,
    type Food,
    type FoodCategory,
} from "@/lib/nutrition";
import { upsertWeight } from "@/lib/data/weight";
import { setHabit, type HabitField } from "@/lib/data/habits";
import {
    saveSetLog,
    setSessionCompleted,
    setSessionFeeling,
    updateExerciseVariant,
    getOwnedSession,
    setSessionInternat,
} from "@/lib/data/workout";
import { deletePhoto } from "@/lib/data/photos";
import { upsertMeasurement } from "@/lib/data/measurements";
import { resetAllData } from "@/lib/data/reset";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export async function setStartDateAction(date: string) {
    const userId = await requireUserId();
    const parsed = isoDate.parse(date);
    await setStartDate(userId, parsed);
    // Crée la ligne du programme d'origine à partir de cette date.
    await getUserPrograms(userId);
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
    await freezeInternat(userId, parsed.sessionId);
    revalidatePath("/seance");
}

const variantSchema = z.object({
    sessionId: z.number().int().positive(),
    exerciseKey: z.string().min(1).max(64),
    variant: z.string().max(64).nullable(),
});

export async function setExerciseVariantAction(input: z.infer<typeof variantSchema>) {
    const userId = await requireUserId();
    const { sessionId, exerciseKey, variant } = variantSchema.parse(input);
    const clean = variant && variant.trim() ? variant.trim() : null;
    await updateExerciseVariant(userId, sessionId, exerciseKey, clean);
    revalidatePath("/seance");
    revalidatePath("/suivi");
}

const feelingSchema = z.object({
    sessionId: z.number().int().positive(),
    feeling: z.enum(["facile", "juste", "dur"]).nullable(),
});

export async function setSessionFeelingAction(input: z.infer<typeof feelingSchema>) {
    const userId = await requireUserId();
    const { sessionId, feeling } = feelingSchema.parse(input);
    await setSessionFeeling(userId, sessionId, feeling);
    revalidatePath("/seance");
}

export async function completeSessionAction(sessionId: number, completed: boolean) {
    const userId = await requireUserId();
    const id = z.number().int().positive().parse(sessionId);
    await setSessionCompleted(userId, id, Boolean(completed));
    await freezeInternat(userId, id);
    revalidatePath("/seance");
    revalidatePath("/");
}

interface InternatPatch {
    on?: boolean;
    hasBed?: boolean;
    revert?: { exerciseKey: string; reverted: boolean };
}

/**
 * Fige le mode Internat sur une séance (première série, complétion) ou y
 * applique un changement. Une séance déjà figée sans changement n'est pas
 * réécrite : couper le réglage global ne modifie jamais une séance faite.
 */
async function freezeInternat(userId: number, sessionId: number, patch?: InternatPatch): Promise<boolean> {
    const session = await getOwnedSession(userId, sessionId);
    if (!session) return false;
    if (session.internat && !patch) return true;
    // Séance antérieure au multi-programme : programme retrouvé par le type de séance.
    const program = session.programId
        ? getProgram(session.programId)
        : ([PROGRAMME_58, MASSE_FEMME, FESSIERS_POSTURE].find((p) => p.sessions[session.dayType]) ?? PROGRAMME_58);
    const base = program.sessions[session.dayType];
    const exercises = base ? sessionForDate(base, session.date).exercises : [];

    const current = effectiveInternat(session.internat, session.date, todayISO(), await getInternatPreference(userId));
    const reverted = new Set(current.reverted);
    if (patch?.revert) {
        if (patch.revert.reverted) reverted.add(patch.revert.exerciseKey);
        else reverted.delete(patch.revert.exerciseKey);
    }
    const next: InternatSessionState = {
        on: patch?.on ?? current.on,
        hasBed: patch?.hasBed ?? current.hasBed,
        reverted: [...reverted],
        substitutions: {},
    };
    if (next.on) next.substitutions = substitutionsOf(applyInternat(program.id, exercises, next));
    await setSessionInternat(userId, sessionId, next);
    return true;
}

const sessionInternatSchema = z.object({
    sessionId: z.number().int().positive(),
    on: z.boolean().optional(),
    hasBed: z.boolean().optional(),
    revert: z.object({ exerciseKey: z.string().min(1).max(64), reverted: z.boolean() }).optional(),
});

/** Mode Internat pour cette séance seulement (bascule, lit, retour à l'original). */
export async function setSessionInternatAction(
    input: z.infer<typeof sessionInternatSchema>,
): Promise<{ error?: string }> {
    const userId = await requireUserId();
    const { sessionId, ...patch } = sessionInternatSchema.parse(input);
    if (!(await freezeInternat(userId, sessionId, patch))) return { error: "Séance introuvable." };
    revalidatePath("/seance");
    return {};
}

const internatModeSchema = z.object({
    mode: z.boolean().optional(),
    hasBed: z.boolean().optional(),
    /** Séance en cours : reçoit aussi le changement (sinon, figée, elle le garderait). */
    sessionId: z.number().int().positive().optional(),
});

/** Réglage global : actif pour toutes les séances jusqu'à ce qu'on le coupe. */
export async function setInternatModeAction(
    input: z.infer<typeof internatModeSchema>,
): Promise<{ error?: string }> {
    const userId = await requireUserId();
    const { sessionId, ...patch } = internatModeSchema.parse(input);
    await setInternatPreference(userId, patch);
    if (sessionId) await freezeInternat(userId, sessionId, { on: patch.mode, hasBed: patch.hasBed });
    revalidatePath("/", "layout");
    return {};
}

export async function deletePhotoAction(id: number) {
    const userId = await requireUserId();
    const parsed = z.number().int().positive().parse(id);
    await deletePhoto(userId, parsed);
    revalidatePath("/suivi");
}

const measure = z.number().min(0).max(300).nullable().optional();
const measurementSchema = z.object({
    date: isoDate,
    hips: measure,
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
    const [entries, goals] = await Promise.all([
        getLoggedEntries(userId, date),
        getNutritionGoals(userId),
    ]);
    const totals = totalsOfEntries(entries);
    await setHabit(userId, date, "protein140", totals.protein >= goals.proteinGoal);
    await setHabit(userId, date, "kcal3000", totals.calories >= goals.calorieGoal);
}

/** Macros courantes d'un aliment (catalogue ou perso) — figées à la saisie. */
function macroOf(foodKey: string, custom: Food[]): { protein: number; calories: number; fat: number } {
    return foodMacro(foodKey, custom) ?? { protein: 0, calories: 0, fat: 0 };
}

const foodPortionSchema = z.object({
    date: isoDate,
    foodKey: z.string().min(1).max(64),
    portions: z.number().int().min(0).max(99),
});

export async function setFoodPortionAction(input: z.infer<typeof foodPortionSchema>) {
    const userId = await requireUserId();
    const { date, foodKey, portions } = foodPortionSchema.parse(input);
    const custom = await getCustomFoods();
    const { protein, calories, fat } = macroOf(foodKey, custom);
    await setFoodPortion(userId, date, foodKey, portions, protein, calories, fat);
    await syncNutritionHabits(userId, date);
    revalidatePath("/");
    revalidatePath("/habitudes");
    revalidatePath("/suivi");
}

export async function getFoodPortionsAction(date: string) {
    const userId = await requireUserId();
    const d = isoDate.parse(date);
    return getLoggedEntries(userId, d);
}

export async function applyPresetAction(date: string, presetKey: string) {
    const userId = await requireUserId();
    const d = isoDate.parse(date);
    const key = z.string().min(1).max(32).parse(presetKey);
    const preset = PRESETS.find((p) => p.key === key);
    if (!preset) throw new Error("Preset inconnu.");
    const [current, custom] = await Promise.all([getFoodPortions(userId, d), getCustomFoods()]);
    for (const item of preset.items) {
        const next = (current[item.foodKey] ?? 0) + item.portions;
        const { protein, calories, fat } = macroOf(item.foodKey, custom);
        await setFoodPortion(userId, d, item.foodKey, next, protein, calories, fat);
    }
    await syncNutritionHabits(userId, d);
    revalidatePath("/");
    revalidatePath("/habitudes");
    revalidatePath("/suivi");
}

const optInt = (max: number) => z.number().int().min(0).max(max).optional();
const goalsSchema = z.object({
    proteinGoal: optInt(1000),
    calorieGoal: optInt(20000),
    fatGoal: optInt(1000).nullable(),
    proteinGoal2: optInt(1000),
    calorieGoal2: optInt(20000),
    fatGoal2: optInt(1000).nullable(),
    targetWeightKg: z.number().min(20).max(400).optional(),
    holdPhase1: z.boolean().optional(),
    creatine: z.boolean().optional(),
});

export async function setNutritionGoalsAction(input: z.infer<typeof goalsSchema>) {
    const userId = await requireUserId();
    const patch = goalsSchema.parse(input);
    await updateSettings(userId, patch);
    revalidatePath("/", "layout");
}

export async function generateInviteCodeAction() {
    const userId = await requireUserId();
    const code = await createInviteCode(userId);
    revalidatePath("/parametres");
    return code;
}

// ─── Consultation d'un compte invité (« voir comme ») ───

/** Bascule vers le compte d'un invité (autorisé si le propriétaire l'a invité). */
export async function switchToUserAction(targetUserId: number) {
    const session = await getSession();
    if (!session) throw new Error("Non authentifié.");
    const target = z.number().int().positive().parse(targetUserId);
    const owner = { userId: session.ownerUserId, username: session.ownerUsername };

    if (target !== owner.userId) {
        const allowed = await canActAs(owner.userId, target);
        if (!allowed) throw new Error("Accès refusé.");
        const user = await getUserById(target);
        if (!user) throw new Error("Compte introuvable.");
        await setActingUser(owner, { userId: user.id, username: user.username });
    } else {
        await setActingUser(owner, owner);
    }
    revalidatePath("/", "layout");
}

/** Revient au compte propriétaire. */
export async function switchBackAction() {
    const session = await getSession();
    if (!session) throw new Error("Non authentifié.");
    const owner = { userId: session.ownerUserId, username: session.ownerUsername };
    await setActingUser(owner, owner);
    revalidatePath("/", "layout");
}

// ─── Programmes suivis ───

const programIdSchema = z.string().min(1).max(32);

/** Bascule la vue de l'app sur un autre programme suivi (mémorisé). */
export async function setActiveProgramAction(programId: string) {
    const userId = await requireUserId();
    const id = programIdSchema.parse(programId);
    const rows = await getUserPrograms(userId);
    if (!rows.some((r) => r.programId === id && r.status === "active")) {
        throw new Error("Programme non suivi.");
    }
    await setActiveProgramId(userId, id);
    revalidatePath("/", "layout");
}

/** Ajoute un programme du catalogue (ou réactive un programme déjà suivi). */
export async function addProgramAction(programId: string, startDate: string) {
    const userId = await requireUserId();
    const id = programIdSchema.parse(programId);
    const date = isoDate.parse(startDate);
    const resumable = CATALOG.some((p) => p.id === id) || (await getAbandonedProgramIds(userId)).includes(id);
    if (!resumable) throw new Error("Programme inconnu.");
    await addUserProgram(userId, id, date);
    await setActiveProgramId(userId, id);
    revalidatePath("/", "layout");
}

// Les refus sont renvoyés (pas levés) : Next masque le message des erreurs en prod.
/** Met en pause ou réactive un programme. Les données sont toujours conservées. */
export async function setProgramStatusAction(
    programId: string,
    paused: boolean,
): Promise<{ error?: string }> {
    const userId = await requireUserId();
    const id = programIdSchema.parse(programId);
    const rows = await getUserPrograms(userId);
    if (!rows.some((r) => r.programId === id)) return { error: "Programme non suivi." };
    await setUserProgramStatus(userId, id, paused ? "paused" : "active");
    if (!paused) await setActiveProgramId(userId, id);
    revalidatePath("/", "layout");
    return {};
}

/**
 * Abandonne un programme : il sort de « Mes programmes » et du sélecteur, et
 * revient au catalogue. Ses séances et réglages restent en base. Sans aucun
 * programme suivi, l'app propose d'en choisir un (onboarding).
 */
export async function abandonProgramAction(programId: string): Promise<{ error?: string }> {
    const userId = await requireUserId();
    const id = programIdSchema.parse(programId);
    const rows = await getUserPrograms(userId);
    if (!rows.some((r) => r.programId === id)) return { error: "Programme non suivi." };
    await setUserProgramStatus(userId, id, "abandoned");
    revalidatePath("/", "layout");
    return {};
}

/** Supprime définitivement un compte invité (et toutes ses données). */
export async function deleteUserAction(targetUserId: number) {
    const session = await getSession();
    if (!session) throw new Error("Non authentifié.");
    const target = z.number().int().positive().parse(targetUserId);
    if (target === session.ownerUserId) throw new Error("Impossible de supprimer son propre compte.");
    const allowed = await canActAs(session.ownerUserId, target);
    if (!allowed) throw new Error("Accès refusé.");

    // Nettoie données + blobs photos, puis supprime le compte (cascade pour le reste).
    await resetAllData(target);
    await deleteUser(target);

    // Si on consultait ce compte, revenir au propriétaire.
    const owner = { userId: session.ownerUserId, username: session.ownerUsername };
    await setActingUser(owner, owner);
    revalidatePath("/", "layout");
}

const newFoodSchema = z.object({
    name: z.string().trim().min(1).max(60),
    portionLabel: z.string().trim().min(1).max(40),
    metric: z.string().trim().max(40),
    protein: z.number().min(0).max(500),
    calories: z.number().min(0).max(5000),
    fat: z.number().min(0).max(500),
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
        fat: parsed.fat,
        category: parsed.category as FoodCategory,
    });
    revalidatePath("/");
    return food;
}

const editFoodSchema = newFoodSchema.extend({ key: z.string().min(1).max(64) });

export async function updateCustomFoodAction(input: z.infer<typeof editFoodSchema>) {
    await requireUserId();
    const parsed = editFoodSchema.parse(input);
    const food = await updateCustomFood(parsed.key, {
        name: parsed.name,
        portionLabel: parsed.portionLabel,
        metric: parsed.metric,
        protein: parsed.protein,
        calories: parsed.calories,
        fat: parsed.fat,
        category: parsed.category as FoodCategory,
    });
    revalidatePath("/");
    return food;
}

export async function deleteCustomFoodAction(key: string) {
    await requireUserId();
    const k = z.string().min(1).max(64).parse(key);
    await deleteCustomFood(k);
    revalidatePath("/");
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

const editPresetSchema = newPresetSchema.extend({ id: z.number().int().positive() });

export async function updateCustomPresetAction(input: z.infer<typeof editPresetSchema>) {
    await requireUserId();
    const { id, name, items } = editPresetSchema.parse(input);
    const preset = await updateCustomPreset(id, name, items);
    revalidatePath("/");
    return preset;
}

export async function applyCustomPresetAction(date: string, presetId: number) {
    const userId = await requireUserId();
    const d = isoDate.parse(date);
    const id = z.number().int().positive().parse(presetId);
    const items = await getCustomPresetItems(id);
    if (!items) throw new Error("Repas introuvable.");
    const [current, custom] = await Promise.all([getFoodPortions(userId, d), getCustomFoods()]);
    for (const item of items) {
        const next = (current[item.foodKey] ?? 0) + item.portions;
        const { protein, calories, fat } = macroOf(item.foodKey, custom);
        await setFoodPortion(userId, d, item.foodKey, next, protein, calories, fat);
    }
    await syncNutritionHabits(userId, d);
    revalidatePath("/");
    revalidatePath("/habitudes");
    revalidatePath("/suivi");
}

export async function deleteCustomPresetAction(presetId: number) {
    await requireUserId();
    const id = z.number().int().positive().parse(presetId);
    await deleteCustomPreset(id);
    revalidatePath("/");
}
