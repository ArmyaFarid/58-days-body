import { subDays, format, parseISO } from "date-fns";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitChecklist } from "@/components/habit-checklist";
import { HabitHistoryGrid } from "@/components/habit-history-grid";
import { getHabit, getAllHabits } from "@/lib/data/habits";
import { HABIT_META } from "@/lib/habits-meta";
import { todayISO } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { HabitField } from "@/lib/data/habits";

function computeStreak(trueDates: Set<string>, today: string): number {
    let cursor = today;
    if (!trueDates.has(cursor)) {
        cursor = format(subDays(parseISO(cursor), 1), "yyyy-MM-dd");
    }
    let n = 0;
    while (trueDates.has(cursor)) {
        n++;
        cursor = format(subDays(parseISO(cursor), 1), "yyyy-MM-dd");
    }
    return n;
}

export default async function HabitudesPage() {
    const today = todayISO();
    const [habitToday, all] = await Promise.all([getHabit(today), getAllHabits()]);

    const trueSets: Record<HabitField, Set<string>> = {
        creatine: new Set(),
        kcal3000: new Set(),
        protein140: new Set(),
        sleepBefore23: new Set(),
    };
    for (const d of all) {
        for (const { field } of HABIT_META) {
            if (d[field]) trueSets[field].add(d.date);
        }
    }

    const streaks = HABIT_META.map((h) => ({
        ...h,
        streak: computeStreak(trueSets[h.field], today),
    }));

    const last14 = Array.from({ length: 14 }, (_, i) =>
        format(subDays(parseISO(today), 13 - i), "yyyy-MM-dd"),
    );

    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="pt-2 text-2xl font-bold tracking-tight">Habitudes</h1>

            <div className="grid grid-cols-2 gap-3">
                {streaks.map((s) => (
                    <Card key={s.field}>
                        <CardContent className="flex flex-col gap-1 py-4">
                            <p className="text-muted-foreground text-xs">{s.short}</p>
                            <p className="flex items-center gap-1.5 text-2xl font-bold">
                                <Flame
                                    className={cn(
                                        "size-5",
                                        s.streak > 0 ? "text-orange-500" : "text-muted-foreground",
                                    )}
                                />
                                {s.streak}
                                <span className="text-muted-foreground text-sm font-normal">
                                    {s.streak > 1 ? "jours" : "jour"}
                                </span>
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Aujourd&apos;hui</CardTitle>
                </CardHeader>
                <CardContent>
                    <HabitChecklist date={today} initial={habitToday} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">14 derniers jours</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                    <HabitHistoryGrid
                        days={last14}
                        trueDates={{
                            creatine: [...trueSets.creatine],
                            kcal3000: [...trueSets.kcal3000],
                            protein140: [...trueSets.protein140],
                            sleepBefore23: [...trueSets.sleepBefore23],
                        }}
                    />
                    <p className="text-muted-foreground text-xs">
                        Touche une case pour cocher/décocher un jour passé.
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
