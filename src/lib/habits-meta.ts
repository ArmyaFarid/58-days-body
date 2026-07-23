import type { HabitField } from "@/lib/data/habits";
import type { Program } from "@/lib/program";

export interface HabitMeta {
    field: HabitField;
    label: string;
    short: string;
    /** Cochée automatiquement par le tracker nutrition. */
    auto: boolean;
}

// Ces habitudes se cochent seules quand l'objectif nutrition du jour est atteint.
const AUTO_FIELDS: HabitField[] = ["protein140", "kcal3000"];

const DEFAULT_LABELS: Record<HabitField, { label: string; short: string }> = {
    creatine: { label: "Créatine 5 g", short: "Créatine" },
    kcal3000: { label: "Calories atteintes", short: "Calories" },
    protein140: { label: "Protéines atteintes", short: "Protéines" },
    sleepBefore23: { label: "Sommeil", short: "Sommeil" },
};

/** Habitudes (colonnes) à afficher pour un programme, dans l'ordre. */
export function habitMetaFor(program: Program): HabitMeta[] {
    return program.habitFields.map((field) => {
        const base = program.habitLabels?.[field] ?? DEFAULT_LABELS[field];
        return { field, label: base.label, short: base.short, auto: AUTO_FIELDS.includes(field) };
    });
}
