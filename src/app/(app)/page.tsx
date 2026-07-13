import Link from "next/link";
import { Dumbbell, ChevronRight, TrendingUp, TrendingDown, Minus, Scale, CheckCircle2, UtensilsCrossed } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuickWeight } from "@/components/quick-weight";
import { HabitChecklist } from "@/components/habit-checklist";
import { NutritionTracker } from "@/components/nutrition/nutrition-tracker";
import { getSession as getAuthSession } from "@/lib/auth";
import { getStartDate, getNutritionGoals } from "@/lib/data/settings";
import { getWeights, getWeightForDate, computeTrend } from "@/lib/data/weight";
import { getHabit } from "@/lib/data/habits";
import { getSessionForDate } from "@/lib/data/workout";
import {
    getFoodPortions,
    getFrequentFoodKeys,
    getNutritionHistory,
} from "@/lib/data/nutrition";
import { getCustomFoods } from "@/lib/data/custom-foods";
import { todayISO, fromISO, formatShort } from "@/lib/date";
import {
    getDayNumber,
    getPhaseForDay,
    getDayTypeForDate,
    getSession,
    isTrainingDay,
    PROGRAM_LENGTH,
} from "@/lib/program";

export default async function DashboardPage() {
    const { userId } = (await getAuthSession())!;
    const startDate = (await getStartDate(userId))!;
    const today = todayISO();
    const dayNumber = getDayNumber(startDate, fromISO(today));
    const phase = getPhaseForDay(dayNumber);
    const dayType = getDayTypeForDate(fromISO(today));
    const session = getSession(dayType);
    const training = isTrainingDay(dayType, phase?.key ?? null);

    const [weights, todayWeight, habit, workoutSession, nutritionGoals, foodPortions, frequentKeys, nutritionHistory, customFoods] =
        await Promise.all([
            getWeights(userId),
            getWeightForDate(userId, today),
            getHabit(userId, today),
            getSessionForDate(userId, today),
            getNutritionGoals(userId),
            getFoodPortions(userId, today),
            getFrequentFoodKeys(userId),
            getNutritionHistory(userId),
            getCustomFoods(userId),
        ]);
    const trend = computeTrend(weights);
    const sessionDone = workoutSession?.completed === true;

    const beforeStart = dayNumber < 1;
    const finished = dayNumber > PROGRAM_LENGTH;
    const progress = Math.min(100, Math.max(0, (dayNumber / PROGRAM_LENGTH) * 100));

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
                                  : `Jour ${dayNumber} / ${PROGRAM_LENGTH}`}
                        </h1>
                    </div>
                    {phase ? <Badge variant="secondary">{phase.label}</Badge> : null}
                </div>
                {!beforeStart && !finished ? (
                    <div className="mt-3">
                        <Progress value={progress} />
                        {phase ? (
                            <p className="text-muted-foreground mt-2 text-sm">{phase.description}</p>
                        ) : null}
                    </div>
                ) : beforeStart ? (
                    <p className="text-muted-foreground mt-2 text-sm">
                        Le programme démarre le {formatShort(startDate)}.
                    </p>
                ) : (
                    <p className="text-muted-foreground mt-2 text-sm">
                        58 jours bouclés. Bravo — continue sur ta lancée.
                    </p>
                )}
            </section>

            {/* Séance du jour */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Dumbbell className="size-4" />
                        Séance du jour
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    {training && session.dayType !== "repos" ? (
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
                                    <Button
                                        render={<Link href="/seance" />}
                                        variant="outline"
                                        className="h-11"
                                    >
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
                                    ? "Jour off — cruiser board bienvenu."
                                    : "Pas de séance prévue en délestage aujourd'hui."}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Nutrition du jour */}
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
                        initialPortions={foodPortions}
                        initialCustomFoods={customFoods}
                        frequentKeys={frequentKeys}
                        history={nutritionHistory}
                    />
                </CardContent>
            </Card>

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
                    <HabitChecklist date={today} initial={habit} />
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
