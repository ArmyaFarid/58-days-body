"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { setStartDate } from "@/lib/data/settings";
import { upsertWeight } from "@/lib/data/weight";
import { setHabit, type HabitField } from "@/lib/data/habits";

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
