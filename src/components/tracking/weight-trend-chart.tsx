"use client";

import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { cn } from "@/lib/utils";
import { formatShort, fromISO } from "@/lib/date";

interface WeightTrendChartProps {
    today: string;
    points: { date: string; kg: number }[];
}

type Range = "4s" | "3m" | "tout";

const RANGES: { key: Range; label: string; days: number | null }[] = [
    { key: "4s", label: "4 sem.", days: 28 },
    { key: "3m", label: "3 mois", days: 91 },
    { key: "tout", label: "Tout", days: null },
];

const W = 318;
const H = 150;
const TOP = 12;
const BOTTOM = 124;
const LEFT = 6;
const RIGHT = 292;

/** Moyenne glissante sur 7 jours (pesées des 7 derniers jours, inclus). */
function rolling(points: { date: string; kg: number }[]): number[] {
    return points.map((p) => {
        const window = points.filter((q) => {
            const d = differenceInCalendarDays(fromISO(p.date), fromISO(q.date));
            return d >= 0 && d < 7;
        });
        return window.reduce((a, q) => a + q.kg, 0) / window.length;
    });
}

export function WeightTrendChart({ today, points }: WeightTrendChartProps) {
    const [range, setRange] = useState<Range>("4s");
    const days = RANGES.find((r) => r.key === range)?.days ?? null;
    const shown =
        days == null ? points : points.filter((p) => differenceInCalendarDays(fromISO(today), fromISO(p.date)) < days);

    const avg = rolling(points).slice(points.length - shown.length);

    let chart: React.ReactNode;
    if (shown.length < 2) {
        chart = (
            <p className="text-muted-foreground py-10 text-center text-sm">
                Au moins 2 pesées sur la période pour tracer la courbe.
            </p>
        );
    } else {
        const values = [...shown.map((p) => p.kg), ...avg];
        const min = Math.floor(Math.min(...values) * 2) / 2 - 0.5;
        const max = Math.ceil(Math.max(...values) * 2) / 2 + 0.5;
        const first = fromISO(shown[0].date);
        const span = Math.max(1, differenceInCalendarDays(fromISO(shown.at(-1)!.date), first));
        const x = (date: string) => LEFT + (differenceInCalendarDays(fromISO(date), first) / span) * (RIGHT - LEFT);
        const y = (kg: number) => BOTTOM - ((kg - min) / (max - min)) * (BOTTOM - TOP);
        const ticks = [max - (max - min) * 0.15, (max + min) / 2, min + (max - min) * 0.15].map(
            (v) => Math.round(v * 10) / 10,
        );
        const line = shown.map((p, i) => `${x(p.date).toFixed(1)},${y(avg[i]).toFixed(1)}`).join(" ");
        const last = shown.at(-1)!;

        chart = (
            <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full"
                role="img"
                aria-label={`Courbe du poids : de ${shown[0].kg.toFixed(1)} à ${last.kg.toFixed(1)} kg`}
            >
                {ticks.map((t) => (
                    <g key={t}>
                        <line x1={0} x2={W} y1={y(t)} y2={y(t)} className="stroke-muted" />
                        <text x={W} y={y(t) - 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
                            {t.toFixed(1).replace(".", ",")}
                        </text>
                    </g>
                ))}
                {shown.map((p) => (
                    <circle key={p.date} cx={x(p.date)} cy={y(p.kg)} r={2.5} className="fill-muted-foreground/60" />
                ))}
                <polyline
                    points={line}
                    fill="none"
                    className="stroke-brand"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <circle
                    cx={x(last.date)}
                    cy={y(avg.at(-1)!)}
                    r={6}
                    className="fill-brand stroke-card"
                    strokeWidth={3}
                />
                <text x={LEFT} y={H - 4} className="fill-muted-foreground text-[10px]">
                    {formatShort(shown[0].date)}
                </text>
                <text x={RIGHT} y={H - 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
                    {last.date === today ? "auj." : formatShort(last.date)}
                </text>
            </svg>
        );
    }

    return (
        <section className="bg-card flex flex-col gap-3 rounded-[1.25rem] p-4">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-[0.9375rem] font-semibold">Évolution</h2>
                <div className="flex gap-1">
                    {RANGES.map((r) => (
                        <button
                            key={r.key}
                            type="button"
                            onClick={() => setRange(r.key)}
                            aria-pressed={range === r.key}
                            className={cn(
                                "h-8 rounded-[0.625rem] px-2.5 text-xs",
                                range === r.key ? "bg-border font-bold" : "text-muted-foreground font-semibold",
                            )}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>
            {chart}
            <div className="text-muted-foreground flex gap-4 text-xs">
                <span className="flex items-center gap-1.5">
                    <span className="bg-brand h-[3px] w-3.5 rounded-full" />
                    Moyenne 7 jours
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="bg-muted-foreground/60 size-1.5 rounded-full" />
                    Pesée
                </span>
            </div>
        </section>
    );
}
