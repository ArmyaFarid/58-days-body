"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EquipmentBadges } from "@/components/equipment-badges";
import type { CatalogProgram } from "@/components/my-programs";
import { addProgramAction } from "@/lib/actions";

interface ProgramPickerFormProps {
    catalog: CatalogProgram[];
    defaultDate: string;
}

/** Aucun programme suivi (tous abandonnés) : on en choisit un pour continuer. */
export function ProgramPickerForm({ catalog, defaultDate }: ProgramPickerFormProps) {
    const [selected, setSelected] = useState(catalog[0]?.id ?? "");
    const [startDate, setStartDate] = useState(defaultDate);
    const [saving, startSaving] = useTransition();

    function onStart() {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            toast.error("Date de début requise.");
            return;
        }
        startSaving(async () => {
            try {
                await addProgramAction(selected, startDate);
                window.location.assign("/");
            } catch {
                toast.error("Impossible de démarrer le programme.");
            }
        });
    }

    return (
        <div className="flex min-h-full flex-1 items-center justify-center p-6">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ListChecks className="size-6" />
                    </div>
                    <CardTitle className="text-xl">Choisis un programme</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                    <p className="text-muted-foreground text-sm">
                        Tu ne suis plus aucun programme. Tes anciennes données sont conservées : reprendre
                        un programme les retrouve.
                    </p>
                    <div className="flex flex-col gap-2">
                        {catalog.map((p) => (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => setSelected(p.id)}
                                className={cn(
                                    "flex flex-col gap-2 rounded-lg border p-3 text-left text-sm transition-colors",
                                    selected === p.id ? "border-primary bg-primary/10" : "border-border",
                                )}
                            >
                                <span className="font-medium">{p.label}</span>
                                {p.objective ? (
                                    <span className="text-muted-foreground text-xs">{p.objective}</span>
                                ) : null}
                                <EquipmentBadges program={p} />
                            </button>
                        ))}
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="picker-start">Date de début</Label>
                        <Input
                            id="picker-start"
                            type="date"
                            className="h-11"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <Button type="button" className="h-11 w-full" onClick={onStart} disabled={saving || !selected}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : "Commencer"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
