"use client";

import { useEffect, useLayoutEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { addDays, format, startOfWeek } from "date-fns";
import { Check } from "lucide-react";
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
    return (
        target instanceof Element && target.closest("input, textarea, select, [role=dialog], [data-no-swipe]") != null
    );
}

// Navigation entre les jours de /seance : bandeau des semaines (défilement
// horizontal, une semaine à la fois) et balayage gauche/droite sur toute la page.
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

    // Toutes les semaines couvertes par le programme (et celle du jour choisi).
    const known = [...Object.keys(days), today, selected].sort();
    const firstWeek = format(startOfWeek(fromISO(known[0]), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weeks: string[] = [];
    for (let w = firstWeek; w <= known[known.length - 1]; w = shiftISO(w, 7)) weeks.push(w);

    // Amène la semaine du jour choisi à l'écran (sans animation au premier affichage).
    const scroller = useRef<HTMLDivElement>(null);
    const placed = useRef(false);
    useLayoutEffect(() => {
        const el = scroller.current?.querySelector<HTMLElement>(`[data-week="${weekStart}"]`);
        if (!scroller.current || !el) return;
        scroller.current.scrollTo({ left: el.offsetLeft, behavior: placed.current ? "smooth" : "instant" });
        placed.current = true;
    }, [weekStart]);

    // Molette verticale (souris) : passe d'une semaine à l'autre.
    useEffect(() => {
        const el = scroller.current;
        if (!el) return;
        let last = 0;
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
            e.preventDefault();
            const now = Date.now();
            if (now - last < 350 || Math.abs(e.deltaY) < 4) return;
            last = now;
            el.scrollBy({ left: Math.sign(e.deltaY) * el.clientWidth, behavior: "smooth" });
        };
        el.addEventListener("wheel", onWheel, { passive: false });
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    return (
        <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex min-h-full touch-pan-y flex-col">
            <div className="px-5 pt-4">
                <div
                    ref={scroller}
                    data-no-swipe
                    className="relative flex snap-x snap-mandatory gap-1.5 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    {weeks.map((w) => (
                        <div key={w} data-week={w} className="grid w-full shrink-0 snap-start grid-cols-7 gap-1.5">
                            {Array.from({ length: 7 }, (_, i) => shiftISO(w, i)).map((d) => (
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
                    ))}
                </div>
            </div>

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

interface DayPillProps {
    date: string;
    info: DayInfo | undefined;
    selected: boolean;
    isToday: boolean;
    onSelect: () => void;
}

function DayPill({ date, info, selected, isToday, onSelect }: DayPillProps) {
    const rest = info != null && !info.training;
    return (
        <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            aria-label={`${fmt(date, { weekday: "long", day: "numeric", month: "long" })} — ${
                info ? (info.done ? `${info.title}, faite` : info.title) : "hors programme"
            }`}
            className={cn(
                "flex h-16 flex-col items-center justify-center gap-px rounded-[0.875rem] transition-colors duration-200 active:scale-95",
                selected ? "bg-brand text-brand-foreground" : "bg-card",
                isToday && !selected && "ring-brand/70 ring-1 ring-inset",
                rest && !selected && "text-muted-foreground",
                !info && !selected && "opacity-40",
            )}
        >
            <span className="text-[0.6875rem] font-semibold uppercase opacity-80">
                {fmt(date, { weekday: "narrow" })}
            </span>
            <span className="font-heading text-[1.0625rem] leading-tight font-bold tabular-nums">
                {fromISO(date).getDate()}
            </span>
            <span className="flex h-3 items-center">
                {info?.done ? (
                    <Check className={cn("size-3", selected ? "" : "text-brand")} strokeWidth={3.5} />
                ) : info?.training ? (
                    <span
                        className={cn(
                            "size-[5px] rounded-full",
                            selected ? "bg-brand-foreground" : "bg-muted-foreground",
                        )}
                    />
                ) : null}
            </span>
        </button>
    );
}
