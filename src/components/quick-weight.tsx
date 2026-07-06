"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { upsertWeightAction } from "@/lib/actions";

interface QuickWeightProps {
    date: string;
    initial: number | null;
}

export function QuickWeight({ date, initial }: QuickWeightProps) {
    const [value, setValue] = useState(initial != null ? String(initial) : "");
    const [pending, startTransition] = useTransition();

    function onSave() {
        const kg = parseFloat(value.replace(",", "."));
        if (!Number.isFinite(kg) || kg <= 0) {
            toast.error("Poids invalide.");
            return;
        }
        startTransition(async () => {
            try {
                await upsertWeightAction(date, kg);
                toast.success("Pesée enregistrée.");
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    return (
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
    );
}
