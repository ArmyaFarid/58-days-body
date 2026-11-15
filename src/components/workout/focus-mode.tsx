"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { completeSessionAction, deleteSetLogAction, saveSetLogAction, setSessionFeelingAction } from "@/lib/actions";
import { saveSetOrQueue, unqueueSet } from "@/lib/offline-sets";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { FocusExercise } from "./focus-exercise";
import { FocusRest, primeAudio } from "./focus-rest";
import { FocusSummary } from "./focus-summary";
import { firstOpenSet, initialLogs, isExerciseDone, nextTarget, type Logs, type Target } from "./focus-sequence";
import type { ExerciseBlock, LoggedSet } from "./types";
import type { WeeklyStreak } from "@/lib/program/streak";
import type { SessionFeeling } from "@/lib/data/workout";

interface FocusModeProps {
    sessionId: number;
    title: string;
    blocks: ExerciseBlock[];
    isCircuit: boolean;
    showIntensification: boolean;
    restSeconds: number;
    dayLabel: string;
    streak: WeeklyStreak | null;
    feeling: SessionFeeling | null;
    /** Exercice à ouvrir ; sinon la prochaine série à faire. */
    startAt: number | null;
    completed: boolean;
    onCompleted: () => void;
    onClose: () => void;
}

type Phase = "set" | "rest" | "summary";

