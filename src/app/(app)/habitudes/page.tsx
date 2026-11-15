import Link from "next/link";
import { subDays, format, parseISO } from "date-fns";
import { ChevronLeft, Flame } from "lucide-react";
import { HabitChecklist } from "@/components/habit-checklist";
import { HabitHistoryGrid } from "@/components/habit-history-grid";
import { getSession } from "@/lib/auth";
import { getHabit, getAllHabits } from "@/lib/data/habits";
import { getSessionForDate } from "@/lib/data/workout";
import { getActiveProgram } from "@/lib/data/user-programs";
import { habitMetaFor } from "@/lib/habits-meta";
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
    const { userId } = (await getSession())!;
    const today = todayISO();
    const { program, row } = (await getActiveProgram(userId))!;
    const [habitToday, all, workoutToday] = await Promise.all([
        getHabit(userId, today),
        getAllHabits(userId),
        getSessionForDate(userId, program, today),
    ]);
    const meta = habitMetaFor(program, { creatine: row.creatine });

    const trueSets: Record<HabitField, Set<string>> = {
        creatine: new Set(),
        kcal3000: new Set(),
        protein140: new Set(),
        sleepBefore23: new Set(),
    };
    for (const d of all) {
        for (const { field } of meta) {
            if (d[field]) trueSets[field].add(d.date);
        }
    }

    const streaks = meta.map((h) => ({
        ...h,
        streak: computeStreak(trueSets[h.field], today),
    }));

    const last14 = Array.from({ length: 14 }, (_, i) => format(subDays(parseISO(today), 13 - i), "yyyy-MM-dd"));

    return (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-4">
            <div className="flex items-center gap-3">
                <Link
                    href="/"
                    aria-label="Retour à l’accueil"
                    className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                >
                    <ChevronLeft className="size-5" strokeWidth={2.4} />
                </Link>
                <h1 className="font-heading text-[1.75rem] font-bold tracking-[-0.03125rem]">Habitudes</h1>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                {streaks.map((s) => (
                    <div key={s.field} className="bg-card flex flex-col gap-1.5 rounded-[1.25rem] p-4">
                        <span className="text-muted-foreground text-[0.8125rem]">{s.short}</span>
                        <span className="font-heading flex items-center gap-1.5 text-[1.625rem] leading-tight font-bold tabular-nums">
                            <Flame className={cn("size-5", s.streak > 0 ? "text-streak" : "text-muted-foreground")} />
                            {s.streak}
                            <span className="text-muted-foreground font-sans text-sm font-medium">
                                {s.streak > 1 ? "jours" : "jour"}
                            </span>
                        </span>
                    </div>
                ))}
            </div>

            <section className="bg-card rounded-[1.25rem] p-4">
                <HabitChecklist
                    date={today}
                    initial={habitToday}
                    meta={meta}
                    showSession={program.features.sessionHabit}
                    sessionDone={workoutToday?.completed === true}
                    compact
                />
            </section>

            <section className="bg-card flex flex-col gap-3 rounded-[1.25rem] p-4">
                <h2 className="text-[0.9375rem] font-semibold">14 derniers jours</h2>
                <HabitHistoryGrid
                    days={last14}
                    meta={meta}
                    trueDates={{
                        creatine: [...trueSets.creatine],
                        kcal3000: [...trueSets.kcal3000],
                        protein140: [...trueSets.protein140],
                        sleepBefore23: [...trueSets.sleepBefore23],
                    }}
                />
                <p className="text-muted-foreground text-xs">Touche une case pour cocher ou décocher un jour passé.</p>
            </section>
        </div>
    );
}
