import Link from "next/link";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutView } from "@/components/workout/workout-view";
import type { ExerciseBlock, LoggedSet } from "@/components/workout/types";
import { getSession as getAuthSession } from "@/lib/auth";
import { getActiveProgram, scheduleContext } from "@/lib/data/user-programs";
import {
    getOrCreateSession,
    getSetLogsForSession,
    getLastPerformance,
} from "@/lib/data/workout";
import { todayISO, fromISO } from "@/lib/date";
import {
    parseSetCount,
    getBandMode,
    youtubeSearchUrl,
    variantsFor,
    sessionForDate,
} from "@/lib/program";

// Les jours à venir sont consultables en aperçu (rien n'est créé en base).
function resolveDate(raw: string | undefined, today: string): string {
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
}

export default async function SeancePage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const { userId } = (await getAuthSession())!;
    const { program, row } = (await getActiveProgram(userId))!;
    const today = todayISO();
    const selectedDate = resolveDate((await searchParams).date, today);
    const ctx = scheduleContext(row, selectedDate);
    const phase = program.getPhase(ctx.dayNumber);
    const trainingPhase = program.trainingPhase?.(ctx) ?? null;
    const dayType = program.dayTypeForWeekday(fromISO(selectedDate).getDay(), ctx);
    const base = program.sessions[dayType];
    // Une séance passée s'affiche telle qu'elle était ce jour-là.
    const session = base ? sessionForDate(base, selectedDate) : base;
    const training = program.isTrainingDay(dayType, phase?.key ?? null);
    const isFuture = selectedDate > today;

    // Avant le début du programme : rien à faire, et surtout rien à créer en base.
    if (ctx.dayNumber < 1 || !training || !session || session.dayType === "repos") {
        return (
            <div className="flex flex-col gap-4 p-4">
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border p-8 text-center">
                    <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                        <Moon className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Jour de repos</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {ctx.dayNumber < 1
                                ? "Le programme n'a pas encore commencé ce jour-là."
                                : dayType === "repos"
                                ? "Jour off — pas de séance prévue ce jour-là."
                                : "Pas de séance prévue ce jour-là en délestage."}
                        </p>
                    </div>
                    <Button render={<Link href="/" />} variant="outline">
                        Retour à l&apos;accueil
                    </Button>
                </div>
            </div>
        );
    }

    const wSession = isFuture
        ? null
        : await getOrCreateSession(
              userId,
              program,
              selectedDate,
              dayType,
              trainingPhase?.key ?? phase?.key ?? "libre",
          );
    const todayLogs = wSession ? await getSetLogsForSession(wSession.id) : [];

    const blocks: ExerciseBlock[] = await Promise.all(
        session.exercises.map(async (ex) => {
            const lexicon = program.lexicon[ex.lexiconKey];
            const last = isFuture ? [] : await getLastPerformance(userId, program, ex.key, selectedDate);

            const todayForEx = todayLogs.filter((t) => t.exerciseKey === ex.key);
            const loggedMap: Record<number, LoggedSet> = {};
            for (const l of todayForEx) {
                loggedMap[l.setIndex] = { reps: l.reps, band: l.band };
            }
            const lastMap: Record<number, LoggedSet> = {};
            for (const l of last) {
                lastMap[l.setIndex] = { reps: l.reps, band: l.band };
            }
            const todayVariant = todayForEx.find((t) => t.variant)?.variant ?? null;
            const lastVariant = last.find((t) => t.variant)?.variant ?? null;

            return {
                key: ex.key,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                band: ex.band,
                notes: ex.notes,
                progression: ex.progression,
                intensification: ex.intensification,
                bandMode: getBandMode(ex),
                lexiconKey: ex.lexiconKey,
                lexiconName: lexicon?.name ?? ex.name,
                lexiconText: lexicon?.text ?? "",
                youtubeUrl: youtubeSearchUrl(lexicon?.youtubeQuery ?? lexicon?.name ?? ex.name),
                setCount: parseSetCount(ex.sets),
                logged: loggedMap,
                last: lastMap,
                variantsEnabled: program.features.variants,
                variants: program.variants?.[ex.key] ?? variantsFor(ex.key),
                variant: todayVariant,
                lastVariant,
            };
        }),
    );

    return (
        <WorkoutView
            today={today}
            selectedDate={selectedDate}
            sessionId={wSession?.id ?? null}
            completed={wSession?.completed ?? false}
            title={session.title}
            focus={session.focus}
            phaseLabel={trainingPhase?.shortLabel ?? phase?.label ?? null}
            showIntensification={program.features.intensification && phase?.key === "bloc2"}
            isCircuit={Boolean(session.isCircuit)}
            circuitNote={session.circuitNote}
            finisher={session.finisher}
            styleNote={session.styleNote}
            exercises={blocks}
        />
    );
}
