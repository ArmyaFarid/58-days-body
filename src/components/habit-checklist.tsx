"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import { setHabitAction } from "@/lib/actions";
import type { HabitMeta } from "@/lib/habits-meta";
import type { HabitDay, HabitField } from "@/lib/data/habits";

interface HabitChecklistProps {
    date: string;
    initial: HabitDay;
    meta: HabitMeta[];
    /** Affiche une ligne « Séance faite » (dérivée de la complétion du jour). */
    showSession?: boolean;
    sessionDone?: boolean;
    /** Puces compactes (accueil) au lieu de lignes. */
    compact?: boolean;
    /** Lien vers le détail (séries, 14 jours), affiché sur le compteur. */
    href?: string;
}

function Chip({ done, label, onClick }: { done: boolean; label: string; onClick?: () => void }) {
    const className = cn(
        "flex h-10 items-center gap-1 rounded-full px-3.5 text-[0.8125rem] font-semibold transition-colors",
        done ? "bg-brand text-brand-foreground" : "text-foreground border",
    );
    const content = (
        <>
            {done ? <Check className="size-3.5" strokeWidth={3} /> : null}
            {label}
        </>
    );
    return onClick ? (
        <button type="button" onClick={onClick} aria-pressed={done} className={className}>
            {content}
        </button>
    ) : (
        <span className={className}>{content}</span>
    );
}

function AutoRow({ done, label, hint }: { done: boolean; label: string; hint: string }) {
    return (
        <div
            className={cn(
                "flex w-full items-center gap-3 rounded-lg border p-3 text-left",
                done ? "border-primary/50 bg-primary/10" : "border-border",
            )}
        >
            <span
                className={cn(
                    "flex size-6 shrink-0 items-center justify-center rounded-md border",
                    done ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/40",
                )}
            >
                {done ? <Check className="size-4" /> : null}
            </span>
            <span className={cn("text-sm", done && "text-foreground")}>{label}</span>
            <span className="text-muted-foreground ml-auto text-xs">{hint}</span>
        </div>
    );
}

export function HabitChecklist({
    date,
    initial,
    meta,
    showSession = false,
    sessionDone = false,
    compact = false,
    href,
}: HabitChecklistProps) {
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

    if (compact) {
        const total = meta.length + (showSession ? 1 : 0);
        const doneCount = meta.filter(({ field }) => state[field]).length + (showSession && sessionDone ? 1 : 0);
        return (
            <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                    <span className="text-[0.9375rem] font-semibold">Habitudes</span>
                    {href ? (
                        <Link
                            href={href}
                            className="text-muted-foreground flex items-center gap-0.5 text-[0.8125rem] font-semibold tabular-nums"
                        >
                            {doneCount} / {total}
                            <ChevronRight className="size-4" strokeWidth={2.4} />
                        </Link>
                    ) : (
                        <span className="text-muted-foreground text-[0.8125rem] tabular-nums">
                            {doneCount} / {total}
                        </span>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                    {meta.map(({ field, label, auto }) => (
                        <Chip
                            key={field}
                            done={state[field]}
                            label={label}
                            onClick={auto ? undefined : () => toggle(field)}
                        />
                    ))}
                    {showSession ? <Chip done={sessionDone} label="Séance faite" /> : null}
                </div>
            </div>
        );
    }

    return (
        <ul className="flex flex-col gap-2">
            {meta.map(({ field, label, auto }) => {
                const done = state[field];
                return (
                    <li key={field}>
                        {auto ? (
                            <AutoRow done={done} label={label} hint="auto · nutrition" />
                        ) : (
                            <button
                                type="button"
                                onClick={() => toggle(field)}
                                className={cn(
                                    "flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                                    done ? "border-primary/50 bg-primary/10" : "border-border",
                                )}
                            >
                                <span
                                    className={cn(
                                        "flex size-6 shrink-0 items-center justify-center rounded-md border",
                                        done
                                            ? "border-primary bg-primary text-primary-foreground"
                                            : "border-muted-foreground/40",
                                    )}
                                >
                                    {done ? <Check className="size-4" /> : null}
                                </span>
                                <span className={cn("text-sm", done && "text-foreground")}>{label}</span>
                            </button>
                        )}
                    </li>
                );
            })}
            {showSession ? (
                <li>
                    <AutoRow done={sessionDone} label="Séance faite" hint="auto · séance" />
                </li>
            ) : null}
        </ul>
    );
}
