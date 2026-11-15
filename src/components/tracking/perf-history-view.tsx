"use client";

import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { Target, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShort, fromISO } from "@/lib/date";
import type { ExerciseHistoryEntry } from "@/lib/data/workout";

interface ExerciseRef {
    key: string;
    name: string;
}

interface PerfHistoryViewProps {
    exercises: ExerciseRef[];
    /** Historique par exercice, séance la plus récente en premier. */
    histories: Record<string, ExerciseHistoryEntry[]>;
    tractionKeys: string[];
}

function isStrictSet(band: string | null): boolean {
    if (!band) return true;
    const b = band.toLowerCase();
    // « assist. 30 kg », « bande 20 »… = assisté ; sinon strict.
    return !b.includes("assist") && !b.includes("bande") && !b.includes("kg");
}

// Paliers du jalon : bande 30 → 20 → 10 → strict.
const ASSIST_STEPS = [30, 20, 10];

function totalReps(entry: ExerciseHistoryEntry): number {
    return entry.sets.reduce((a, s) => a + (s.reps ?? 0), 0);
}

export function PerfHistoryView({ exercises, histories, tractionKeys }: PerfHistoryViewProps) {
    const [selected, setSelected] = useState(exercises[0]?.key ?? "");

    if (exercises.length === 0) {
        return (
            <p className="text-muted-foreground py-8 text-center text-sm">
                Aucune performance notée pour l&apos;instant. Complète une séance !
            </p>
        );
    }

    // Jalon tractions : uniquement si le programme en contient.
    const tractionSets = tractionKeys
        .flatMap((k) => histories[k] ?? [])
        .flatMap((e) => e.sets.filter((s) => s.reps != null).map((s) => ({ ...s, date: e.date })));
    const hasTractions = exercises.some((e) => tractionKeys.includes(e.key));
    const strict = tractionSets.filter((s) => isStrictSet(s.band)).sort((a, b) => a.date.localeCompare(b.date))[0];
    const lightestBand = Math.min(
        ...tractionSets.filter((s) => !isStrictSet(s.band)).map((s) => Number(s.band?.match(/\d+/)?.[0] ?? Infinity)),
    );
    const level = strict
        ? ASSIST_STEPS.length + 1
        : Number.isFinite(lightestBand)
          ? ASSIST_STEPS.filter((b) => b >= lightestBand).length
          : 0;

    // Exercice choisi : 6 dernières séances, de la plus ancienne à la plus récente.
    const recent = (histories[selected] ?? []).slice(0, 6).reverse();
    const totals = recent.map(totalReps);
    const maxTotal = Math.max(1, ...totals);
    const bestSet = recent
        .flatMap((e) => e.sets.map((s) => ({ reps: s.reps ?? 0, date: e.date, setIndex: s.setIndex })))
        .sort((a, b) => b.reps - a.reps || b.date.localeCompare(a.date))[0];
    const gain = totals.length > 1 ? totals.at(-1)! - totals[0] : 0;
    const weeks =
        recent.length > 1
            ? Math.max(
                  1,
                  Math.round(differenceInCalendarDays(fromISO(recent.at(-1)!.date), fromISO(recent[0].date)) / 7),
              )
            : 0;
    const latest = [...recent].reverse().slice(0, 3);

    return (
        <div className="-mx-5 flex flex-col gap-4 pb-4">
            {hasTractions ? (
                <section className="bg-card mx-5 flex flex-col gap-2.5 rounded-[1.25rem] p-4">
                    <div className="flex items-center gap-3">
                        <span className="bg-border flex size-10 shrink-0 items-center justify-center rounded-xl">
                            {strict ? (
                                <Trophy className="text-streak size-5" />
                            ) : (
                                <Target className="text-streak size-5" />
                            )}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className="text-[0.9375rem] font-semibold">Jalon : 1 traction stricte</span>
                            <span className="text-muted-foreground text-[0.8125rem]">
                                {strict
                                    ? `Atteint le ${formatShort(strict.date)}`
                                    : Number.isFinite(lightestBand)
                                      ? `Assistance actuelle : bande ${lightestBand} kg`
                                      : "Pas encore de traction notée"}
                            </span>
                        </div>
                        <span className="font-heading text-lg font-bold tabular-nums">
                            {level}/{ASSIST_STEPS.length + 1}
                        </span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                        {Array.from({ length: ASSIST_STEPS.length + 1 }).map((_, i) => (
                            <span key={i} className={cn("h-1.5 rounded-full", i < level ? "bg-streak" : "bg-border")} />
                        ))}
                    </div>
                </section>
            ) : null}

            <div className="flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {exercises.map((ex) => (
                    <button
                        key={ex.key}
                        type="button"
                        onClick={() => setSelected(ex.key)}
                        aria-pressed={selected === ex.key}
                        className={cn(
                            "h-10 shrink-0 rounded-full px-3.5 text-[0.8125rem] font-semibold whitespace-nowrap",
                            selected === ex.key ? "bg-foreground text-background" : "border",
                        )}
                    >
                        {ex.name}
                    </button>
                ))}
            </div>

            {recent.length > 0 ? (
                <section className="bg-card mx-5 flex flex-col gap-3 rounded-[1.25rem] p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-muted-foreground text-xs font-bold tracking-[0.0625rem] uppercase">
                                Record
                            </span>
                            <span className="font-heading text-[1.875rem] leading-tight font-bold tabular-nums">
                                {bestSet?.reps ?? 0}
                                <span className="text-muted-foreground text-[0.9375rem]"> reps</span>
                            </span>
                            {bestSet ? (
                                <span className="text-muted-foreground text-[0.8125rem]">
                                    le {formatShort(bestSet.date)} · série {bestSet.setIndex + 1}
                                </span>
                            ) : null}
                        </div>
                        {gain > 0 ? (
                            <span className="bg-brand text-brand-foreground shrink-0 rounded-lg px-2.5 py-[0.3125rem] text-[0.8125rem] font-bold whitespace-nowrap">
                                +{gain} reps en {weeks} sem.
                            </span>
                        ) : null}
                    </div>
                    <div className="flex h-[5.75rem] items-end gap-2">
                        {totals.map((t, i) => (
                            <div key={recent[i].date} className="flex max-w-14 flex-1 flex-col items-center gap-1.5">
                                <span className="text-muted-foreground text-[0.6875rem] font-semibold tabular-nums">
                                    {t}
                                </span>
                                <div
                                    className={cn(
                                        "w-full rounded-lg",
                                        i === totals.length - 1 ? "bg-brand" : "bg-border",
                                    )}
                                    style={{ height: `${Math.max(4, Math.round((t / maxTotal) * 68))}px` }}
                                />
                            </div>
                        ))}
                    </div>
                    <span className="text-muted-foreground text-xs">Total de reps par séance</span>
                </section>
            ) : null}

            <div className="mx-5 flex flex-col gap-2">
                {latest.map((entry) => {
                    const i = recent.indexOf(entry);
                    const delta = i > 0 ? totals[i] - totals[i - 1] : null;
                    return (
                        <div key={entry.date} className="bg-card flex items-center gap-3 rounded-2xl px-3.5 py-3">
                            <span className="shrink-0 text-[0.8125rem] font-semibold whitespace-nowrap">
                                {formatShort(entry.date)}
                            </span>
                            <div className="flex min-w-0 flex-1 flex-wrap gap-1">
                                {[...entry.sets]
                                    .sort((a, b) => a.setIndex - b.setIndex)
                                    .map((s) => (
                                        <span
                                            key={s.setIndex}
                                            className="bg-border font-heading rounded-[0.4375rem] px-[7px] py-[3px] text-[0.8125rem] font-bold tabular-nums"
                                        >
                                            {s.reps ?? "—"}
                                        </span>
                                    ))}
                                {entry.variant ? (
                                    <span className="text-muted-foreground self-center text-xs">{entry.variant}</span>
                                ) : null}
                            </div>
                            {delta != null ? (
                                <span
                                    className={cn(
                                        "shrink-0 text-[0.8125rem]",
                                        delta > 0
                                            ? "bg-brand text-brand-foreground rounded-[0.4375rem] px-2 py-[3px] font-bold"
                                            : "text-muted-foreground font-semibold",
                                    )}
                                >
                                    {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                                </span>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
