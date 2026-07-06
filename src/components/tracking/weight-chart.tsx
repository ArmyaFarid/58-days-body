"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";

export interface WeightPoint {
    date: string;
    weight: number;
    weekAvg: number | null;
}

function fmtTick(date: string): string {
    // "2026-07-06" -> "06/07"
    const [, m, d] = date.split("-");
    return `${d}/${m}`;
}

export function WeightChart({ data }: { data: WeightPoint[] }) {
    if (data.length === 0) {
        return <p className="text-muted-foreground text-sm">Aucune pesée pour l&apos;instant.</p>;
    }

    return (
        <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ left: -16, right: 8, top: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={fmtTick}
                        fontSize={11}
                        stroke="var(--muted-foreground)"
                        minTickGap={24}
                        tickMargin={6}
                    />
                    <YAxis
                        domain={["auto", "auto"]}
                        fontSize={11}
                        stroke="var(--muted-foreground)"
                        width={40}
                        tickFormatter={(v: number) => v.toFixed(1)}
                    />
                    <Tooltip
                        contentStyle={{
                            background: "var(--popover)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            color: "var(--popover-foreground)",
                            fontSize: 12,
                        }}
                        labelFormatter={(label) => fmtTick(String(label))}
                        formatter={(value, name) => [`${Number(value).toFixed(1)} kg`, name]}
                    />
                    <Line
                        type="monotone"
                        dataKey="weight"
                        name="Poids"
                        stroke="var(--muted-foreground)"
                        strokeWidth={1}
                        dot={{ r: 2 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="weekAvg"
                        name="Moy. hebdo"
                        stroke="var(--primary)"
                        strokeWidth={2.5}
                        dot={false}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
