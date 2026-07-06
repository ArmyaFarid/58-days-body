"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUserId, changePassword } from "@/lib/auth";
import { setStartDate } from "@/lib/data/settings";
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
