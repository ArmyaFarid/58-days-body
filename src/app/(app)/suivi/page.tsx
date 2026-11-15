import Link from "next/link";
import { BarChart3 } from "lucide-react";
import { WeightTrendChart } from "@/components/tracking/weight-trend-chart";
import { WeighInCard } from "@/components/tracking/weigh-in-card";
import { PhotosView } from "@/components/tracking/photos-view";
import { MeasurementsView } from "@/components/tracking/measurements-view";
import { PerfHistoryView } from "@/components/tracking/perf-history-view";
import { NutritionDay } from "@/components/nutrition/nutrition-day";
import { SuiviTabs, type SuiviTab } from "./suivi-tabs";
import { getSession } from "@/lib/auth";
import { getWeights, getWeightForDate, computeTrend } from "@/lib/data/weight";
import { getPhotos } from "@/lib/data/photos";
import { getActiveProgram, scheduleContext, type UserProgram } from "@/lib/data/user-programs";
import { getMeasurements, getMeasurementForDate } from "@/lib/data/measurements";
import { getAllExerciseHistories } from "@/lib/data/workout";
import { getNutritionGoals } from "@/lib/data/settings";
import { getLoggedEntries, getFrequentFoodKeys } from "@/lib/data/nutrition";
import { getCustomFoods } from "@/lib/data/custom-foods";
import { getCustomPresets } from "@/lib/data/custom-presets";
import { getExerciseName, TRACTION_KEYS, type Program } from "@/lib/program";
import { todayISO } from "@/lib/date";

function kg(n: number): string {
    return n.toFixed(1).replace(".", ",");
}

