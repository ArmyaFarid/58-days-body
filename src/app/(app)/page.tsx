import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Dumbbell, ChevronRight, TrendingUp, TrendingDown, Minus, Scale, CheckCircle2, UtensilsCrossed, Ruler, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuickWeight } from "@/components/quick-weight";
import { HabitChecklist } from "@/components/habit-checklist";
import { NutritionTracker } from "@/components/nutrition/nutrition-tracker";
import { ProgramSwitcher } from "@/components/program-switcher";
import { ResumeProgramButton } from "@/components/resume-program-button";
import { getSession as getAuthSession } from "@/lib/auth";
import { getNutritionGoals } from "@/lib/data/settings";
import { getActiveProgram, scheduleContext } from "@/lib/data/user-programs";
import { getWeights, getWeightForDate, computeTrend } from "@/lib/data/weight";
import { getHabit } from "@/lib/data/habits";
import { getSessionForDate, getCompletedSessionDates } from "@/lib/data/workout";
import { getMeasurements } from "@/lib/data/measurements";
import {
    getLoggedEntries,
    getFrequentFoodKeys,
    getNutritionHistory,
} from "@/lib/data/nutrition";
import { getCustomFoods } from "@/lib/data/custom-foods";
import { getCustomPresets } from "@/lib/data/custom-presets";
import { habitMetaFor } from "@/lib/habits-meta";
import { todayISO, fromISO, formatShort } from "@/lib/date";
import { getProgram } from "@/lib/program";
import { computeWeeklyStreak } from "@/lib/program/streak";

function measurementIsDue(dates: string[], today: string): boolean {
    if (dates.length === 0) return true;
    const last = dates[dates.length - 1];
    return differenceInCalendarDays(fromISO(today), fromISO(last)) >= 14;
}

