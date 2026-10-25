"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Pause, Play, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { EquipmentBadges } from "@/components/equipment-badges";
import { addProgramAction, setProgramStatusAction } from "@/lib/actions";

export interface FollowedProgram {
    id: string;
    label: string;
    paused: boolean;
    isCurrent: boolean;
    /** Ex. « Jour 12 · Phase 1 (3 séances/sem) » ou « Démarre le … ». */
    progress: string;
    equipment: string[];
    equipmentOptional: string[];
}

export interface CatalogProgram {
    id: string;
    label: string;
    objective?: string;
    equipment: string[];
    equipmentOptional: string[];
}

interface MyProgramsProps {
    followed: FollowedProgram[];
    catalog: CatalogProgram[];
    today: string;
}

export function MyPrograms({ followed, catalog, today }: MyProgramsProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const [busyId, setBusyId] = useState<string | null>(null);

    function toggle(p: FollowedProgram) {
        setBusyId(p.id);
        startTransition(async () => {
            try {
                await setProgramStatusAction(p.id, !p.paused);
                toast.success(p.paused ? "Programme réactivé." : "Programme en pause. Données conservées.");
                router.refresh();
            } catch (err) {
                toast.error(err instanceof Error ? err.message : "Échec de la mise à jour.");
            } finally {
                setBusyId(null);
            }
        });
    }

    return (
        <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-2">
                {followed.map((p) => (
                    <li
                        key={p.id}
                        className={cn(
                            "flex flex-col gap-2 rounded-lg border p-3",
                            p.isCurrent ? "border-primary/50 bg-primary/5" : "border-border",
                            p.paused && "opacity-70",
                        )}
                    >
                        <div className="flex items-start justify-between gap-2">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-medium">
                                    {p.label}
                                    {p.paused ? <Badge variant="outline">En pause</Badge> : null}
                                    {p.isCurrent ? <Badge variant="secondary">Affiché</Badge> : null}
                                </p>
                                <p className="text-muted-foreground text-xs">{p.progress}</p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="shrink-0"
                                onClick={() => toggle(p)}
                                disabled={pending}
                            >
                                {pending && busyId === p.id ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : p.paused ? (
                                    <Play className="size-4" />
                                ) : (
                                    <Pause className="size-4" />
                                )}
                                {p.paused ? "Réactiver" : "Pause"}
                            </Button>
                        </div>
                        <EquipmentBadges program={p} />
                    </li>
                ))}
            </ul>

            {catalog.length > 0 ? <AddProgramDialog catalog={catalog} today={today} /> : null}
        </div>
    );
}

function AddProgramDialog({ catalog, today }: { catalog: CatalogProgram[]; today: string }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(catalog[0].id);
    const [startDate, setStartDate] = useState(today);
    const [saving, startSaving] = useTransition();

    function onAdd() {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
            toast.error("Date de début requise.");
            return;
        }
        startSaving(async () => {
            try {
                await addProgramAction(selected, startDate);
                toast.success("Programme ajouté.");
                setOpen(false);
                router.push("/");
                router.refresh();
            } catch {
                toast.error("Ajout impossible.");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button type="button" variant="outline" className="h-11">
                        <Plus className="size-4" />
                        Ajouter un programme
                    </Button>
                }
            />
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Catalogue</DialogTitle>
                </DialogHeader>
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
                    <Label htmlFor="program-start">Date de début</Label>
                    <Input
                        id="program-start"
                        type="date"
                        className="h-11"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <Button type="button" className="h-11" onClick={onAdd} disabled={saving}>
                    {saving ? <Loader2 className="size-4 animate-spin" /> : "Ajouter"}
                </Button>
            </DialogContent>
        </Dialog>
    );
}
