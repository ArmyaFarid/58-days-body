import Link from "next/link";
import { differenceInCalendarDays } from "date-fns";
import { Dumbbell, ChevronRight, TrendingUp, TrendingDown, Minus, Scale, CheckCircle2, UtensilsCrossed, Ruler } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuickWeight } from "@/components/quick-weight";
import { HabitChecklist } from "@/components/habit-checklist";
import { NutritionTracker } from "@/components/nutrition/nutrition-tracker";
import { getSession as getAuthSession } from "@/lib/auth";
import { getStartDate, getNutritionGoals, getSettingsView } from "@/lib/data/settings";
import { getUserProgramId } from "@/lib/data/users";
import { getWeights, getWeightForDate, computeTrend } from "@/lib/data/weight";
import { getHabit } from "@/lib/data/habits";
import { getSessionForDate } from "@/lib/data/workout";
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
import { getProgram, getDayNumber } from "@/lib/program";

function measurementIsDue(dates: string[], today: string): boolean {
    if (dates.length === 0) return true;
    const last = dates[dates.length - 1];
    return differenceInCalendarDays(fromISO(today), fromISO(last)) >= 14;
}

export default async function DashboardPage() {
    const { userId } = (await getAuthSession())!;
    const startDate = (await getStartDate(userId))!;
    const programId = await getUserProgramId(userId);
    const program = getProgram(programId);
    const today = todayISO();
    const dayNumber = getDayNumber(startDate, fromISO(today));
    const phase = program.getPhase(dayNumber);
    const dayType = program.dayTypeForWeekday(fromISO(today).getDay());
    const session = program.sessions[dayType];
    const training = program.isTrainingDay(dayType, phase?.key ?? null);

    const [weights, todayWeight, habit, workoutSession, nutritionGoals, foodEntries, frequentKeys, nutritionHistory, customFoods, customPresets, settingsView, measurements] =
        await Promise.all([
            getWeights(userId),
            getWeightForDate(userId, today),
            getHabit(userId, today),
            getSessionForDate(userId, today),
            getNutritionGoals(userId),
            getLoggedEntries(userId, today),
            getFrequentFoodKeys(userId),
            getNutritionHistory(userId),
            getCustomFoods(userId),
            getCustomPresets(userId),
            getSettingsView(userId),
            program.features.measurementsPrimary ? getMeasurements(userId) : Promise.resolve([]),
        ]);
    const trend = computeTrend(weights, program.trend);
    const sessionDone = workoutSession?.completed === true;
    const meta = habitMetaFor(program);

    const length = program.length;
    const beforeStart = dayNumber < 1;
    const finished = length != null && dayNumber > length;

    // Progression : durée fixe (58 jours) ou vers le poids cible (programme ouvert).
    const targetWeight = program.features.targetWeight ? settingsView.targetWeightKg : null;
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
            </CardContent>
        </Card>
    );

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
            {/* En-tête jour / phase */}
            <section className="pt-2">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-muted-foreground text-sm">{formatShort(today)}</p>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {beforeStart
                                ? "Bientôt"
                                : finished
                                  ? "Terminé 🎉"
                                  : length != null
                                    ? `Jour ${dayNumber} / ${length}`
                                    : `Jour ${dayNumber}`}
                        </h1>
                    </div>
                    {phase ? <Badge variant="secondary">{phase.shortLabel}</Badge> : null}
                </div>

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
