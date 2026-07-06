"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { setHabitAction } from "@/lib/actions";
import { HABIT_META } from "@/lib/habits-meta";
import type { HabitField } from "@/lib/data/habits";

interface HabitHistoryGridProps {
    days: string[];
    /** Dates (YYYY-MM-DD) où chaque habitude est cochée. */
    trueDates: Record<HabitField, string[]>;
}

export function HabitHistoryGrid({ days, trueDates }: HabitHistoryGridProps) {
    const [state, setState] = useState<Record<HabitField, Set<string>>>(() => ({
        creatine: new Set(trueDates.creatine),
        kcal3000: new Set(trueDates.kcal3000),
        protein140: new Set(trueDates.protein140),
        sleepBefore23: new Set(trueDates.sleepBefore23),
    }));
    const [, startTransition] = useTransition();

    function toggle(field: HabitField, date: string) {
        const has = state[field].has(date);
        const next = !has;
        setState((s) => {
            const set = new Set(s[field]);
            if (next) set.add(date);
            else set.delete(date);
            return { ...s, [field]: set };
        });
        startTransition(async () => {
            try {
                await setHabitAction(date, field, next);
            } catch {
                setState((s) => {
                    const set = new Set(s[field]);
                    if (next) set.delete(date);
                    else set.add(date);
                    return { ...s, [field]: set };
                });
                toast.error("Échec de la mise à jour.");
            }
        });
    }

    return (
        <div className="flex flex-col gap-2">
            {HABIT_META.map((h) => (
                <div key={h.field} className="flex items-center gap-2">
                    <span className="text-muted-foreground w-16 shrink-0 text-xs">{h.short}</span>
                    <div className="flex flex-1 gap-1">
                        {days.map((d) => (
                            <button
                                key={d}
                                type="button"
                                title={d}
                                onClick={() => toggle(h.field, d)}
                                className={cn(
                                    "h-5 flex-1 rounded-sm transition-colors",
                                    state[h.field].has(d) ? "bg-primary" : "bg-muted hover:bg-muted/60",
                                )}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
