"use client";

import { useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatShort, fromISO } from "@/lib/date";
import type { Measurement } from "@/lib/data/measurements";
import type { MeasurementKey } from "@/lib/program";
import { MEASUREMENT_LABELS as LABELS } from "./body-silhouette";
import { MeasureWizard } from "./measure-wizard";

// Tour de taille : une baisse est un progrès ; ailleurs, une hausse.
const LOWER_IS_BETTER: MeasurementKey[] = ["waist"];

const DEFAULT_FIELDS: MeasurementKey[] = ["shoulders", "chest", "arm", "waist", "thigh"];

const EVERY_DAYS = 14;

interface MeasurementsViewProps {
    today: string;
    initial: Measurement | null;
    measurements: Measurement[];
    /** Mensurations proposées, dans l'ordre (défaut : celles du programme 58). */
    fields?: MeasurementKey[];
    note?: string;
}

function cm(n: number): string {
    return n.toFixed(1).replace(".", ",");
}

function sparkline(values: number[], width: number, height: number): string {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const step = values.length > 1 ? (width - 8) / (values.length - 1) : 0;
    return values
        .map(
            (v, i) =>
                `${(4 + i * step).toFixed(1)},${(height - 4 - ((v - min) / (max - min || 1)) * (height - 8)).toFixed(1)}`,
        )
        .join(" ");
}

export function MeasurementsView({
    today,
    initial,
    measurements,
    fields = DEFAULT_FIELDS,
    note,
}: MeasurementsViewProps) {
    const [metric, setMetric] = useState<MeasurementKey>(fields[0]);
    const [measuring, setMeasuring] = useState(false);

    const series = (key: MeasurementKey) =>
        measurements.filter((m) => m[key] != null).map((m) => ({ date: m.date, value: m[key] as number }));

    const lastDate = measurements.at(-1)?.date ?? null;
    const sinceLast = lastDate ? differenceInCalendarDays(fromISO(today), fromISO(lastDate)) : null;
    const due = sinceLast == null || sinceLast >= EVERY_DAYS;

    const selected = series(metric).slice(-6);

    return (
        <div className="flex flex-col gap-4 pb-4">
            <section
                className={cn(
                    "bg-card flex items-center gap-3 rounded-[1.25rem] px-4 py-3.5",
                    due && "border-streak/30 border",
                )}
            >
                <CalendarDays className={cn("size-7 shrink-0", due ? "text-streak" : "text-muted-foreground")} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[0.9375rem] font-semibold">
                        {due ? "À mesurer aujourd’hui" : `Prochaine mesure dans ${EVERY_DAYS - sinceLast!} j`}
                    </span>
                    <span className="text-muted-foreground text-[0.8125rem]">
                        Toutes les 2 semaines{lastDate ? ` · dernière le ${formatShort(lastDate)}` : ""}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={() => setMeasuring(true)}
                    className={cn(
                        "h-11 shrink-0 rounded-[0.875rem] px-4 text-sm font-bold",
                        due ? "bg-brand text-brand-foreground" : "bg-muted",
                    )}
                >
                    Mesurer
                </button>
            </section>

            <div className="grid grid-cols-2 gap-2.5">
                {fields.map((key) => {
                    const s = series(key);
                    const last = s.at(-1)?.value ?? null;
                    const delta = s.length > 1 ? last! - s[0].value : null;
                    const good = delta != null && (LOWER_IS_BETTER.includes(key) ? delta < 0 : delta > 0);
                    const active = key === metric;
                    return (
                        <button
                            key={key}
                            type="button"
                            onClick={() => setMetric(key)}
                            aria-pressed={active}
                            className={cn(
                                "bg-card flex flex-col items-start gap-1.5 rounded-[1.125rem] border-2 p-3.5 text-left",
                                active ? "border-brand" : "border-transparent",
                            )}
                        >
                            <span className="flex w-full items-center justify-between gap-2">
                                <span className="text-muted-foreground text-[0.8125rem]">{LABELS[key]}</span>
                                {delta != null && Math.abs(delta) >= 0.05 ? (
                                    <span
                                        className={cn(
                                            "text-xs font-bold",
                                            good
                                                ? "bg-brand text-brand-foreground rounded-md px-1.5 py-0.5"
                                                : "text-streak",
                                        )}
                                    >
                                        {delta > 0 ? "+" : "−"}
                                        {cm(Math.abs(delta))}
                                    </span>
                                ) : null}
                            </span>
                            <span className="font-heading text-2xl font-bold tabular-nums">
                                {last != null ? cm(last) : "—"}
                                <span className="text-muted-foreground text-[0.8125rem]"> cm</span>
                            </span>
                            {s.length > 1 ? (
                                <svg viewBox="0 0 130 26" className="h-[26px] w-full" aria-hidden>
                                    <polyline
                                        points={sparkline(
                                            s.map((p) => p.value),
                                            130,
                                            26,
                                        )}
                                        fill="none"
                                        className={active ? "stroke-brand" : "stroke-muted-foreground/60"}
                                        strokeWidth={2.5}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            ) : (
                                <span className="h-[26px]" />
                            )}
                        </button>
                    );
                })}
            </div>

            <section className="bg-card flex flex-col gap-2.5 rounded-[1.25rem] p-4">
                <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-[0.9375rem] font-semibold">{LABELS[metric]}</h2>
                    {selected.length > 1 ? (
                        <span className="text-muted-foreground text-[0.8125rem]">
                            {cm(selected[0].value)} → {cm(selected.at(-1)!.value)} cm
                        </span>
                    ) : null}
                </div>
                {selected.length > 1 ? (
                    <MeasureChart points={selected} today={today} />
                ) : (
                    <p className="text-muted-foreground py-4 text-sm">
                        {selected.length === 1 ? "Une 2ᵉ mesure tracera la courbe." : "Aucune mesure pour l’instant."}
                    </p>
                )}
            </section>

            {measuring ? (
                <MeasureWizard
                    today={today}
                    fields={fields}
                    initial={initial}
                    last={Object.fromEntries(
                        fields.map((k) => [k, series(k).at(-1)?.value]).filter(([, v]) => v != null),
                    )}
                    onClose={() => setMeasuring(false)}
                />
            ) : null}

            {note ? <p className="text-muted-foreground text-[0.8125rem] leading-relaxed">{note}</p> : null}
        </div>
    );
}

function MeasureChart({ points, today }: { points: { date: string; value: number }[]; today: string }) {
    const min = Math.min(...points.map((p) => p.value)) - 0.5;
    const max = Math.max(...points.map((p) => p.value)) + 0.5;
    const step = (318 - 32) / (points.length - 1);
    const pts = points.map((p, i) => ({ ...p, x: 16 + i * step, y: 70 - ((p.value - min) / (max - min)) * 58 }));
    return (
        <svg viewBox="0 0 318 96" className="w-full" role="img" aria-label="Évolution de la mesure choisie">
            <line x1={0} x2={318} y1={80} y2={80} className="stroke-muted" />
            <polyline
                points={pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")}
                fill="none"
                className="stroke-brand"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {pts.map((p) => (
                <g key={p.date}>
                    <circle cx={p.x} cy={p.y} r={5} className="fill-brand stroke-card" strokeWidth={2} />
                    <text x={p.x} y={94} textAnchor="middle" className="fill-muted-foreground text-[10px]">
                        {p.date === today
                            ? "auj."
                            : new Intl.DateTimeFormat("fr-CA", { day: "numeric", month: "short" }).format(
                                  fromISO(p.date),
                              )}
                    </text>
                </g>
            ))}
        </svg>
    );
}