export default async function DashboardPage() {
    const { userId } = (await getAuthSession())!;
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

    const [weights, todayWeight, habit, workoutSession, nutritionGoals, foodEntries, frequentKeys, nutritionHistory, customFoods, customPresets, measurements, completedDates] =
        await Promise.all([
            getWeights(userId),
            getWeightForDate(userId, today),
            getHabit(userId, today),
            getSessionForDate(userId, program, today),
            getNutritionGoals(userId),
            getLoggedEntries(userId, today),
            getFrequentFoodKeys(userId),
            getNutritionHistory(userId),
            getCustomFoods(),
            getCustomPresets(),
            program.features.measurementsPrimary ? getMeasurements(userId) : Promise.resolve([]),
            program.features.weeklyStreak
                ? getCompletedSessionDates(userId, program, startDate)
                : Promise.resolve([]),
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
    const fixedProgress = length ? Math.min(100, Math.max(0, (dayNumber / length) * 100)) : 0;
    const weightProgress =
        targetWeight != null && firstWeight != null && latestWeight != null && targetWeight !== firstWeight
            ? Math.min(100, Math.max(0, ((latestWeight - firstWeight) / (targetWeight - firstWeight)) * 100))
            : 0;
    const remainingKg =
        targetWeight != null && latestWeight != null ? targetWeight - latestWeight : null;

    const showMeasurementReminder =
        program.features.measurementsPrimary &&
        !beforeStart &&
        measurementIsDue(measurements.map((m) => m.date), today);

    const nutritionCard = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <UtensilsCrossed className="size-4" />
                    Nutrition du jour
                </CardTitle>
            </CardHeader>
            <CardContent>
                <NutritionTracker
                    today={today}
                    proteinGoal={nutritionGoals.proteinGoal}
                    calorieGoal={nutritionGoals.calorieGoal}
                    fatGoal={nutritionGoals.fatGoal}
                    initialEntries={foodEntries}
                    initialCustomFoods={customFoods}
                    initialCustomPresets={customPresets}
                    frequentKeys={frequentKeys}
                    history={nutritionHistory}
                />
                {program.nutritionNote ? (
                    <p className="text-muted-foreground mt-3 border-t pt-3 text-xs leading-relaxed">
                        {program.nutritionNote}
                    </p>
                ) : null}
            </CardContent>
        </Card>
    );

    const streakCard = streak ? (
        <Card className="border-orange-500/30 bg-orange-500/5">
            <CardContent className="flex items-center gap-3 py-3">
                <Flame
                    className={streak.weeks > 0 ? "size-7 shrink-0 text-orange-500" : "text-muted-foreground size-7 shrink-0"}
                />
                <div className="flex-1">
                    <p className="text-lg font-semibold leading-tight">
                        {streak.weeks} {streak.weeks > 1 ? "semaines" : "semaine"} de suite
                    </p>
                    <p className="text-muted-foreground text-sm">
                        Cette semaine : {streak.doneThisWeek} / {streak.plannedThisWeek} séances
                    </p>
                </div>
            </CardContent>
        </Card>
    ) : null;

    const seanceCard = (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                    <Dumbbell className="size-4" />
                    Séance du jour
                </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
                {training && session && session.dayType !== "repos" ? (
                    <>
                        <div>
                            <p className="text-xl font-semibold">{session.title}</p>
                            <p className="text-muted-foreground text-sm">{session.focus}</p>
                        </div>
                        {sessionDone ? (
                            <>
                                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 p-3 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="size-4 shrink-0" />
                                    Séance complétée aujourd&apos;hui 💪
                                </div>
                                <Button render={<Link href="/seance" />} variant="outline" className="h-11">
                                    Revoir la séance
                                    <ChevronRight className="size-4" />
                                </Button>
                            </>
                        ) : (
                            <Button render={<Link href="/seance" />} className="h-11">
                                Démarrer la séance
                                <ChevronRight className="size-4" />
                            </Button>
                        )}
                    </>
                ) : (
                    <div>
                        <p className="text-xl font-semibold">Repos</p>
                        <p className="text-muted-foreground text-sm">
                            {dayType === "repos"
                                ? "Jour off — repos ou marche légère."
                                : "Pas de séance prévue aujourd'hui."}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );

    return (
        <div className="flex flex-col gap-4 p-4">
            <ProgramSwitcher key={program.id} programs={switcherPrograms} current={program.id} />

            {paused ? (
                <Card className="border-amber-500/40 bg-amber-500/5">
                    <CardContent className="flex items-center gap-3 py-3">
                        <p className="flex-1 text-sm">
                            Ce programme est en pause. Tes données sont conservées.
                        </p>
                        <ResumeProgramButton programId={program.id} />
                    </CardContent>
                </Card>
            ) : null}

            {/* En-tête jour / phase */}
            <section>
                <div className="flex items-end justify-between gap-2">
                    <div>
                        <p className="text-muted-foreground text-sm">{formatShort(today)}</p>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {beforeStart
                                ? "Bientôt"
                                : finished
                                  ? "Terminé 🎉"
                                  : trainingPhase
                                    ? `Semaine ${Math.floor((dayNumber - 1) / 7) + 1}`
                                    : length != null
                                      ? `Jour ${dayNumber} / ${length}`
                                      : `Jour ${dayNumber}`}
                            {trainingPhase && !beforeStart ? (
                                <span className="text-muted-foreground text-base font-medium">
                                    {" "}
                                    — {trainingPhase.label}
                                </span>
                            ) : null}
                        </h1>
                    </div>
                    {phase && !trainingPhase ? <Badge variant="secondary">{phase.shortLabel}</Badge> : null}
                </div>
                {program.objective ? (
                    <p className="text-muted-foreground mt-1 text-sm">{program.objective}</p>
                ) : null}

                {beforeStart ? (
                    <p className="text-muted-foreground mt-2 text-sm">
                        Le programme démarre le {formatShort(startDate)}.
                    </p>
                ) : finished ? (
                    <p className="text-muted-foreground mt-2 text-sm">
                        58 jours bouclés. Bravo — continue sur ta lancée.
                    </p>
                ) : length != null ? (
                    <div className="mt-3">
                        <Progress value={fixedProgress} />
                        {phase ? (
                            <p className="text-muted-foreground mt-2 text-sm">{phase.description}</p>
                        ) : null}
                    </div>
                ) : (
                    <div className="mt-3 flex flex-col gap-2">
                        {phase ? <p className="text-sm font-medium">{phase.label}</p> : null}
                        {targetWeight != null ? (
                            <>
                                <Progress value={weightProgress} />
                                <p className="text-muted-foreground text-sm">
                                    {latestWeight != null
                                        ? `${latestWeight.toFixed(1)} kg → objectif ${targetWeight.toFixed(1)} kg${
                                              remainingKg != null && remainingKg > 0
                                                  ? ` (reste +${remainingKg.toFixed(1)} kg)`
                                                  : " 🎉"
                                          }`
                                        : `Objectif ${targetWeight.toFixed(1)} kg — ajoute ta première pesée.`}
                                </p>
                            </>
                        ) : (
                            <p className="text-muted-foreground text-sm">
                                Définis ton poids cible dans les réglages.
                            </p>
                        )}
                    </div>
                )}
            </section>

            {showMeasurementReminder ? (
                <Link href="/suivi?tab=mensurations">
                    <Card className="border-primary/40 bg-primary/5 transition-colors hover:bg-primary/10">
                        <CardContent className="flex items-center gap-3 py-3">
                            <Ruler className="text-primary size-5 shrink-0" />
                            <p className="flex-1 text-sm font-medium">
                                Mensurations à prendre (toutes les 2 semaines).
                            </p>
                            <ChevronRight className="text-muted-foreground size-4" />
                        </CardContent>
                    </Card>
                </Link>
            ) : null}

            {program.features.nutritionFirst ? (
                <>
                    {nutritionCard}
                    {streakCard}
                    {seanceCard}
                </>
            ) : (
                <>
                    {seanceCard}
                    {nutritionCard}
                </>
            )}

            {/* À faire aujourd'hui */}
            <Card>
                <CardHeader className="flex-row items-center justify-between">
                    <CardTitle className="text-base">À faire aujourd&apos;hui</CardTitle>
                    <Link
                        href="/habitudes"
                        className="text-muted-foreground flex items-center text-sm"
                    >
                        Séries
                        <ChevronRight className="size-4" />
                    </Link>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <div>
                        <p className="text-muted-foreground mb-2 text-sm">Pesée du matin</p>
                        <QuickWeight date={today} initial={todayWeight} />
                    </div>
                    <HabitChecklist
                        date={today}
                        initial={habit}
                        meta={meta}
                        showSession={program.features.sessionHabit}
                        sessionDone={sessionDone}
                    />
                </CardContent>
            </Card>

            {/* Tendance poids */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Scale className="size-4" />
                        Poids
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-4">
                        <div>
                            <p className="text-muted-foreground text-xs">Dernière pesée</p>
                            <p className="text-2xl font-semibold">
                                {trend.latest ? `${trend.latest.weightKg.toFixed(1)} kg` : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Moyenne cette semaine</p>
                            <p className="flex items-center gap-1 text-2xl font-semibold">
                                {trend.currentWeekAvg != null
                                    ? `${trend.currentWeekAvg.toFixed(1)} kg`
                                    : "—"}
                                {trend.deltaPerWeek != null ? (
                                    trend.deltaPerWeek > 0.05 ? (
                                        <TrendingUp className="size-4 text-emerald-500" />
                                    ) : trend.deltaPerWeek < -0.05 ? (
                                        <TrendingDown className="size-4 text-red-500" />
                                    ) : (
                                        <Minus className="text-muted-foreground size-4" />
                                    )
                                ) : null}
                            </p>
                        </div>
                    </div>
                    {trend.suggestionText ? (
                        <p className="bg-muted rounded-lg p-3 text-sm">{trend.suggestionText}</p>
                    ) : null}
                    <Button render={<Link href="/suivi" />} variant="outline" className="h-10">
                        Voir le suivi complet
                        <ChevronRight className="size-4" />
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
