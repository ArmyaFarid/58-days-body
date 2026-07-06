"use client";

import { useEffect } from "react";
import { X, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RestState {
    remaining: number;
    total: number;
}

interface RestTimerProps {
    rest: RestState | null;
    onStart: (seconds: number) => void;
    onStop: () => void;
    onTick: () => void;
}

const PRESETS = [60, 90, 120];

function fmt(s: number): string {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, "0")}`;
}

export function RestTimer({ rest, onStart, onStop, onTick }: RestTimerProps) {
    useEffect(() => {
        if (!rest || rest.remaining <= 0) return;
        const t = setTimeout(onTick, 1000);
        return () => clearTimeout(t);
    }, [rest, onTick]);

    const running = rest != null && rest.remaining > 0;
    const progress = rest ? ((rest.total - rest.remaining) / rest.total) * 100 : 0;

    return (
        <div className="fixed inset-x-0 bottom-16 z-40 mx-auto max-w-xl px-3">
            <div className="bg-card relative overflow-hidden rounded-xl border shadow-lg">
                {running ? (
                    <div
                        className="bg-primary/15 absolute inset-y-0 left-0 transition-[width] duration-1000 ease-linear"
                        style={{ width: `${progress}%` }}
                    />
                ) : null}
                <div className="relative flex items-center gap-2 p-2">
                    <Timer className="text-muted-foreground ml-1 size-4 shrink-0" />
                    {running ? (
                        <span className="w-12 text-lg font-semibold tabular-nums">
                            {fmt(rest.remaining)}
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-sm">Repos</span>
                    )}
                    <div className="ml-auto flex items-center gap-1">
                        {PRESETS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => onStart(s)}
                                className={cn(
                                    "rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                                    running && rest.total === s
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted hover:bg-muted/70",
                                )}
                            >
                                {s < 120 ? `${s}s` : "2min"}
                            </button>
                        ))}
                        {running ? (
                            <button
                                type="button"
                                onClick={onStop}
                                className="hover:bg-muted rounded-md p-1.5"
                                aria-label="Arrêter"
                            >
                                <X className="size-4" />
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
}
