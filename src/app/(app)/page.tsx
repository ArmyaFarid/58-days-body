import Link from "next/link";
import { Dumbbell, ChevronRight, TrendingUp, TrendingDown, Minus, Scale } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { QuickWeight } from "@/components/quick-weight";
import { HabitChecklist } from "@/components/habit-checklist";
import { getStartDate } from "@/lib/data/settings";
import { getWeights, getWeightForDate, computeTrend } from "@/lib/data/weight";
import { getHabit } from "@/lib/data/habits";
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
    const startDate = (await getStartDate())!;
    const today = todayISO();
    const dayNumber = getDayNumber(startDate, fromISO(today));
    const phase = getPhaseForDay(dayNumber);
    const dayType = getDayTypeForDate(fromISO(today));
    const session = getSession(dayType);
    const training = isTrainingDay(dayType, phase?.key ?? null);

    const [weights, todayWeight, habit] = await Promise.all([
        getWeights(),
        getWeightForDate(today),
        getHabit(today),
    ]);
    const trend = computeTrend(weights);

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
                            <Button render={<Link href="/seance" />} className="h-11">
                                Démarrer la séance
                                <ChevronRight className="size-4" />
                            </Button>
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
