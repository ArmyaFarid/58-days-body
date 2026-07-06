"use client";

import { useState } from "react";
import { Target, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatShort } from "@/lib/date";
import type { ExerciseHistoryEntry } from "@/lib/data/workout";

interface ExerciseRef {
    key: string;
    name: string;
}

interface PerfHistoryViewProps {
    exercises: ExerciseRef[];
    histories: Record<string, ExerciseHistoryEntry[]>;
    tractionKeys: string[];
}

function isStrictSet(band: string | null): boolean {
    if (!band) return true;
    const b = band.toLowerCase();
    // « assist. 30 kg », « bande 20 »… = assisté ; sinon strict.
    return !b.includes("assist") && !b.includes("bande") && !b.includes("kg");
}

export function PerfHistoryView({ exercises, histories, tractionKeys }: PerfHistoryViewProps) {
    const [selected, setSelected] = useState(exercises[0]?.key ?? "");

    if (exercises.length === 0) {
        return (
            <p className="text-muted-foreground py-8 text-center text-sm">
                Aucune performance loggée pour l&apos;instant. Complète une séance !
            </p>
        );
    }

    // Jalon tractions strictes : une série de tractions sans assistance.
    const strictAchieved = tractionKeys.some((k) =>
        (histories[k] ?? []).some((e) => e.sets.some((s) => s.reps != null && isStrictSet(s.band))),
    );
    const strictEntry = tractionKeys
        .flatMap((k) => histories[k] ?? [])
        .filter((e) => e.sets.some((s) => s.reps != null && isStrictSet(s.band)))
        .sort((a, b) => a.date.localeCompare(b.date))[0];

    const entries = histories[selected] ?? [];
    const selectedIsTraction = tractionKeys.includes(selected);

    return (
        <div className="flex flex-col gap-4">
            <Card className={cn(strictAchieved && "border-emerald-500/40 bg-emerald-500/5")}>
                <CardContent className="flex items-center gap-3 py-4">
                    {strictAchieved ? (
                        <Trophy className="size-6 text-emerald-500" />
                    ) : (
                        <Target className="text-muted-foreground size-6" />
                    )}
                    <div>
                        <p className="font-semibold">Jalon : tractions strictes</p>
                        <p className="text-muted-foreground text-sm">
                            {strictAchieved && strictEntry
                                ? `Atteint le ${formatShort(strictEntry.date)} 🎉`
                                : "Objectif des 58 jours : une traction sans bande d'assistance."}
                        </p>
                    </div>
                </CardContent>
            </Card>

            <div className="flex flex-wrap gap-1.5">
                {exercises.map((ex) => (
                    <button
                        key={ex.key}
                        onClick={() => setSelected(ex.key)}
                        className={cn(
                            "rounded-full px-3 py-1 text-sm transition-colors",
                            selected === ex.key ? "bg-primary text-primary-foreground" : "bg-muted",
                        )}
                    >
                        {ex.name}
                    </button>
                ))}
            </div>

            <div className="flex flex-col gap-2">
                {entries.map((entry) => (
                    <Card key={entry.date}>
                        <CardHeader className="flex-row items-center justify-between py-3">
                            <CardTitle className="text-sm">{formatShort(entry.date)}</CardTitle>
                            {selectedIsTraction &&
                            entry.sets.some((s) => s.reps != null && isStrictSet(s.band)) ? (
                                <Badge className="bg-emerald-500/15 text-emerald-500">strictes</Badge>
                            ) : null}
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-1.5 pb-3">
                            {entry.sets
                                .sort((a, b) => a.setIndex - b.setIndex)
                                .map((s) => (
                                    <span
                                        key={s.setIndex}
                                        className="bg-muted rounded-md px-2 py-1 text-sm tabular-nums"
                                    >
                                        {s.reps ?? "—"}
                                        {s.band ? (
                                            <span className="text-muted-foreground"> · {s.band}</span>
                                        ) : null}
                                    </span>
                                ))}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
