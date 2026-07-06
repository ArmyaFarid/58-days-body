import Link from "next/link";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutView } from "@/components/workout/workout-view";
import type { ExerciseBlock, LoggedSet } from "@/components/workout/types";
import { getStartDate } from "@/lib/data/settings";
import {
    getOrCreateSession,
    getSetLogsForSession,
    getLastPerformance,
} from "@/lib/data/workout";
import { todayISO, fromISO } from "@/lib/date";
import {
    getDayNumber,
    getPhaseForDay,
    getDayTypeForDate,
    getSession,
    isTrainingDay,
    parseSetCount,
    LEXICON,
    youtubeSearchUrl,
} from "@/lib/program";

export default async function SeancePage() {
    const startDate = (await getStartDate())!;
    const today = todayISO();
    const dayNumber = getDayNumber(startDate, fromISO(today));
    const phase = getPhaseForDay(dayNumber);
    const dayType = getDayTypeForDate(fromISO(today));
    const session = getSession(dayType);
    const training = isTrainingDay(dayType, phase?.key ?? null);

    if (!training || session.dayType === "repos") {
        return (
            <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
                <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                    <Moon className="size-6" />
                </div>
                <div>
                    <h1 className="text-xl font-semibold">Repos aujourd&apos;hui</h1>
                    <p className="text-muted-foreground mt-1 text-sm">
                        {dayType === "repos"
                            ? "Jour off — cruiser board bienvenu."
                            : "Pas de séance prévue aujourd'hui en délestage."}
                    </p>
                </div>
                <Button render={<Link href="/" />} variant="outline">
                    Retour à l&apos;accueil
                </Button>
            </div>
        );
    }

    const wSession = await getOrCreateSession(today, dayType, phase?.key ?? "libre");
    const todayLogs = await getSetLogsForSession(wSession.id);

    const blocks: ExerciseBlock[] = await Promise.all(
        session.exercises.map(async (ex) => {
            const lexicon = LEXICON[ex.lexiconKey];
            const last = await getLastPerformance(ex.key, today);

            const loggedMap: Record<number, LoggedSet> = {};
            for (const l of todayLogs.filter((t) => t.exerciseKey === ex.key)) {
                loggedMap[l.setIndex] = { reps: l.reps, band: l.band };
            }
            const lastMap: Record<number, LoggedSet> = {};
            for (const l of last) {
                lastMap[l.setIndex] = { reps: l.reps, band: l.band };
            }

            return {
                key: ex.key,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                band: ex.band,
                notes: ex.notes,
                intensification: ex.intensification,
                lexiconKey: ex.lexiconKey,
                lexiconName: lexicon?.name ?? ex.name,
                lexiconText: lexicon?.text ?? "",
                youtubeUrl: youtubeSearchUrl(lexicon?.name ?? ex.name),
                setCount: parseSetCount(ex.sets),
                logged: loggedMap,
                last: lastMap,
            };
        }),
    );

    return (
        <WorkoutView
            sessionId={wSession.id}
            completed={wSession.completed}
            title={session.title}
            focus={session.focus}
            phaseLabel={phase?.label ?? null}
            showIntensification={phase?.key === "bloc2"}
            isCircuit={Boolean(session.isCircuit)}
            circuitNote={session.circuitNote}
            finisher={session.finisher}
            exercises={blocks}
        />
    );
}
