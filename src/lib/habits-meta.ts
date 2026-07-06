import type { HabitField } from "@/lib/data/habits";

export const HABIT_META: { field: HabitField; label: string; short: string }[] = [
    { field: "creatine", label: "Créatine 5 g", short: "Créatine" },
    { field: "kcal3000", label: "3 000 kcal", short: "Calories" },
    { field: "protein140", label: "140 g protéines", short: "Protéines" },
    { field: "sleepBefore23", label: "Couché avant 23 h", short: "Sommeil" },
];
