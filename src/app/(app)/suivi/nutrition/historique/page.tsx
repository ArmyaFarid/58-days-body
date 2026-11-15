import Link from "next/link";
import { addDays, format } from "date-fns";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";
import { getSession } from "@/lib/auth";
import { getActiveProgram } from "@/lib/data/user-programs";
import { getNutritionGoals } from "@/lib/data/settings";
import { getNutritionHistory } from "@/lib/data/nutrition";
import { todayISO, fromISO } from "@/lib/date";
import { cn } from "@/lib/utils";

function longDay(date: string, today: string): string {
    if (date === today) return "Aujourd’hui";
    return new Intl.DateTimeFormat("fr-CA", { weekday: "long", day: "numeric", month: "short" }).format(fromISO(date));
}

export default async function NutritionHistoryPage() {
    const { userId } = (await getSession())!;
    const { program } = (await getActiveProgram(userId))!;
    const today = todayISO();
    const [goals, history] = await Promise.all([getNutritionGoals(userId), getNutritionHistory(userId, 30)]);
    const byDate = new Map(history.map((d) => [d.date, d]));

    // 7 derniers jours calendaires (un jour sans saisie compte pour 0).
    const week = Array.from({ length: 7 }, (_, i) => format(addDays(fromISO(today), i - 6), "yyyy-MM-dd")).map(
        (date) => ({
            date,
            protein: byDate.get(date)?.protein ?? 0,
            calories: byDate.get(date)?.calories ?? 0,
            logged: byDate.has(date),
        }),
    );
    const proteinHit = week.filter((d) => d.protein >= goals.proteinGoal).length;
    const logged = week.filter((d) => d.logged && d.date !== today);
    const avgCalories = logged.length ? Math.round(logged.reduce((a, d) => a + d.calories, 0) / logged.length) : null;
    const gap = avgCalories != null ? avgCalories - goals.calorieGoal : null;
    const scale = Math.max(goals.calorieGoal * 1.1, ...week.map((d) => d.calories));
    const goalLine = (goals.calorieGoal / scale) * 128;

    return (
        <div className="flex flex-col gap-4 px-5 pt-4 pb-4">
            <div className="flex items-center gap-3">
                <Link
                    href="/suivi?tab=nutrition"
                    aria-label="Retour à la nutrition du jour"
                    className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                >
                    <ChevronLeft className="size-5" strokeWidth={2.4} />
                </Link>
                <h1 className="font-heading text-[1.75rem] font-bold tracking-[-0.03125rem]">Historique</h1>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
                <section className="bg-card flex flex-col gap-1.5 rounded-[1.25rem] p-4">
                    <span className="text-muted-foreground text-[0.8125rem]">Protéines atteintes</span>
                    <span className="font-heading text-[1.75rem] leading-tight font-bold tabular-nums">
                        {proteinHit}
                        <span className="text-muted-foreground text-[0.9375rem]"> / 7 jours</span>
                    </span>
                    <div className="grid grid-cols-7 gap-[3px]">
                        {week.map((d) => (
                            <span
                                key={d.date}
                                className={cn(
                                    "h-1.5 rounded-full",
                                    d.protein >= goals.proteinGoal ? "bg-brand" : "bg-border",
                                )}
                            />
                        ))}
                    </div>
                </section>
                <section className="bg-card flex flex-col gap-1.5 rounded-[1.25rem] p-4">
                    <span className="text-muted-foreground text-[0.8125rem]">Moyenne calories</span>
                    <span className="font-heading text-[1.75rem] leading-tight font-bold tabular-nums">
                        {avgCalories != null ? avgCalories.toLocaleString("fr-FR") : "—"}
                    </span>
                    {gap != null ? (
                        <span className={cn("text-xs font-semibold", gap < 0 ? "text-streak" : "text-primary")}>
                            {gap < 0 ? "−" : "+"}
                            {Math.abs(gap).toLocaleString("fr-FR")} kcal / objectif
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-xs">Pas encore de jour complet</span>
                    )}
                </section>
            </div>

            <section className="bg-card flex flex-col gap-3 rounded-[1.25rem] p-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-[0.9375rem] font-semibold">Calories · 7 derniers jours</h2>
                    <span className="text-muted-foreground text-xs">
                        objectif {goals.calorieGoal.toLocaleString("fr-FR")}
                    </span>
                </div>
                <div className="relative flex h-[9.375rem] items-end gap-2.5 pb-[22px]">
                    <div
                        className="border-muted-foreground/60 absolute inset-x-0 border-t-2 border-dashed"
                        style={{ bottom: `${22 + goalLine}px` }}
                    />
                    {week.map((d) => (
                        <div key={d.date} className="relative flex flex-1 flex-col items-center">
                            <div
                                className={cn(
                                    "w-full rounded-lg",
                                    d.date === today
                                        ? "bg-muted-foreground/60"
                                        : d.calories >= goals.calorieGoal * 0.95
                                          ? "bg-brand"
                                          : "bg-border",
                                )}
                                style={{ height: `${Math.max(4, Math.round((d.calories / scale) * 128))}px` }}
                            />
                            <span className="text-muted-foreground absolute -bottom-5 text-[0.6875rem] font-semibold uppercase">
                                {new Intl.DateTimeFormat("fr-CA", { weekday: "narrow" }).format(fromISO(d.date))}
                            </span>
                        </div>
                    ))}
                </div>
            </section>

            <div className="flex flex-col gap-2">
                {history.map((d) => {
                    const hit = d.protein >= goals.proteinGoal;
                    return (
                        <Link
                            key={d.date}
                            href={d.date === today ? "/suivi?tab=nutrition" : `/suivi?tab=nutrition&date=${d.date}`}
                            className="bg-card flex items-center gap-3 rounded-2xl px-3.5 py-3"
                        >
                            <span
                                className={cn(
                                    "flex size-8 shrink-0 items-center justify-center rounded-[0.625rem] text-sm font-bold",
                                    hit ? "bg-brand text-brand-foreground" : "bg-border text-muted-foreground",
                                )}
                            >
                                {hit ? <Check className="size-4" strokeWidth={3} /> : "–"}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="text-sm font-semibold first-letter:uppercase">
                                    {longDay(d.date, today)}
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {d.protein} g prot · {d.calories.toLocaleString("fr-FR")} kcal
                                </span>
                            </span>
                            <ChevronRight className="text-muted-foreground/60 size-[18px]" strokeWidth={2.4} />
                        </Link>
                    );
                })}
                {history.length === 0 ? (
                    <p className="text-muted-foreground py-6 text-center text-sm">Aucun repas noté pour l’instant.</p>
                ) : null}
            </div>

            {program.nutritionNote ? (
                <p className="text-muted-foreground text-xs leading-relaxed">{program.nutritionNote}</p>
            ) : null}
        </div>
    );
}
