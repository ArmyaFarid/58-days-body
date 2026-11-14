"use client";

import { Check, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { isExerciseDone, sumReps, type Logs } from "./focus-sequence";
import type { ExerciseBlock } from "./types";
import type { WeeklyStreak } from "@/lib/program/streak";
import type { SessionFeeling } from "@/lib/data/workout";

const FEELINGS: { key: SessionFeeling; label: string }[] = [
    { key: "facile", label: "Facile" },
    { key: "juste", label: "Juste bien" },
    { key: "dur", label: "Dur" },
];

interface FocusSummaryProps {
    title: string;
    subtitle: string;
    minutes: number;
    streak: WeeklyStreak | null;
    feeling: SessionFeeling | null;
    onFeeling: (feeling: SessionFeeling) => void;
    blocks: ExerciseBlock[];
    logs: Logs;
    completed: boolean;
    pending: boolean;
    onJump: (exIndex: number) => void;
    onComplete: () => void;
    onClose: () => void;
}

export function FocusSummary({
    title,
    subtitle,
    minutes,
    streak,
    feeling,
    onFeeling,
    blocks,
    logs,
    completed,
    pending,
    onJump,
    onComplete,
    onClose,
}: FocusSummaryProps) {
    const setsDone = blocks.reduce((acc, b) => acc + Object.keys(logs[b.key] ?? {}).length, 0);
    const totalReps = blocks.filter((b) => b.bandMode !== "time").reduce((acc, b) => acc + sumReps(logs[b.key]), 0);
    const open = blocks.map((b, i) => ({ b, i })).filter(({ b }) => !isExerciseDone(b, logs));

    // Progrès : uniquement sur les séries faites aujourd'hui ET la dernière fois.
    const progress = blocks
        .map((b) => {
            const today = logs[b.key] ?? {};
            const common = Object.keys(today)
                .map(Number)
                .filter((i) => b.last[i]?.reps != null && today[i]?.reps != null);
            if (common.length === 0) return null;
            const delta = sumReps(today, common) - sumReps(b.last, common);
            const unit = b.bandMode === "time" ? "s" : Math.abs(delta) === 1 ? "rep" : "reps";
            return { key: b.key, name: b.name, delta, unit };
        })
        .filter((p) => p !== null);

    return (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 pt-14 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
            <div className="flex flex-col items-center gap-2.5 text-center">
                <span className="bg-brand text-brand-foreground flex size-22 items-center justify-center rounded-full">
                    <Check className="size-11" strokeWidth={3} />
                </span>
                <h2 className="font-heading text-[2.125rem] leading-tight font-bold tracking-[-0.03125rem]">
                    {completed ? "Séance validée" : open.length > 0 ? "Presque fini" : "Séance terminée"}
                </h2>
                <p className="text-muted-foreground text-[0.9375rem]">
                    {title} · {subtitle.toLowerCase()}
                </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
                {[
                    { value: minutes > 0 ? minutes : "—", label: "minutes" },
                    { value: setsDone, label: setsDone > 1 ? "séries" : "série" },
                    { value: totalReps, label: "reps" },
                ].map((s) => (
                    <div
                        key={s.label}
                        className="bg-card flex flex-col items-center gap-0.5 rounded-[1.125rem] px-2.5 py-3.5"
                    >
                        <span className="font-heading text-2xl font-bold tabular-nums">{s.value}</span>
                        <span className="text-muted-foreground text-xs">{s.label}</span>
                    </div>
                ))}
            </div>

            {open.length > 0 ? (
                <div className="bg-card flex flex-col gap-3 rounded-[1.25rem] p-4">
                    <span className="text-[0.9375rem] font-semibold">
                        {open.length} {open.length > 1 ? "exercices restent" : "exercice reste"} à faire
                    </span>
                    {open.map(({ b, i }) => (
                        <div key={b.key} className="flex items-center justify-between gap-3">
                            <span className="min-w-0 text-sm wrap-break-word">{b.name}</span>
                            <button
                                type="button"
                                onClick={() => onJump(i)}
                                className="bg-brand text-brand-foreground h-9 shrink-0 rounded-[0.625rem] px-3 text-[0.8125rem] font-bold"
                            >
                                Faire
                            </button>
                        </div>
                    ))}
                </div>
            ) : null}

            {progress.length > 0 ? (
                <div className="bg-card flex flex-col gap-3 rounded-[1.25rem] p-4">
                    <span className="text-[0.9375rem] font-semibold">Progrès vs la dernière fois</span>
                    {progress.map((p) => (
                        <div key={p.key} className="flex items-center justify-between gap-3">
                            <span className="min-w-0 text-sm wrap-break-word">{p.name}</span>
                            <span
                                className={cn(
                                    "shrink-0 text-[0.8125rem] whitespace-nowrap",
                                    p.delta > 0
                                        ? "bg-brand text-brand-foreground rounded-[0.4375rem] px-2 py-1 font-bold"
                                        : "text-muted-foreground font-semibold",
                                )}
                            >
                                {p.delta > 0
                                    ? `+${p.delta} ${p.unit}`
                                    : p.delta === 0
                                      ? "= stable"
                                      : `${p.delta} ${p.unit}`}
                            </span>
                        </div>
                    ))}
                </div>
            ) : null}

            {streak && completed && streak.plannedThisWeek > 0 ? (
                <div className="bg-card border-streak/25 flex items-center gap-3.5 rounded-[1.25rem] border p-4">
                    <Flame className="text-streak size-9 shrink-0" strokeWidth={2} />
                    <div className="flex flex-col gap-0.5">
                        <span className="font-heading text-lg font-bold">
                            {streak.doneThisWeek} / {streak.plannedThisWeek} cette semaine
                        </span>
                        <span className="text-muted-foreground text-[0.8125rem]">
                            {streak.doneThisWeek >= streak.plannedThisWeek
                                ? `${streak.weeks} ${streak.weeks > 1 ? "semaines" : "semaine"} de suite`
                                : `Encore ${streak.plannedThisWeek - streak.doneThisWeek} ${
                                      streak.plannedThisWeek - streak.doneThisWeek > 1 ? "séances" : "séance"
                                  } pour boucler la semaine`}
                        </span>
                    </div>
                </div>
            ) : null}

            <div className="flex flex-col gap-2">
                <span className="text-muted-foreground text-[0.8125rem]">Ressenti</span>
                <div className="grid grid-cols-3 gap-2">
                    {FEELINGS.map((f) => (
                        <button
                            key={f.key}
                            type="button"
                            onClick={() => onFeeling(f.key)}
                            aria-pressed={feeling === f.key}
                            className={cn(
                                "h-12 rounded-[0.875rem] text-sm font-semibold transition-colors",
                                feeling === f.key ? "bg-foreground text-background" : "border",
                            )}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-auto flex flex-col gap-2 pt-2">
                {completed ? (
                    <button
                        type="button"
                        onClick={onClose}
                        className="bg-brand text-brand-foreground flex h-[3.75rem] items-center justify-center rounded-[1.125rem] text-[1.0625rem] font-bold"
                    >
                        Terminer
                    </button>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={onComplete}
                            disabled={pending}
                            className="bg-brand text-brand-foreground flex h-[3.75rem] items-center justify-center gap-2 rounded-[1.125rem] text-[1.0625rem] font-bold disabled:opacity-60"
                        >
                            {pending ? <Loader2 className="size-5 animate-spin" /> : null}
                            {open.length > 0 ? "Valider quand même" : "Valider la séance"}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="text-muted-foreground h-11 text-sm font-semibold"
                        >
                            Revenir à la liste
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