async function PoidsSection({ userId, program, row }: { userId: number; program: Program; row: UserProgram }) {
    const today = todayISO();
    const [weights, todayWeight] = await Promise.all([getWeights(userId), getWeightForDate(userId, today)]);
    const trend = computeTrend(weights, program.trend);
    const delta = trend.deltaPerWeek;
    const current = trend.currentWeekAvg ?? trend.latest?.weightKg ?? null;

    const target = program.features.targetWeight ? row.targetWeightKg : null;
    const start = weights[0]?.weightKg ?? null;
    const progress =
        target != null && start != null && current != null && target !== start
            ? Math.min(100, Math.max(0, ((current - start) / (target - start)) * 100))
            : null;

    return (
        <div className="flex flex-col gap-4 pb-4">
            <section className="bg-card flex flex-col gap-3.5 rounded-3xl p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex flex-col gap-1">
                        <span className="text-muted-foreground text-xs font-bold tracking-[0.0625rem] uppercase">
                            {trend.currentWeekAvg != null ? "Moyenne de la semaine" : "Dernière pesée"}
                        </span>
                        <span className="font-heading text-[2.75rem] leading-none font-bold tracking-[-0.0625rem] tabular-nums">
                            {current != null ? kg(current) : "—"}
                            <span className="text-muted-foreground text-lg tracking-normal"> kg</span>
                        </span>
                    </div>
                    {delta != null ? (
                        <span className="bg-brand text-brand-foreground shrink-0 rounded-lg px-2.5 py-[0.3125rem] text-[0.8125rem] font-bold whitespace-nowrap">
                            {delta > 0 ? "+" : delta < 0 ? "−" : ""}
                            {kg(Math.abs(delta))} kg / sem.
                        </span>
                    ) : null}
                </div>
                {progress != null ? (
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[0.8125rem]">
                            <span className="text-muted-foreground">Départ {kg(start!)} kg</span>
                            <span className="font-semibold">Objectif {kg(target!)} kg</span>
                        </div>
                        <div className="bg-border h-2 overflow-hidden rounded-full">
                            <div className="bg-brand h-full rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                ) : null}
                <p className="text-muted-foreground text-[0.8125rem] leading-[1.4]">
                    {trend.suggestionText ?? program.trend.targetText}
                </p>
            </section>

            <WeightTrendChart today={today} points={weights.map((w) => ({ date: w.date, kg: w.weightKg }))} />

            <WeighInCard today={today} todayWeight={todayWeight} />
        </div>
    );
}

async function NutritionSection({
    userId,
    program,
    date,
    openPicker,
}: {
    userId: number;
    program: Program;
    date: string;
    openPicker: boolean;
}) {
    const today = todayISO();
    const [goals, entries, frequentKeys, customFoods, customPresets] = await Promise.all([
        getNutritionGoals(userId),
        getLoggedEntries(userId, date),
        getFrequentFoodKeys(userId),
        getCustomFoods(),
        getCustomPresets(),
    ]);
    return (
        <NutritionDay
            key={date}
            date={date}
            today={today}
            proteinGoal={goals.proteinGoal}
            calorieGoal={goals.calorieGoal}
            fatGoal={program.features.trackFat ? goals.fatGoal : null}
            initialEntries={entries}
            initialCustomFoods={customFoods}
            initialCustomPresets={customPresets}
            frequentKeys={frequentKeys}
            openPicker={openPicker}
        />
    );
}

async function PhotosSection({ userId, startDate }: { userId: number; startDate: string }) {
    const photos = await getPhotos(userId);
    return <PhotosView today={todayISO()} startDate={startDate} photos={photos} />;
}

async function MensurationsSection({ userId, program }: { userId: number; program: Program }) {
    const today = todayISO();
    const [measurements, initial] = await Promise.all([getMeasurements(userId), getMeasurementForDate(userId, today)]);
    return (
        <MeasurementsView
            today={today}
            initial={initial}
            measurements={measurements}
            fields={program.measurementFields}
            note={program.trackingNote}
        />
    );
}

async function HistoriqueSection({ userId, program }: { userId: number; program: Program }) {
    const histories = await getAllExerciseHistories(userId, program);
    const exercises = Object.keys(histories).map((key) => ({ key, name: getExerciseName(key) }));
    return <PerfHistoryView exercises={exercises} histories={histories} tractionKeys={TRACTION_KEYS} />;
}

export default async function SuiviPage({
    searchParams,
}: {
    searchParams: Promise<{ tab?: string; date?: string; noter?: string }>;
}) {
    const { tab, date, noter } = await searchParams;
    const { userId } = (await getSession())!;
    const { program, row } = (await getActiveProgram(userId))!;
    const today = todayISO();
    const nutritionDate = date && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today ? date : today;

    const dayNumber = scheduleContext(row, today).dayNumber;
    const dayInfo =
        program.length != null && dayNumber >= 1 ? (
            <span className="text-muted-foreground text-[0.8125rem]">
                Jour {Math.min(dayNumber, program.length)} sur {program.length}
            </span>
        ) : null;

    const tabs: SuiviTab[] = [
        {
            value: "poids",
            label: "Poids",
            headerRight: dayInfo,
            content: <PoidsSection userId={userId} program={program} row={row} />,
        },
        {
            value: "nutrition",
            label: "Nutrition",
            headerRight: (
                <Link
                    href="/suivi/nutrition/historique"
                    className="bg-card flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold"
                >
                    <BarChart3 className="size-3.5" strokeWidth={2.2} />
                    Historique
                </Link>
            ),
            content: (
                <NutritionSection userId={userId} program={program} date={nutritionDate} openPicker={noter === "1"} />
            ),
        },
        {
            value: "mensurations",
            label: "Mesures",
            headerRight: dayInfo,
            content: <MensurationsSection userId={userId} program={program} />,
        },
        {
            value: "historique",
            label: "Perf",
            headerRight: dayInfo,
            content: <HistoriqueSection userId={userId} program={program} />,
        },
    ];
    // Les photos ne sont proposées que pour les programmes qui les utilisent.
    if (!program.features.measurementsPrimary) {
        tabs.push({
            value: "photos",
            label: "Photos",
            headerRight: dayInfo,
            content: <PhotosSection userId={userId} startDate={row.startDate} />,
        });
    }

    // Programmes dont les mensurations sont l'indicateur clé : on ouvre sur « Mesures ».
    const defaultTab = program.features.measurementsPrimary ? "mensurations" : undefined;
    return <SuiviTabs initialTab={tab ?? defaultTab} tabs={tabs} />;
}
