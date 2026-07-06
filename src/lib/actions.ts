"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { getSession, verifyCredentials } from "@/lib/auth";
import { setStartDate } from "@/lib/data/settings";
import { upsertWeight } from "@/lib/data/weight";
import { setHabit, type HabitField } from "@/lib/data/habits";
import { saveSetLog, setSessionCompleted } from "@/lib/data/workout";
import { deletePhoto } from "@/lib/data/photos";
import { upsertMeasurement } from "@/lib/data/measurements";
import { setStoredPasswordHashB64 } from "@/lib/data/credentials";
import { resetAllData } from "@/lib/data/reset";

async function requireAuth() {
    const session = await getSession();
    if (!session) throw new Error("Non authentifié.");
}

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.");

export async function setStartDateAction(date: string) {
    await requireAuth();
    const parsed = isoDate.parse(date);
    await setStartDate(parsed);
    revalidatePath("/");
    revalidatePath("/onboarding");
}

const weightSchema = z.object({
    date: isoDate,
    weightKg: z.number().positive().max(400),
});

export async function upsertWeightAction(date: string, weightKg: number) {
    await requireAuth();
    const parsed = weightSchema.parse({ date, weightKg });
    await upsertWeight(parsed.date, parsed.weightKg);
    revalidatePath("/");
    revalidatePath("/suivi");
}

const habitFields = ["creatine", "kcal3000", "protein140", "sleepBefore23"] as const;

export async function setHabitAction(date: string, field: HabitField, value: boolean) {
    await requireAuth();
    const parsedDate = isoDate.parse(date);
    const parsedField = z.enum(habitFields).parse(field);
    await setHabit(parsedDate, parsedField, value);
    revalidatePath("/");
    revalidatePath("/suivi");
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
    await requireAuth();
    const parsed = setLogSchema.parse(input);
    await saveSetLog(parsed);
    revalidatePath("/seance");
}

export async function completeSessionAction(sessionId: number, completed: boolean) {
    await requireAuth();
    const id = z.number().int().positive().parse(sessionId);
    await setSessionCompleted(id, Boolean(completed));
    revalidatePath("/seance");
    revalidatePath("/");
}

export async function deletePhotoAction(id: number) {
    await requireAuth();
    const parsed = z.number().int().positive().parse(id);
    await deletePhoto(parsed);
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
    await requireAuth();
    const { date, ...values } = measurementSchema.parse(input);
    await upsertMeasurement(date, values);
    revalidatePath("/suivi");
}

export async function changePasswordAction(current: string, next: string) {
    await requireAuth();
    const username = process.env.AUTH_USERNAME ?? "";
    const ok = await verifyCredentials(username, current);
    if (!ok) throw new Error("Mot de passe actuel incorrect.");
    const newPassword = z
        .string()
        .min(4, "Minimum 4 caractères.")
        .max(200)
        .parse(next);
    const hash = bcrypt.hashSync(newPassword, 10);
    const b64 = Buffer.from(hash, "utf8").toString("base64");
    await setStoredPasswordHashB64(b64);
}

export async function resetAllAction() {
    await requireAuth();
    await resetAllData();
    revalidatePath("/");
    revalidatePath("/suivi");
    revalidatePath("/habitudes");
    revalidatePath("/seance");
}
