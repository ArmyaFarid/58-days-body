"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { setHabitAction } from "@/lib/actions";
import { HABIT_META } from "@/lib/habits-meta";
import type { HabitDay, HabitField } from "@/lib/data/habits";

interface HabitChecklistProps {
    date: string;
    initial: HabitDay;
}

// Ces habitudes sont pilotées automatiquement par le tracker nutrition
// (elles se cochent seules quand l'objectif du jour est atteint).
const AUTO_FIELDS: HabitField[] = ["protein140", "kcal3000"];

export function HabitChecklist({ date, initial }: HabitChecklistProps) {
    const [state, setState] = useState(initial);
    const [, startTransition] = useTransition();

    function toggle(field: HabitField) {
        const next = !state[field];
        setState((s) => ({ ...s, [field]: next }));
        startTransition(async () => {
            try {
                await setHabitAction(date, field, next);
            } catch {
                setState((s) => ({ ...s, [field]: !next }));
                toast.error("Échec de la mise à jour.");
            }
        });
    }

    return (
        <ul className="flex flex-col gap-2">
            {HABIT_META.map(({ field, label }) => {
                const done = state[field];
                const auto = AUTO_FIELDS.includes(field);
                const inner = (
                    <>
                        <span
                            className={cn(
                                "flex size-6 shrink-0 items-center justify-center rounded-md border",
                                done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                            )}
                        >
                            {done ? <Check className="size-4" /> : null}
                        </span>
                        <span className={cn("text-sm", done && "text-foreground")}>{label}</span>
                        {auto ? (
                            <span className="text-muted-foreground ml-auto text-xs">auto · nutrition</span>
                        ) : null}
                    </>
                );
                return (
                    <li key={field}>
                        {auto ? (
                            <div
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left",
                                    done ? "border-primary/50 bg-primary/10" : "border-border",
                                )}
                            >
                                {inner}
                            </div>
                        ) : (
                            <button
                                type="button"
                                onClick={() => toggle(field)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                                    done ? "border-primary/50 bg-primary/10" : "border-border",
                                )}
                            >
                                {inner}
                            </button>
                        )}
                    </li>
                );
            })}
        </ul>
    );
}
