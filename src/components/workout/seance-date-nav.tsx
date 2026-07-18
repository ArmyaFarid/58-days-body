"use client";

import { useRouter } from "next/navigation";
import { CalendarDays } from "lucide-react";
import { Input } from "@/components/ui/input";

interface SeanceDateNavProps {
    today: string;
    selectedDate: string;
}

// Permet de faire (ou rattraper) la séance d'un jour passé : change le ?date= de
// la page /seance. Le serveur re-rend la séance du jour choisi.
export function SeanceDateNav({ today, selectedDate }: SeanceDateNavProps) {
    const router = useRouter();
    const isToday = selectedDate === today;

    function go(date: string) {
        if (!date) return;
        router.push(date === today ? "/seance" : `/seance?date=${date}`);
    }

    return (
        <div className="flex items-center gap-2">
            <CalendarDays className="text-muted-foreground size-4 shrink-0" />
            <Input
                type="date"
                max={today}
                value={selectedDate}
                onChange={(e) => go(e.target.value)}
                className="h-9 w-auto"
                aria-label="Jour de la séance"
            />
            {!isToday ? (
                <button
                    type="button"
                    onClick={() => go(today)}
                    className="text-primary ml-auto text-xs font-medium"
                >
                    Aujourd&apos;hui
                </button>
            ) : null}
        </div>
    );
}
