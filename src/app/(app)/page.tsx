import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Flame, Play, Ruler, Settings, Trophy } from "lucide-react";
import { DumbbellIcon } from "@/components/dumbbell-icon";
import { Progress } from "@/components/ui/progress";
import { HabitChecklist } from "@/components/habit-checklist";
import { NutritionSummaryCard } from "@/components/nutrition/nutrition-summary-card";
import { ProgramPill } from "@/components/program-pill";
import { ResumeProgramButton } from "@/components/resume-program-button";
import { WeightTile } from "@/components/weight-tile";
import { InstallHint } from "@/components/install-hint";
import { DayRing } from "@/components/day-ring";
import { getSession as getAuthSession } from "@/lib/auth";
import { getNutritionGoals } from "@/lib/data/settings";
import { getActiveProgram, scheduleContext } from "@/lib/data/user-programs";
import { getWeights, getWeightForDate, computeTrend } from "@/lib/data/weight";
import { getHabit } from "@/lib/data/habits";
import { getSessionForDate, getCompletedSessionDates } from "@/lib/data/workout";
import { getMeasurements } from "@/lib/data/measurements";
import { getLoggedEntries } from "@/lib/data/nutrition";
import { PRESETS, totalsOfEntries } from "@/lib/nutrition";
import { habitMetaFor } from "@/lib/habits-meta";
import { todayISO, fromISO, formatShort, TIMEZONE } from "@/lib/date";
import { getProgram, parseSetCount } from "@/lib/program";
import { computeWeeklyStreak } from "@/lib/program/streak";

function measurementIsDue(dates: string[], today: string): boolean {
    if (dates.length === 0) return true;
    const last = dates[dates.length - 1];
    return differenceInCalendarDays(fromISO(today), fromISO(last)) >= 14;
}

