import { startOfWeek, format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickWeight } from "@/components/quick-weight";
import { WeightChart, type WeightPoint } from "@/components/tracking/weight-chart";
import { SuiviTabs } from "./suivi-tabs";
import { getWeights, getWeightForDate, computeWeeklyAverages, computeTrend } from "@/lib/data/weight";
import { todayISO, fromISO } from "@/lib/date";

function Placeholder({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center gap-1 py-12 text-center">
            <p className="text-muted-foreground text-sm">{text}</p>
        </div>
    );
}

async function PoidsSection() {
    const today = todayISO();
    const [weights, todayWeight] = await Promise.all([getWeights(), getWeightForDate(today)]);
    const trend = computeTrend(weights);

    const weekly = computeWeeklyAverages(weights);
    const avgByWeek = new Map(weekly.map((w) => [w.weekStart, w.avg]));
    const chartData: WeightPoint[] = weights.map((w) => ({
        date: w.date,
        weight: w.weightKg,
        weekAvg:
            avgByWeek.get(format(startOfWeek(fromISO(w.date), { weekStartsOn: 1 }), "yyyy-MM-dd")) ??
            null,
    }));

    const delta = trend.deltaPerWeek;

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Pesée du jour</CardTitle>
                </CardHeader>
                <CardContent>
                    <QuickWeight date={today} initial={todayWeight} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Tendance</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex items-baseline gap-6">
                        <div>
                            <p className="text-muted-foreground text-xs">Moy. cette semaine</p>
                            <p className="text-2xl font-semibold">
                                {trend.currentWeekAvg != null
                                    ? `${trend.currentWeekAvg.toFixed(1)} kg`
                                    : "—"}
                            </p>
                        </div>
                        <div>
                            <p className="text-muted-foreground text-xs">Variation / sem.</p>
                            <p className="flex items-center gap-1 text-2xl font-semibold">
                                {delta != null ? (
                                    <>
                                        {delta > 0 ? "+" : ""}
                                        {delta.toFixed(2)} kg
                                        {delta > 0.05 ? (
                                            <TrendingUp className="size-4 text-emerald-500" />
                                        ) : delta < -0.05 ? (
                                            <TrendingDown className="size-4 text-red-500" />
                                        ) : (
                                            <Minus className="text-muted-foreground size-4" />
                                        )}
                                    </>
                                ) : (
                                    "—"
                                )}
                            </p>
                        </div>
                    </div>
                    {trend.suggestionText ? (
                        <p className="bg-muted rounded-lg p-3 text-sm">{trend.suggestionText}</p>
                    ) : (
                        <p className="text-muted-foreground text-sm">
                            Vise +0,25 à 0,35 kg/semaine. (Ignore le +1 kg des 2 premières semaines :
                            créatine + eau.)
                        </p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Courbe</CardTitle>
                </CardHeader>
                <CardContent>
                    <WeightChart data={chartData} />
                </CardContent>
            </Card>
        </div>
    );
}

export default async function SuiviPage() {
    return (
        <SuiviTabs
            poids={<PoidsSection />}
            photos={<Placeholder text="Photos — arrive à l'étape 7." />}
            mensurations={<Placeholder text="Mensurations — arrive à l'étape 8." />}
            historique={<Placeholder text="Historique des perfs — arrive à l'étape 8." />}
        />
    );
}
