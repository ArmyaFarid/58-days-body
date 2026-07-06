"use client";

import { useCallback, useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Repeat, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeSessionAction } from "@/lib/actions";
import { ExerciseCard } from "./exercise-card";
import { RestTimer, type RestState } from "./rest-timer";
import type { ExerciseBlock } from "./types";

interface WorkoutViewProps {
    sessionId: number;
    completed: boolean;
    title: string;
    focus: string;
    phaseLabel: string | null;
    showIntensification: boolean;
    isCircuit: boolean;
    circuitNote?: string;
    finisher?: string;
    exercises: ExerciseBlock[];
}

export function WorkoutView({
    sessionId,
    completed,
    title,
    focus,
    phaseLabel,
    showIntensification,
    isCircuit,
    circuitNote,
    finisher,
    exercises,
}: WorkoutViewProps) {
    const [rest, setRest] = useState<RestState | null>(null);
    const [done, setDone] = useState(completed);
    const [pending, startTransition] = useTransition();

    const startRest = useCallback((seconds: number) => {
        setRest({ remaining: seconds, total: seconds });
    }, []);

    const onTick = useCallback(() => {
        setRest((r) => {
            if (!r) return null;
            if (r.remaining <= 1) {
                if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(200);
                toast("Repos terminé — série suivante.");
                return null;
            }
            return { ...r, remaining: r.remaining - 1 };
        });
    }, []);

    const onSetSaved = useCallback(() => {
        startRest(90);
    }, [startRest]);

    function toggleComplete() {
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

    const unitLabel = isCircuit ? "Tour" : "Série";

    return (
        <div className="flex flex-col gap-4 p-4">
            <section className="pt-2">
                <div className="flex items-center justify-between gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
                    {phaseLabel ? <Badge variant="secondary">{phaseLabel}</Badge> : null}
                </div>
                <p className="text-muted-foreground text-sm">{focus}</p>
                {isCircuit && circuitNote ? (
                    <p className="bg-muted mt-2 flex items-start gap-1.5 rounded-md p-2 text-sm">
                        <Repeat className="mt-0.5 size-3.5 shrink-0" />
                        {circuitNote}
                    </p>
                ) : null}
            </section>

            <div className="flex flex-col gap-3">
                {exercises.map((block) => (
                    <ExerciseCard
                        key={block.key}
                        sessionId={sessionId}
                        block={block}
                        showIntensification={showIntensification}
                        unitLabel={unitLabel}
                        onSetSaved={onSetSaved}
                    />
                ))}
            </div>

            {finisher ? (
                <p className="bg-muted flex items-start gap-1.5 rounded-lg p-3 text-sm">
                    <SkipForward className="mt-0.5 size-4 shrink-0" />
                    {finisher}
                </p>
            ) : null}

            <Button
                onClick={toggleComplete}
                disabled={pending}
                variant={done ? "outline" : "default"}
                className="h-12 text-base"
            >
                {pending ? (
                    <Loader2 className="size-4 animate-spin" />
                ) : (
                    <CheckCircle2 className="size-5" />
                )}
                {done ? "Séance complétée — annuler" : "Marquer la séance comme complétée"}
            </Button>

            {/* Espace pour ne pas masquer le dernier bouton derrière le chrono. */}
            <div className="h-14" />

            <RestTimer rest={rest} onStart={startRest} onStop={() => setRest(null)} onTick={onTick} />
        </div>
    );
}
