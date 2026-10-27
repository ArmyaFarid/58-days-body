"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, format, startOfWeek } from "date-fns";
import { CalendarDays, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { fromISO } from "@/lib/date";

export interface DayInfo {
    training: boolean;
    title: string;
    done: boolean;
}

interface SeanceDayNavProps {
    today: string;
    days: Record<string, DayInfo>;
    children: React.ReactNode;
}

const SWIPE_MIN_PX = 60;

function shiftISO(date: string, n: number): string {
    return format(addDays(fromISO(date), n), "yyyy-MM-dd");
}

function fmt(date: string, options: Intl.DateTimeFormatOptions): string {
    return new Intl.DateTimeFormat("fr-CA", options).format(fromISO(date));
}

function isSwipeIgnored(target: EventTarget | null): boolean {
    return target instanceof Element && target.closest("input, textarea, select, [role=dialog], [data-no-swipe]") != null;
}

// Navigation entre les jours de /seance : bandeau de la semaine, flèches,
// calendrier natif et balayage gauche/droite sur toute la page.
export function SeanceDayNav({ today, days, children }: SeanceDayNavProps) {
    const router = useRouter();
    const raw = useSearchParams().get("date");
    const date = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
    const [pending, startTransition] = useTransition();
    const [selected, setSelected] = useOptimistic(date);
    const touch = useRef<{ x: number; y: number } | null>(null);

    // Sens de l'animation : on compare au jour affiché précédemment.
    const [shown, setShown] = useState(date);
    const [direction, setDirection] = useState(0);
    if (shown !== date) {
        setDirection(date > shown ? 1 : -1);
        setShown(date);
    }

    function go(next: string) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(next) || next === selected) return;
        startTransition(() => {
            setSelected(next);
            router.push(next === today ? "/seance" : `/seance?date=${next}`);
        });
    }

    function onTouchStart(e: React.TouchEvent) {
        const t = e.touches[0];
        touch.current = isSwipeIgnored(e.target) ? null : { x: t.clientX, y: t.clientY };
    }

    function onTouchEnd(e: React.TouchEvent) {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - start.x;
        const dy = t.clientY - start.y;
        if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy) * 2) return;
        go(shiftISO(selected, dx < 0 ? 1 : -1));
    }

    const weekStart = format(startOfWeek(fromISO(selected), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const week = Array.from({ length: 7 }, (_, i) => shiftISO(weekStart, i));
    const info = days[selected];
    const status =
        selected > today ? "À venir" : info?.done ? "Faite" : selected === today ? "Aujourd'hui" : null;

    return (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex min-h-full flex-col">
            <section className="bg-card mx-4 mt-4 rounded-2xl border p-3 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold capitalize">{fmt(selected, { month: "long", year: "numeric" })}</p>
                    <div className="flex items-center gap-1">
                        {selected !== today ? (
                            <button
                                type="button"
                                onClick={() => go(today)}
                                className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-medium transition-colors active:bg-primary/20"
                            >
                                Aujourd&apos;hui
                            </button>
                        ) : null}
                        {/* Le champ date transparent couvre l'icône : ouvre le calendrier natif. */}
                        <label className="text-muted-foreground hover:bg-muted relative flex size-9 items-center justify-center rounded-full transition-colors">
                            <CalendarDays className="size-5" />
                            <span className="sr-only">Choisir un jour</span>
                            <input
                                type="date"
                                value={selected}
                                onChange={(e) => go(e.target.value)}
                                className="absolute inset-0 cursor-pointer opacity-0"
                            />
                        </label>
                    </div>
                </div>

                <div className="mt-2 flex items-center gap-1">
                    <DayArrow label="Jour précédent" onClick={() => go(shiftISO(selected, -1))}>
                        <ChevronLeft className="size-5" />
                    </DayArrow>
                    <div
                        key={weekStart}
                        className={cn(
                            "animate-in fade-in grid flex-1 grid-cols-7 gap-1 duration-300",
                            direction > 0 && "slide-in-from-right-4",
                            direction < 0 && "slide-in-from-left-4",
                        )}
                    >
                        {week.map((d) => (
                            <DayPill
                                key={d}
                                date={d}
                                info={days[d]}
                                selected={d === selected}
                                isToday={d === today}
                                onSelect={() => go(d)}
                            />
                        ))}
                    </div>
                    <DayArrow label="Jour suivant" onClick={() => go(shiftISO(selected, 1))}>
                        <ChevronRight className="size-5" />
                    </DayArrow>
                </div>

                <div className="mt-3 flex items-center justify-center gap-2 text-sm">
                    <span className="text-muted-foreground first-letter:uppercase">
                        {fmt(selected, { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    <span className="text-muted-foreground/50">·</span>
                    <span className="truncate font-medium">{info?.title ?? "Hors programme"}</span>
                    {status ? (
                        <span
                            className={cn(
                                "shrink-0 rounded-full px-2 py-0.5 text-[0.7rem] font-medium",
                                info?.done ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground",
                            )}
                        >
                            {status}
                        </span>
                    ) : null}
                </div>
            </section>

            <div
                key={date}
                className={cn(
                    "animate-in fade-in flex-1 transition-opacity duration-300",
                    direction > 0 && "slide-in-from-right-8",
                    direction < 0 && "slide-in-from-left-8",
                    pending && "opacity-50",
                )}
            >
                {children}
            </div>
        </div>
    );
}

function DayArrow({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={label}
            className="text-muted-foreground hover:bg-muted flex size-8 shrink-0 items-center justify-center rounded-full transition-colors active:scale-90"
        >
            {children}
        </button>
    );
}

interface DayPillProps {
    date: string;
    info: DayInfo | undefined;
    selected: boolean;
    isToday: boolean;
    onSelect: () => void;
}

function DayPill({ date, info, selected, isToday, onSelect }: DayPillProps) {
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            aria-label={`${fmt(date, { weekday: "long", day: "numeric", month: "long" })} — ${info?.title ?? "hors programme"}`}
            className={cn(
                "flex flex-col items-center gap-0.5 rounded-xl py-1.5 transition-all duration-200 active:scale-95",
                selected ? "bg-primary text-primary-foreground scale-105 shadow-md" : "hover:bg-muted",
                isToday && !selected && "ring-primary/60 ring-1",
                !info && !selected && "opacity-40",
            )}
        >
            <span className={cn("text-[0.65rem] font-medium uppercase", selected ? "opacity-80" : "text-muted-foreground")}>
                {fmt(date, { weekday: "narrow" })}
            </span>
            <span className="text-base font-semibold tabular-nums leading-none">{fromISO(date).getDate()}</span>
            <span className="flex h-3 items-center">
                {info?.done ? (
                    <Check className={cn("size-3 stroke-[3]", selected ? "" : "text-primary")} />
                ) : info?.training ? (
                    <span className={cn("size-1.5 rounded-full", selected ? "bg-primary-foreground" : "bg-primary")} />
                ) : null}
            </span>
        </button>
    );
}