export function FocusMode({
    sessionId,
    title,
    blocks,
    isCircuit,
    showIntensification,
    restSeconds,
    dayLabel,
    streak,
    feeling: initialFeeling,
    startAt,
    completed,
    onCompleted,
    onClose,
}: FocusModeProps) {
    const [logs, setLogs] = useState<Logs>(() => initialLogs(blocks));
    const [skipped, setSkipped] = useState<Set<string>>(() => new Set());
    const [variants, setVariants] = useState<Record<string, string | null>>(() =>
        Object.fromEntries(blocks.map((b) => [b.key, b.variant ?? b.lastVariant])),
    );
    const start =
        startAt != null
            ? { ex: startAt, set: Math.max(0, firstOpenSet(blocks[startAt], initialLogs(blocks))) }
            : nextTarget(blocks, initialLogs(blocks), new Set(), 0, isCircuit);
    const [target, setTarget] = useState<Target>(start ?? { ex: 0, set: 0 });
    const [phase, setPhase] = useState<Phase>(start ? "set" : "summary");
    const [restEndAt, setRestEndAt] = useState(0);
    const [restTotal, setRestTotal] = useState(restSeconds);
    const [justDone, setJustDone] = useState({ label: "", badge: "" });
    const [isCompleted, setIsCompleted] = useState(completed);
    const [startedAt] = useState(() => Date.now());
    const [minutes, setMinutes] = useState(0);
    const [feeling, setFeeling] = useState<SessionFeeling | null>(initialFeeling);
    // Records à battre, mis à jour dès qu'une série les dépasse.
    const [bests, setBests] = useState<Record<string, number | null>>(() =>
        Object.fromEntries(blocks.map((b) => [b.key, b.best])),
    );
    const [saving, startSaving] = useTransition();
    const [completing, startCompleting] = useTransition();
    // Dernière série notée, pour « Annuler » juste après.
    const [lastSaved, setLastSaved] = useState<{
        target: Target;
        key: string;
        set: number;
        previous: LoggedSet | undefined;
        prevLogs: Logs;
        prevBest: number | null;
    } | null>(null);

    // Séance ouverte : l'écran ne se met pas en veille entre deux séries.
    useWakeLock(true);

    const unitLabel = isCircuit ? "Tour" : "Série";
    const block = blocks[target.ex];

    const goTo = useCallback((ex: number, set: number) => {
        setTarget({ ex, set });
        setPhase("set");
    }, []);

    function startRest(seconds: number) {
        setRestTotal(seconds);
        setRestEndAt(Date.now() + seconds * 1000);
        setPhase("rest");
    }

    function complete() {
        startCompleting(async () => {
            try {
                await completeSessionAction(sessionId, true);
                setIsCompleted(true);
                onCompleted();
            } catch {
                toast.error("Échec de la validation de la séance.");
            }
        });
    }

    function chooseFeeling(next: SessionFeeling) {
        const previous = feeling;
        const value = next === feeling ? null : next;
        setFeeling(value);
        setSessionFeelingAction({ sessionId, feeling: value }).catch(() => {
            setFeeling(previous);
            toast.error("Échec de l'enregistrement du ressenti.");
        });
    }

    function validate(reps: number | null, band: string | null) {
        // Geste de l'utilisateur : débloque le son de fin de repos (iOS).
        primeAudio();
        const current = target;
        const b = blocks[current.ex];
        startSaving(async () => {
            const input = {
                sessionId,
                exerciseKey: b.key,
                setIndex: current.set,
                reps,
                band,
                variant: variants[b.key] ?? null,
                notes: null,
            };
            try {
                // Pas de réseau (salle en sous-sol…) : la série est gardée et partira au retour du réseau.
                await saveSetOrQueue(input);
            } catch {
                toast.error("Échec de l'enregistrement.");
                return;
            }
            const best = bests[b.key];
            const record = reps != null && best != null && reps > best;
            if (reps != null && (best == null || reps > best)) setBests((m) => ({ ...m, [b.key]: reps }));
            if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(record ? [60, 40, 60, 40, 120] : 30);
            const saved = { target: current, key: b.key, set: current.set, previous: logs[b.key]?.[current.set], prevLogs: logs, prevBest: best };
            setLastSaved(saved);
            const nextLogs: Logs = {
                ...logs,
                [b.key]: { ...logs[b.key], [current.set]: { reps, band } },
            };
            setLogs(nextLogs);
            const last = b.last[current.set]?.reps;
            const gain = reps != null && last != null ? reps - last : null;
            setJustDone({
                label: `${unitLabel} ${current.set + 1} validé${isCircuit ? "" : "e"}`,
                badge: record
                    ? `Record ! ${reps}${b.bandMode === "time" ? " s" : " reps"}`
                    : `${reps ?? 0}${b.bandMode === "time" ? " s" : " reps"}${gain != null && gain > 0 ? ` · +${gain}` : ""}`,
            });

            const next = nextTarget(blocks, nextLogs, skipped, current.ex, isCircuit);
            if (!next) {
                showSummary();
                // Tout est fait : la séance est validée d'office (comme sur la maquette).
                if (!isCompleted && blocks.every((x) => isExerciseDone(x, nextLogs))) complete();
                return;
            }
            setTarget(next);
            // Circuit : on enchaîne les exercices, repos seulement en fin de tour.
            if (isCircuit && next.set === current.set) {
                setPhase("set");
                toast(`${b.name} : ${reps ?? 0} notées`, { action: { label: "Annuler", onClick: () => undoWith(saved) } });
            } else startRest(restSeconds);
        });
    }

    function undoWith(u: NonNullable<typeof lastSaved>) {
        setLastSaved(null);
        setLogs(u.prevLogs);
        // Le record à battre redevient celui d'avant la série annulée.
        setBests((m) => ({ ...m, [u.key]: u.prevBest }));
        setTarget(u.target);
        setPhase("set");
        const ref = { sessionId, exerciseKey: u.key, setIndex: u.set };
        if (unqueueSet(ref)) return;
        const revert = u.previous
            ? saveSetLogAction({ ...ref, reps: u.previous.reps, band: u.previous.band, variant: variants[u.key] ?? null, notes: null })
            : deleteSetLogAction(ref);
        revert.catch(() => toast.error("Annulation impossible."));
    }

    function skip() {
        const nextSkipped = new Set(skipped).add(block.key);
        setSkipped(nextSkipped);
        const next = nextTarget(blocks, logs, nextSkipped, (target.ex + 1) % blocks.length, isCircuit);
        if (next) goTo(next.ex, next.set);
        else showSummary();
    }

    function jump(ex: number) {
        setSkipped((s) => {
            const n = new Set(s);
            n.delete(blocks[ex].key);
            return n;
        });
        const open = firstOpenSet(blocks[ex], logs);
        goTo(ex, open === -1 ? 0 : open);
    }

    const endRest = useCallback(() => setPhase("set"), []);

    function showSummary() {
        setMinutes(Math.max(1, Math.round((Date.now() - startedAt) / 60000)));
        setPhase("summary");
    }

    const doneCount = blocks.filter((b) => isExerciseDone(b, logs)).length;

    return (
        <div className="bg-background fixed inset-0 z-50 pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex h-full max-w-xl flex-col">
                {phase === "set" ? (
                    <div className="flex items-center gap-3 px-5 pt-4 pb-[1.125rem]">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Revenir à la liste des exercices"
                            className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                        >
                            <X className="size-5" strokeWidth={2.4} />
                        </button>
                        <div className="flex min-w-0 flex-1 gap-1">
                            {blocks.map((b, i) => (
                                <button
                                    key={b.key}
                                    type="button"
                                    onClick={() => jump(i)}
                                    aria-label={`Aller à ${b.name}`}
                                    className="flex h-6 min-w-0 flex-1 items-center"
                                >
                                    <span
                                        className={cn(
                                            "h-1.5 w-full rounded-full",
                                            isExerciseDone(b, logs)
                                                ? "bg-brand"
                                                : i === target.ex
                                                  ? "bg-brand/50"
                                                  : skipped.has(b.key)
                                                    ? "bg-streak/60"
                                                    : "bg-border",
                                        )}
                                    />
                                </button>
                            ))}
                        </div>
                        <span className="text-muted-foreground shrink-0 text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums">
                            {doneCount} / {blocks.length}
                        </span>
                        <button
                            type="button"
                            onClick={skip}
                            className="bg-card flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-semibold"
                        >
                            Passer
                            <SkipForward className="size-4" strokeWidth={2.4} />
                        </button>
                    </div>
                ) : null}

                {phase === "set" ? (
                    <FocusExercise
                        key={`${block.key}-${target.set}`}
                        sessionId={sessionId}
                        block={block}
                        setIndex={target.set}
                        unitLabel={unitLabel}
                        logged={logs[block.key] ?? {}}
                        variant={variants[block.key] ?? null}
                        showIntensification={showIntensification}
                        pending={saving}
                        best={bests[block.key] ?? null}
                        onVariantChange={(v) => setVariants((m) => ({ ...m, [block.key]: v }))}
                        onSelectSet={(i) => goTo(target.ex, i)}
                        onValidate={validate}
                    />
                ) : phase === "rest" ? (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <FocusRest
                            endAt={restEndAt}
                            total={restTotal}
                            justDoneLabel={justDone.label}
                            justDoneBadge={justDone.badge}
                            nextIndex={target.ex + 1}
                            nextName={`${block.name} · ${unitLabel.toLowerCase()} ${target.set + 1} sur ${block.setCount}`}
                            nextHint={
                                block.last[target.set]?.reps != null
                                    ? `Vise ${(block.last[target.set]?.reps ?? 0) + (block.bandMode === "time" ? 5 : 1)}+`
                                    : null
                            }
                            onAdjust={(s) => {
                                setRestEndAt((e) => Math.max(Date.now(), e + s * 1000));
                                setRestTotal((t) => Math.max(15, t + s));
                            }}
                            onDone={endRest}
                            onUndo={lastSaved ? () => undoWith(lastSaved) : undefined}
                        />
                    </div>
                ) : (
                    <div className="flex min-h-0 flex-1 flex-col">
                        <FocusSummary
                            title={title}
                            subtitle={dayLabel}
                            minutes={minutes}
                            streak={streak}
                            feeling={feeling}
                            onFeeling={chooseFeeling}
                            blocks={blocks}
                            logs={logs}
                            completed={isCompleted}
                            pending={completing}
                            onJump={jump}
                            onComplete={complete}
                            onClose={onClose}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
