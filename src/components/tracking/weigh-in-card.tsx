"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuickWeight } from "@/components/quick-weight";

interface WeighInCardProps {
    today: string;
    todayWeight: number | null;
}

export function WeighInCard({ today, todayWeight }: WeighInCardProps) {
    const [open, setOpen] = useState(false);
    return (
        <section className="bg-card flex items-center gap-3 rounded-[1.25rem] px-4 py-3.5">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-[0.9375rem] font-semibold">Pesée du jour</span>
                <span className="text-muted-foreground text-[0.8125rem]">
                    {todayWeight != null
                        ? `${todayWeight.toFixed(1).replace(".", ",")} kg · notée`
                        : "Pas encore notée · à jeun, au réveil"}
                </span>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger
                    render={
                        <button
                            type="button"
                            className={
                                todayWeight != null
                                    ? "bg-muted h-11 shrink-0 rounded-[0.875rem] px-[1.125rem] text-sm font-bold"
                                    : "bg-brand text-brand-foreground h-11 shrink-0 rounded-[0.875rem] px-[1.125rem] text-sm font-bold"
                            }
                        >
                            {todayWeight != null ? "Modifier" : "Peser"}
                        </button>
                    }
                />
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Pesée</DialogTitle>
                    </DialogHeader>
                    <QuickWeight date={today} initial={todayWeight} allowDateChange onSaved={() => setOpen(false)} />
                </DialogContent>
            </Dialog>
        </section>
    );
}
