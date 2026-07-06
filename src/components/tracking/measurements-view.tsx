"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { upsertMeasurementAction } from "@/lib/actions";
import type { Measurement } from "@/lib/data/measurements";

const METRICS = [
    { key: "shoulders", label: "Épaules" },
    { key: "chest", label: "Poitrine" },
    { key: "arm", label: "Bras fléchi" },
    { key: "waist", label: "Taille" },
    { key: "thigh", label: "Cuisse" },
] as const;

type MetricKey = (typeof METRICS)[number]["key"];

interface MeasurementsViewProps {
    today: string;
    initial: Measurement | null;
    measurements: Measurement[];
}

export function MeasurementsView({ today, initial, measurements }: MeasurementsViewProps) {
    const router = useRouter();
    const [values, setValues] = useState<Record<MetricKey, string>>(() => ({
        shoulders: initial?.shoulders != null ? String(initial.shoulders) : "",
        chest: initial?.chest != null ? String(initial.chest) : "",
        arm: initial?.arm != null ? String(initial.arm) : "",
        waist: initial?.waist != null ? String(initial.waist) : "",
        thigh: initial?.thigh != null ? String(initial.thigh) : "",
    }));
    const [metric, setMetric] = useState<MetricKey>("shoulders");
    const [day, setDay] = useState(today);
    const [pending, startTransition] = useTransition();

    function parse(v: string): number | null {
        const n = parseFloat(v.replace(",", "."));
        return Number.isFinite(n) && n > 0 ? n : null;
    }

    function onSave() {
        startTransition(async () => {
            try {
                await upsertMeasurementAction({
                    date: day,
                    shoulders: parse(values.shoulders),
                    chest: parse(values.chest),
                    arm: parse(values.arm),
                    waist: parse(values.waist),
                    thigh: parse(values.thigh),
                });
                toast.success("Mensurations enregistrées.");
                router.refresh();
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    const chartData = measurements
        .filter((m) => m[metric] != null)
        .map((m) => ({ date: m.date, value: m[metric] as number }));

    return (
        <div className="flex flex-col gap-4">
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Saisie (cm) — aux 2 semaines</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="measure-date" className="text-xs">
                            Date
                        </Label>
                        <Input
                            id="measure-date"
                            type="date"
                            max={today}
                            value={day}
                            onChange={(e) => setDay(e.target.value)}
                            className="h-10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {METRICS.map((m) => (
                            <div key={m.key} className="flex flex-col gap-1">
                                <Label htmlFor={m.key} className="text-xs">
                                    {m.label}
                                </Label>
                                <Input
                                    id={m.key}
                                    type="number"
                                    inputMode="decimal"
                                    step="0.1"
                                    value={values[m.key]}
                                    onChange={(e) =>
                                        setValues((v) => ({ ...v, [m.key]: e.target.value }))
                                    }
                                    className="h-10"
                                />
                            </div>
                        ))}
                    </div>
                    <Button onClick={onSave} disabled={pending} className="h-11">
                        {pending ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Évolution</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-1.5">
                        {METRICS.map((m) => (
                            <button
                                key={m.key}
                                onClick={() => setMetric(m.key)}
                                className={cn(
                                    "rounded-full px-3 py-1 text-sm transition-colors",
                                    metric === m.key
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted",
                                )}
                            >
                                {m.label}
                            </button>
                        ))}
                    </div>
                    {chartData.length > 0 ? (
                        <div className="h-56 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={chartData}
                                    margin={{ left: -16, right: 8, top: 8, bottom: 0 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(d: string) => d.slice(5).replace("-", "/")}
                                        fontSize={11}
                                        stroke="var(--muted-foreground)"
                                        minTickGap={24}
                                    />
                                    <YAxis
                                        domain={["auto", "auto"]}
                                        fontSize={11}
                                        stroke="var(--muted-foreground)"
                                        width={40}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            background: "var(--popover)",
                                            border: "1px solid var(--border)",
                                            borderRadius: 8,
                                            fontSize: 12,
                                        }}
                                        formatter={(v) => [`${Number(v).toFixed(1)} cm`, "Mesure"]}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke="var(--primary)"
                                        strokeWidth={2.5}
                                        dot={{ r: 3 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Aucune mesure pour l&apos;instant.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
