import Link from "next/link";
import { Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutView } from "@/components/workout/workout-view";
import { SeanceDateNav } from "@/components/workout/seance-date-nav";
import type { ExerciseBlock, LoggedSet } from "@/components/workout/types";
import { getSession as getAuthSession } from "@/lib/auth";
import { getStartDate } from "@/lib/data/settings";
import { getUserProgramId } from "@/lib/data/users";
import {
    getOrCreateSession,
    getSetLogsForSession,
    getLastPerformance,
} from "@/lib/data/workout";
import { todayISO, fromISO } from "@/lib/date";
import {
    getDayNumber,
    getProgram,
    parseSetCount,
    getBandMode,
    youtubeSearchUrl,
    variantsFor,
} from "@/lib/program";

function resolveDate(raw: string | undefined, today: string): string {
    return raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) && raw <= today ? raw : today;
}

export default async function SeancePage({
    searchParams,
}: {
    searchParams: Promise<{ date?: string }>;
}) {
    const { userId } = (await getAuthSession())!;
    const startDate = (await getStartDate(userId))!;
    const programId = await getUserProgramId(userId);
    const program = getProgram(programId);
    const today = todayISO();
    const selectedDate = resolveDate((await searchParams).date, today);
    const dayNumber = getDayNumber(startDate, fromISO(selectedDate));
    const phase = program.getPhase(dayNumber);
    const dayType = program.dayTypeForWeekday(fromISO(selectedDate).getDay());
    const session = program.sessions[dayType];
    const training = program.isTrainingDay(dayType, phase?.key ?? null);

    if (!training || !session || session.dayType === "repos") {
        return (
            <div className="flex flex-col gap-4 p-4">
                <SeanceDateNav today={today} selectedDate={selectedDate} />
                <div className="flex flex-col items-center justify-center gap-4 rounded-xl border p-8 text-center">
                    <div className="bg-muted flex size-14 items-center justify-center rounded-full">
                        <Moon className="size-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-semibold">Jour de repos</h1>
                        <p className="text-muted-foreground mt-1 text-sm">
                            {dayType === "repos"
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

    const wSession = await getOrCreateSession(userId, selectedDate, dayType, phase?.key ?? "libre");
    const todayLogs = await getSetLogsForSession(wSession.id);

    const blocks: ExerciseBlock[] = await Promise.all(
        session.exercises.map(async (ex) => {
            const lexicon = program.lexicon[ex.lexiconKey];
            const last = await getLastPerformance(userId, ex.key, selectedDate);

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
                intensification: ex.intensification,
                bandMode: getBandMode(ex),
                lexiconKey: ex.lexiconKey,
                lexiconName: lexicon?.name ?? ex.name,
                lexiconText: lexicon?.text ?? "",
                youtubeUrl: youtubeSearchUrl(lexicon?.name ?? ex.name),
                setCount: parseSetCount(ex.sets),
                logged: loggedMap,
                last: lastMap,
                variantsEnabled: program.features.variants,
                variants: variantsFor(ex.key),
                variant: todayVariant,
                lastVariant,
            };
        }),
    );

    return (
        <WorkoutView
            today={today}
            selectedDate={selectedDate}
            sessionId={wSession.id}
            completed={wSession.completed}
            title={session.title}
            focus={session.focus}
            phaseLabel={phase?.label ?? null}
            showIntensification={program.features.intensification && phase?.key === "bloc2"}
            isCircuit={Boolean(session.isCircuit)}
            circuitNote={session.circuitNote}
            finisher={session.finisher}
            exercises={blocks}
        />
    );
}
