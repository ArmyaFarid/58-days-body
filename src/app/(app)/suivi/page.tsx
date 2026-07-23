import { startOfWeek, format } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { QuickWeight } from "@/components/quick-weight";
import { WeightChart, type WeightPoint } from "@/components/tracking/weight-chart";
import { PhotosView } from "@/components/tracking/photos-view";
import { MeasurementsView } from "@/components/tracking/measurements-view";
import { PerfHistoryView } from "@/components/tracking/perf-history-view";
import { SuiviTabs, type SuiviTab } from "./suivi-tabs";
import { getSession } from "@/lib/auth";
import { getWeights, getWeightForDate, computeWeeklyAverages, computeTrend } from "@/lib/data/weight";
import { getPhotos } from "@/lib/data/photos";
import { getStartDate } from "@/lib/data/settings";
import { getUserProgramId } from "@/lib/data/users";
import { getMeasurements, getMeasurementForDate } from "@/lib/data/measurements";
import { getAllExerciseHistories } from "@/lib/data/workout";
import { getExerciseName, TRACTION_KEYS, getProgram, type Program } from "@/lib/program";
import { todayISO, fromISO } from "@/lib/date";

async function PoidsSection({ userId, program }: { userId: number; program: Program }) {
    const today = todayISO();
    const [weights, todayWeight] = await Promise.all([
        getWeights(userId),
        getWeightForDate(userId, today),
    ]);
    const trend = computeTrend(weights, program.trend);

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
                    <CardTitle className="text-base">Ajouter une pesée</CardTitle>
                </CardHeader>
                <CardContent>
                    <QuickWeight date={today} initial={todayWeight} allowDateChange />
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
                        <p className="text-muted-foreground text-sm">{program.trend.targetText}</p>
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

async function PhotosSection({ userId }: { userId: number }) {
    const [photos, startDate] = await Promise.all([getPhotos(userId), getStartDate(userId)]);
    return <PhotosView today={todayISO()} startDate={startDate} photos={photos} />;
}

async function MensurationsSection({ userId, showNote }: { userId: number; showNote: boolean }) {
    const today = todayISO();
    const [measurements, initial] = await Promise.all([
        getMeasurements(userId),
        getMeasurementForDate(userId, today),
    ]);
    return (
        <div className="flex flex-col gap-4">
            {showNote ? (
                <Card className="border-primary/30 bg-primary/5">
                    <CardContent className="py-3 text-sm">
                        Le tour de hanches et de cuisse racontent mieux ta progression que la balance.
                        Un autre bon repère : réessaye un vêtement ajusté toutes les 2 semaines.
                    </CardContent>
                </Card>
            ) : null}
            <MeasurementsView today={today} initial={initial} measurements={measurements} />
        </div>
    );
}

async function HistoriqueSection({ userId }: { userId: number }) {
    const histories = await getAllExerciseHistories(userId);
    const exercises = Object.keys(histories).map((key) => ({ key, name: getExerciseName(key) }));
    return (
        <PerfHistoryView
            exercises={exercises}
            histories={histories}
            tractionKeys={TRACTION_KEYS}
        />
    );
}

export default async function SuiviPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string }>;
}) {
    const { tab } = await searchParams;
    const { userId } = (await getSession())!;
    const program = getProgram(await getUserProgramId(userId));
    const { features } = program;

    const poidsTab: SuiviTab = {
        value: "poids",
        label: "Poids",
        content: <PoidsSection userId={userId} program={program} />,
    };
    const mensurationsTab: SuiviTab = {
        value: "mensurations",
        label: "Mensur.",
        content: (
            <MensurationsSection userId={userId} showNote={features.measurementsPrimary} />
        ),
    };
    const perfTab: SuiviTab = {
        value: "historique",
        label: "Perf",
        content: <HistoriqueSection userId={userId} />,
    };
    const photosTab: SuiviTab = {
        value: "photos",
        label: "Photos",
        content: <PhotosSection userId={userId} />,
    };

    // Mensurations en premier pour les programmes qui en font l'indicateur clé ;
    // les photos ne sont proposées que si le programme les active.
    const tabs: SuiviTab[] = features.measurementsPrimary
        ? [mensurationsTab, poidsTab, perfTab]
        : [poidsTab, photosTab, mensurationsTab, perfTab];

    return <SuiviTabs initialTab={tab} tabs={tabs} />;
}