export default async function DashboardPage() {
    const { userId, username } = (await getAuthSession())!;
    const { program, row, all } = (await getActiveProgram(userId))!;
    const startDate = row.startDate;
    const today = todayISO();
    const ctx = scheduleContext(row, today);
    const dayNumber = ctx.dayNumber;
    const phase = program.getPhase(dayNumber);
    const trainingPhase = program.trainingPhase?.(ctx) ?? null;
    const dayType = program.dayTypeForWeekday(fromISO(today).getDay(), ctx);
    const session = program.sessions[dayType];
    const training = program.isTrainingDay(dayType, phase?.key ?? null);

    const [weights, todayWeight, habit, workoutSession, nutritionGoals, foodEntries, measurements, completedDates] =
        await Promise.all([
            getWeights(userId),
            getWeightForDate(userId, today),
            getHabit(userId, today),
            getSessionForDate(userId, program, today),
            getNutritionGoals(userId),
            getLoggedEntries(userId, today),
            program.features.measurementsPrimary ? getMeasurements(userId) : Promise.resolve([]),
            getCompletedSessionDates(userId, program, startDate),
        ]);
    const trend = computeTrend(weights, program.trend);
    const sessionDone = workoutSession?.completed === true;
    const meta = habitMetaFor(program, { creatine: row.creatine });
    const streak = program.features.weeklyStreak
        ? computeWeeklyStreak(program, startDate, row.holdPhase1, completedDates, today)
        : null;
    // Tout en pause : le programme affiché (en pause) reste dans le sélecteur.
    const paused = row.status === "paused";
    const switcherPrograms = all
        .filter((r) => r.status === "active" || r.programId === row.programId)
        .map((r) => ({ id: r.programId, label: getProgram(r.programId).shortLabel }));

    const length = program.length;
    const beforeStart = dayNumber < 1;
    const finished = length != null && dayNumber > length;

    // Progression : durée fixe (58 jours) ou vers le poids cible (programme ouvert).
    const targetWeight = program.features.targetWeight ? row.targetWeightKg : null;
    const firstWeight = weights[0]?.weightKg ?? null;
    const latestWeight = trend.latest?.weightKg ?? null;
    const weightProgress =
        targetWeight != null && firstWeight != null && latestWeight != null && targetWeight !== firstWeight
            ? Math.min(100, Math.max(0, ((latestWeight - firstWeight) / (targetWeight - firstWeight)) * 100))
            : 0;
    const remainingKg = targetWeight != null && latestWeight != null ? targetWeight - latestWeight : null;

    const showMeasurementReminder =
        program.features.measurementsPrimary &&
        !beforeStart &&
        measurementIsDue(
            measurements.map((m) => m.date),
            today,
        );

    const longDate = new Intl.DateTimeFormat("fr-CA", { weekday: "short", day: "numeric", month: "short" }).format(
        fromISO(today),
    );
    const remainingDays = length != null ? Math.max(0, length - dayNumber) : 0;

    // Prochaine phase (« Bloc 2 dans 3 jours ») pour les programmes à durée fixe.
    let nextPhaseText: string | null = null;
    if (length != null && phase && !beforeStart && !finished) {
        for (let d = dayNumber + 1; d <= length; d++) {
            const p = program.getPhase(d);
            if (p && p.key !== phase.key) {
                nextPhaseText = `${p.label} dans ${d - dayNumber} ${d - dayNumber > 1 ? "jours" : "jour"}`;
                break;
            }
        }
    }

    const isTrainingToday = training && session != null && session.dayType !== "repos";
    const setTotal = isTrainingToday ? session.exercises.reduce((acc, ex) => acc + parseSetCount(ex.sets), 0) : 0;
    // Estimation grossière : ~2 min par série, repos compris.
    const minutes = Math.max(5, Math.round((setTotal * 2) / 5) * 5);

    // Prénom affiché : l'identifiant de connexion, avec une majuscule.
    const firstName = username.charAt(0).toUpperCase() + username.slice(1);
    const dayContext = beforeStart
        ? null
        : !isTrainingToday
          ? "jour de repos"
          : sessionDone
            ? "séance faite"
            : "séance à faire";

    const header = (
        <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-col gap-0.5">
                <span className="text-muted-foreground truncate text-[0.8125rem] first-letter:uppercase">
                    {longDate}
                    {dayContext ? ` · ${dayContext}` : ""}
                </span>
                <span className="font-heading text-[1.625rem] leading-tight font-bold tracking-[-0.03125rem] whitespace-nowrap">
                    Salut {firstName}
                </span>
            </div>
            <div className="flex min-w-0 items-center gap-2">
                <ProgramPill key={program.id} programs={switcherPrograms} current={program.id} />
                <Link
                    href="/parametres"
                    aria-label="Paramètres"
                    className="bg-card text-muted-foreground flex size-11 items-center justify-center rounded-full border"
                >
                    <Settings className="size-5" />
                </Link>
            </div>
        </div>
    );

    const dayCard = (
        <section className="bg-card flex flex-col gap-4 rounded-3xl p-5">
            <div className="flex items-center gap-5">
                {length != null && !beforeStart ? <DayRing value={Math.min(dayNumber, length)} total={length} /> : null}
                <div className="flex min-w-0 flex-col gap-2">
                    {phase && !beforeStart && !finished ? (
                        <span className="bg-brand text-brand-foreground self-start rounded-md px-2 py-1 text-[0.6875rem] whitespace-nowrap font-bold tracking-[0.0625rem] uppercase">
                            {(trainingPhase?.shortLabel ?? phase.shortLabel).replace(" — ", " · ")}
                        </span>
                    ) : null}
                    <span className="font-heading text-xl leading-[1.2] font-semibold">
                        {beforeStart
                            ? `Démarre le ${formatShort(startDate)}`
                            : finished
                              ? "Programme terminé"
                              : length != null
                                ? `${remainingDays} ${remainingDays > 1 ? "jours restants" : "jour restant"}`
                                : trainingPhase
                                  ? `Semaine ${Math.floor((dayNumber - 1) / 7) + 1}`
                                  : `Jour ${dayNumber}`}
                    </span>
                    <span className="text-muted-foreground text-[0.8125rem] leading-[1.4]">
                        {finished
                            ? "Bravo — continue sur ta lancée."
                            : (nextPhaseText ?? trainingPhase?.label ?? phase?.label ?? program.objective ?? "")}
                    </span>
                </div>
            </div>
            {length == null && !beforeStart ? (
                targetWeight != null ? (
                    <div className="flex flex-col gap-2">
                        <Progress value={weightProgress} />
                        <p className="text-muted-foreground text-[0.8125rem]">
                            {latestWeight != null
                                ? `${latestWeight.toFixed(1)} kg → objectif ${targetWeight.toFixed(1)} kg${
                                      remainingKg != null && remainingKg > 0
                                          ? ` (reste +${remainingKg.toFixed(1)} kg)`
                                          : ""
                                  }`
                                : `Objectif ${targetWeight.toFixed(1)} kg — ajoute ta première pesée.`}
                        </p>
                    </div>
                ) : (
                    <p className="text-muted-foreground text-[0.8125rem]">Définis ton poids cible dans les réglages.</p>
                )
            ) : null}
        </section>
    );

    const seanceCard = isTrainingToday ? (
        <section className="bg-brand text-brand-foreground flex flex-col gap-3.5 rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                    <span className="text-xs font-bold tracking-[0.0625rem] uppercase opacity-75">
                        {sessionDone ? "Séance faite" : "Séance du jour"}
                    </span>
                    <span className="font-heading text-[1.875rem] leading-none font-bold tracking-[-0.03125rem]">
                        {session.title}
                    </span>
                    <span className="text-sm font-medium">{session.focus}</span>
                </div>
                <DumbbellIcon className="size-14 shrink-0" strokeWidth={1.6} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8125rem] font-semibold">
                <span>{session.exercises.length} exercices</span>
                <span>{setTotal} séries</span>
                <span>≈ {minutes} min</span>
            </div>
            <Link
                href="/seance"
                className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#0e0f12] text-[1.0625rem] font-bold text-[#f4f5f7]"
            >
                <Play className="size-5 fill-current" strokeWidth={0} aria-hidden />
                {sessionDone ? "Revoir la séance" : "Démarrer la séance"}
            </Link>
        </section>
    ) : (
        <section className="bg-card flex flex-col gap-1 rounded-3xl p-5">
            <span className="text-muted-foreground text-xs font-bold tracking-[0.0625rem] uppercase">
                Séance du jour
            </span>
            <span className="font-heading text-[1.875rem] leading-tight font-bold">Repos</span>
            <span className="text-muted-foreground text-sm">
                {dayType === "repos" ? "Jour off — repos ou marche légère." : "Pas de séance prévue aujourd'hui."}
            </span>
        </section>
    );

    const tiles = (
        <div className="grid grid-cols-2 gap-3">
            {streak ? (
                <div className="bg-card flex flex-col gap-2.5 rounded-[1.25rem] p-4">
                    <Flame
                        className={streak.weeks > 0 ? "text-streak size-6" : "text-muted-foreground size-6"}
                        strokeWidth={2}
                    />
                    <span className="font-heading text-[1.625rem] leading-tight font-bold tabular-nums">
                        {streak.weeks} sem.
                    </span>
                    <span className="text-muted-foreground text-[0.8125rem]">
                        de suite · {streak.doneThisWeek}/{streak.plannedThisWeek} cette semaine
                    </span>
                    <div className="mt-auto flex gap-1">
                        {Array.from({ length: Math.max(1, streak.plannedThisWeek) }).map((_, i) => (
                            <span
                                key={i}
                                className={
                                    i < streak.doneThisWeek
                                        ? "bg-streak h-1.5 flex-1 rounded-[3px]"
                                        : "bg-border h-1.5 flex-1 rounded-[3px]"
                                }
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-card flex flex-col gap-2.5 rounded-[1.25rem] p-4">
                    <Trophy className="text-streak size-6" strokeWidth={2} />
                    <span className="font-heading text-[1.625rem] leading-tight font-bold tabular-nums">
                        {completedDates.length}
                    </span>
                    <span className="text-muted-foreground text-[0.8125rem]">
                        {completedDates.length > 1 ? "séances faites" : "séance faite"} depuis le début
                    </span>
                </div>
            )}
            <WeightTile
                date={today}
                todayWeight={todayWeight}
                latest={trend.latest?.weightKg ?? null}
                deltaPerWeek={trend.deltaPerWeek}
            />
        </div>
    );

    // Jalons : séances faites, semaines complètes, fin de la première phase.
    const done = completedDates.length;
    const SESSION_STEPS = [1, 5, 10, 25, 50, 100];
    const earned: string[] = SESSION_STEPS.filter((n) => done >= n).map((n) =>
        n === 1 ? "1ʳᵉ séance" : `${n} séances`,
    );
    if (streak && streak.weeks >= 1) earned.push(streak.weeks >= 4 ? "4 semaines d’affilée" : "Semaine complète");
    const firstPhase = program.getPhase(1);
    if (firstPhase && !beforeStart) {
        let end = 1;
        while (end < 400 && program.getPhase(end + 1)?.key === firstPhase.key) end++;
        if (end < 400 && dayNumber > end) earned.push(`${firstPhase.label.split(" — ")[0].split(" (")[0]} terminé`);
    }
    const nextStep = SESSION_STEPS.find((n) => done < n);
    const milestones =
        earned.length > 0 || nextStep ? (
            <section className="flex flex-col gap-2.5">
                <h2 className="text-[0.9375rem] font-semibold">Jalons</h2>
                <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {[...earned].reverse().map((m) => (
                        <span
                            key={m}
                            className="bg-card flex h-11 shrink-0 items-center gap-2 rounded-full pr-4 pl-1.5 text-[0.8125rem] font-semibold whitespace-nowrap"
                        >
                            <span className="bg-brand text-brand-foreground flex size-8 items-center justify-center rounded-full">
                                <Trophy className="size-4" />
                            </span>
                            {m}
                        </span>
                    ))}
                    {nextStep ? (
                        <span className="text-muted-foreground flex h-11 shrink-0 items-center gap-2 rounded-full border border-dashed pr-4 pl-1.5 text-[0.8125rem] font-semibold whitespace-nowrap">
                            <span className="bg-muted flex size-8 items-center justify-center rounded-full">
                                <Trophy className="size-4" />
                            </span>
                            {nextStep === 1 ? "1ʳᵉ séance" : `${nextStep} séances`} · {done}/{nextStep}
                        </span>
                    ) : null}
                </div>
            </section>
        ) : null;

    const habitsCard = (
        <section className="bg-card rounded-[1.25rem] p-4">
            <HabitChecklist
                date={today}
                initial={habit}
                meta={meta}
                showSession={program.features.sessionHabit}
                sessionDone={sessionDone}
                compact
                href="/habitudes"
            />
        </section>
    );

    // Repas proposé selon l'heure locale : matin avant 15 h, soir ensuite.
    const hour = Number(
        new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone: TIMEZONE }).format(new Date()),
    );
    const preset = PRESETS.find((p) => p.key === (hour < 15 ? "matin" : "soir")) ?? PRESETS[0];
    const nutritionTotals = totalsOfEntries(foodEntries);
    const nutritionCard = (
        <NutritionSummaryCard
            date={today}
            calories={nutritionTotals.calories}
            protein={nutritionTotals.protein}
            calorieGoal={nutritionGoals.calorieGoal}
            proteinGoal={nutritionGoals.proteinGoal}
            preset={{ key: preset.key, label: preset.label }}
        />
    );

    return (
        <div className="flex flex-col gap-4 px-5 pt-4">
            {header}

            <InstallHint />

            {paused ? (
                <section className="bg-card flex items-center gap-3 rounded-[1.25rem] border border-amber-500/40 p-4">
                    <p className="flex-1 text-sm">Ce programme est en pause. Tes données sont conservées.</p>
                    <ResumeProgramButton programId={program.id} />
                </section>
            ) : null}

            {dayCard}

            {showMeasurementReminder ? (
                <Link
                    href="/suivi?tab=mensurations"
                    className="bg-card flex items-center gap-3 rounded-[1.25rem] p-4 text-sm font-medium"
                >
                    <Ruler className="text-primary size-5 shrink-0" />
                    Mensurations à prendre (toutes les 2 semaines).
                </Link>
            ) : null}

            {seanceCard}
            {tiles}
            {milestones}
            {habitsCard}

            {trend.suggestionText ? (
                <p className="bg-card text-muted-foreground rounded-[1.25rem] p-4 text-[0.8125rem]">
                    {trend.suggestionText}
                </p>
            ) : null}

            {nutritionCard}
        </div>
    );
}
