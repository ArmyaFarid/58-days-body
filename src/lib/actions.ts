"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { setStartDate } from "@/lib/data/settings";
import { upsertWeight } from "@/lib/data/weight";
import { setHabit, type HabitField } from "@/lib/data/habits";
import { saveSetLog, setSessionCompleted } from "@/lib/data/workout";
import { addPhoto, deletePhoto } from "@/lib/data/photos";
import { POSES } from "@/lib/photos-meta";

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

const poseKeys = POSES.map((p) => p.key) as [string, ...string[]];

const addPhotoSchema = z.object({
    date: isoDate,
    pose: z.enum(poseKeys),
    blobUrl: z.string().url().startsWith("https://"),
});

export async function addPhotoAction(input: z.infer<typeof addPhotoSchema>) {
    await requireAuth();
    const parsed = addPhotoSchema.parse(input);
    await addPhoto(parsed.date, parsed.pose, parsed.blobUrl);
    revalidatePath("/suivi");
}

export async function deletePhotoAction(id: number) {
    await requireAuth();
    const parsed = z.number().int().positive().parse(id);
    await deletePhoto(parsed);
    revalidatePath("/suivi");
}
