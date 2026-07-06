import { subDays, format, parseISO } from "date-fns";
import { Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HabitChecklist } from "@/components/habit-checklist";
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
                    {HABIT_META.map((h) => (
                        <div key={h.field} className="flex items-center gap-2">
                            <span className="text-muted-foreground w-16 shrink-0 text-xs">
                                {h.short}
                            </span>
                            <div className="flex flex-1 gap-1">
                                {last14.map((d) => (
                                    <span
                                        key={d}
                                        title={d}
                                        className={cn(
                                            "h-4 flex-1 rounded-sm",
                                            trueSets[h.field].has(d)
                                                ? "bg-primary"
                                                : "bg-muted",
                                        )}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}
