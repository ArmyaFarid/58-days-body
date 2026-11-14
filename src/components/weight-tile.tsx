"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuickWeight } from "@/components/quick-weight";
import { cn } from "@/lib/utils";

interface WeightTileProps {
    date: string;
    todayWeight: number | null;
    latest: number | null;
    deltaPerWeek: number | null;
}

function kg(n: number): string {
    return n.toFixed(1).replace(".", ",");
}

export function WeightTile({ date, todayWeight, latest, deltaPerWeek }: WeightTileProps) {
    const [open, setOpen] = useState(false);
    const moving = deltaPerWeek != null && Math.abs(deltaPerWeek) > 0.05;

    return (
        <div className="bg-card flex flex-col gap-2.5 rounded-[1.25rem] p-4">
            <Scale className="text-muted-foreground size-6" strokeWidth={2} />
            <span className="font-heading text-[1.625rem] leading-tight font-bold tabular-nums">
                {latest != null ? kg(latest) : "—"}
                <span className="text-muted-foreground text-[0.9375rem]"> kg</span>
            </span>
            <span className={cn("text-[0.8125rem]", moving ? "text-primary" : "text-muted-foreground")}>
                {deltaPerWeek != null
                    ? `${deltaPerWeek > 0 ? "+" : deltaPerWeek < 0 ? "−" : ""}${kg(Math.abs(deltaPerWeek))} kg / sem.`
                    : "Pas encore de tendance"}
            </span>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                    render={
                        <button
                            type="button"
                            className="bg-muted mt-auto h-9 rounded-[0.625rem] text-[0.8125rem] font-semibold"
                        >
                            {todayWeight != null ? "Modifier" : "Peser"}
                        </button>
                    }
                />
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Pesée du matin</DialogTitle>
                    </DialogHeader>
                    <QuickWeight date={date} initial={todayWeight} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
