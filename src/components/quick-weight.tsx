"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { upsertWeightAction } from "@/lib/actions";

interface QuickWeightProps {
    date: string;
    initial: number | null;
    /** Affiche un sélecteur de date pour saisir une pesée d'un jour passé. */
    allowDateChange?: boolean;
}

export function QuickWeight({ date, initial, allowDateChange }: QuickWeightProps) {
    const router = useRouter();
    const [value, setValue] = useState(initial != null ? String(initial) : "");
    const [day, setDay] = useState(date);
    const [pending, startTransition] = useTransition();

    function onSave() {
        const kg = parseFloat(value.replace(",", "."));
        if (!Number.isFinite(kg) || kg <= 0) {
            toast.error("Poids invalide.");
            return;
        }
        startTransition(async () => {
            try {
                await upsertWeightAction(day, kg);
                toast.success("Pesée enregistrée.");
                router.refresh();
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    return (
        <div className="flex flex-col gap-2">
            {allowDateChange ? (
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="weight-date" className="text-xs">
                        Date
                    </Label>
                    <Input
                        id="weight-date"
                        type="date"
                        max={date}
                        value={day}
                        onChange={(e) => setDay(e.target.value)}
                        className="h-10"
                    />
                </div>
            ) : null}
            <div className="flex items-center gap-2">
                <Input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    placeholder="Poids"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-11 text-base"
                />
                <span className="text-muted-foreground text-sm">kg</span>
                <Button onClick={onSave} disabled={pending} className="h-11 px-4">
                    {pending ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                </Button>
            </div>
        </div>
    );
}
