"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowRight, CalendarDays, Eye, Gauge, Loader2, Repeat, SkipForward } from "lucide-react";
import { completeSessionAction } from "@/lib/actions";
import { ExerciseRow } from "./exercise-row";
import { FocusMode } from "./focus-mode";
import { initialLogs, isExerciseDone, nextTarget } from "./focus-sequence";
import { InternatBar } from "./internat-bar";
import type { ExerciseBlock, InternatInfo } from "./types";
import type { WeeklyStreak } from "@/lib/program/streak";
import type { SessionFeeling } from "@/lib/data/workout";

interface WorkoutViewProps {
    today: string;
    selectedDate: string;
    /** null : aperçu d'un jour à venir, rien n'est enregistrable. */
    sessionId: number | null;
    completed: boolean;
    title: string;
    /** « Jour 14 · Bloc 1 ». */
    dayLabel: string;
    showIntensification: boolean;
    isCircuit: boolean;
    circuitNote?: string;
    finisher?: string;
    styleNote?: string;
    exercises: ExerciseBlock[];
    internat: InternatInfo;
    streak: WeeklyStreak | null;
    feeling: SessionFeeling | null;
}

export function WorkoutView({
    today,
    selectedDate,
    sessionId,
    completed,
    title,
    dayLabel,
    showIntensification,
    isCircuit,
    circuitNote,
    finisher,
    styleNote,
    exercises,
    internat,
    streak,
    feeling,
}: WorkoutViewProps) {
    const router = useRouter();
    const [done, setDone] = useState(completed);
    const [pending, startTransition] = useTransition();
    // null : fermé ; { at: null } : prochaine série ; { at: i } : exercice i.
    const [focusMode, setFocusMode] = useState<{ at: number | null } | null>(null);

    function toggleComplete() {
        if (sessionId === null) return;
        const next = !done;
        setDone(next);
        startTransition(async () => {
            try {
                await completeSessionAction(sessionId, next);
                toast.success(next ? "Séance complétée 💪" : "Séance rouverte.");
            } catch {
                setDone(!next);
                toast.error("Échec de la mise à jour.");
            }
        });
    }

    function pickDate(value: string) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
        router.push(value === today ? "/seance" : `/seance?date=${value}`);
    }

    const unitLabel = isCircuit ? "Tour" : "Série";
    const logs = initialLogs(exercises);
    const doneCount = exercises.filter((b) => isExerciseDone(b, logs)).length;
    const started = exercises.some((b) => Object.keys(b.logged).length > 0);
    const next = nextTarget(exercises, logs, new Set(), 0, isCircuit);
    const ctaLabel = !next
        ? "Voir le bilan"
        : started
          ? `Continuer · ${exercises[next.ex].name}`
          : "Démarrer la séance";
    const restSeconds = Number(circuitNote?.match(/(\d+)\s*s de repos/)?.[1] ?? 90);

    if (focusMode && sessionId !== null) {
        return (
            <FocusMode
                sessionId={sessionId}
                title={title}
                blocks={exercises}
                isCircuit={isCircuit}
                showIntensification={showIntensification}
                restSeconds={restSeconds}
                dayLabel={dayLabel}
                streak={streak}
                feeling={feeling}
                startAt={focusMode.at}
                completed={done}
                onCompleted={() => setDone(true)}
                onClose={() => setFocusMode(null)}
            />
        );
    }

    return (
        <div className="flex flex-col gap-4 px-5 pt-4">
            <section className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-[0.0625rem] uppercase">
                        {dayLabel}
                        {/* Le champ date transparent couvre l'icône : ouvre le calendrier natif. */}
                        <label className="relative flex size-5 items-center justify-center">
                            <CalendarDays className="size-3.5" />
                            <span className="sr-only">Choisir un jour</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => pickDate(e.target.value)}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />
                        </label>
                    </span>
                    {selectedDate !== today ? (
                        <Link href="/seance" className="text-primary text-xs font-semibold">
                            Aujourd&apos;hui
                        </Link>
                    ) : null}
                </div>
                <div className="flex items-end justify-between gap-3">
                    <h1 className="font-heading min-w-0 text-[2.125rem] leading-none font-bold tracking-[-0.03125rem] wrap-break-word">
                        {title}
                    </h1>
                    <InternatBar sessionId={sessionId} internat={internat} />
                </div>
                {sessionId !== null ? (
                    <div className="mt-1.5 flex items-center gap-2.5">
                        <div className="bg-border h-2 flex-1 overflow-hidden rounded-full">
                            <div
                                className="bg-brand h-full rounded-full transition-[width]"
                                style={{ width: `${(doneCount / Math.max(1, exercises.length)) * 100}%` }}
                            />
                        </div>
                        <span className="text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums">
                            {doneCount} / {exercises.length}
                        </span>
                    </div>
                ) : null}
            </section>

            {isCircuit && circuitNote ? (
                <p className="text-muted-foreground flex items-start gap-1.5 text-[0.8125rem]">
                    <Repeat className="mt-0.5 size-3.5 shrink-0" />
                    {circuitNote}
                </p>
            ) : null}
            {styleNote ? (
                <p className="text-muted-foreground flex items-start gap-1.5 text-[0.8125rem]">
                    <Gauge className="mt-0.5 size-3.5 shrink-0" />
                    {styleNote}
                </p>
            ) : null}
            {sessionId === null ? (
                <p className="bg-primary/10 text-primary flex items-start gap-1.5 rounded-2xl p-3 text-sm">
                    <Eye className="mt-0.5 size-4 shrink-0" />
                    Aperçu : tu pourras noter tes séries le jour venu.
                </p>
            ) : null}

            <div className="flex flex-col gap-2.5">
                {exercises.map((block, i) => (
                    <ExerciseRow
                        key={block.key}
                        index={i}
                        sessionId={sessionId}
                        block={block}
                        current={sessionId !== null && next?.ex === i}
                        showIntensification={showIntensification}
                        unitLabel={unitLabel}
                        onOpen={() => setFocusMode({ at: i })}
                    />
                ))}
            </div>

            {finisher ? (
                <p className="text-muted-foreground flex items-start gap-1.5 text-[0.8125rem]">
                    <SkipForward className="mt-0.5 size-3.5 shrink-0" />
                    {finisher}
                </p>
            ) : null}

            {sessionId !== null ? (
                <>
                    <button
                        type="button"
                        onClick={toggleComplete}
                        disabled={pending}
                        className="text-muted-foreground flex h-11 items-center justify-center gap-2 text-sm font-semibold disabled:opacity-60"
                    >
                        {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                        {done ? "Séance validée — rouvrir" : "Marquer la séance comme faite"}
                    </button>

                    {/* Espace pour que la dernière ligne ne passe pas sous le bouton fixe. */}
                    <div className="h-20" />

                    {!done || next ? (
                        <div className="from-background pointer-events-none fixed inset-x-0 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.25rem)] z-30 mx-auto max-w-xl bg-linear-to-t from-70% to-transparent px-5 pt-6 pb-3">
                            <button
                                type="button"
                                onClick={() => setFocusMode({ at: null })}
                                className="bg-brand text-brand-foreground pointer-events-auto flex h-[3.75rem] w-full items-center justify-center gap-2.5 rounded-[1.125rem] px-4 text-[1.0625rem] font-bold active:scale-[0.98]"
                            >
                                <span className="min-w-0 truncate">{ctaLabel}</span>
                                <ArrowRight className="size-5 shrink-0" strokeWidth={2.6} />
                            </button>
                        </div>
                    ) : null}
                </>
            ) : null}
        </div>
    );
}
