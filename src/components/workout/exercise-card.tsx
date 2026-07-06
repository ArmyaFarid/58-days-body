"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HelpCircle, Check, PlayCircle, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { saveSetLogAction } from "@/lib/actions";
import type { ExerciseBlock } from "./types";

interface ExerciseCardProps {
    sessionId: number;
    block: ExerciseBlock;
    showIntensification: boolean;
    unitLabel: string;
    onSetSaved: () => void;
}

export function ExerciseCard({
    sessionId,
    block,
    showIntensification,
    unitLabel,
    onSetSaved,
}: ExerciseCardProps) {
    return (
        <Card>
            <CardHeader className="gap-1">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <p className="font-semibold leading-tight">{block.name}</p>
                        <p className="text-muted-foreground text-sm">
                            {block.sets} × {block.reps}
                            {block.band ? ` · ${block.band}` : ""}
                        </p>
                    </div>
                    <HowToDialog block={block} />
                </div>
                {block.notes ? (
                    <p className="text-muted-foreground text-sm">{block.notes}</p>
                ) : null}
                {showIntensification && block.intensification ? (
                    <p className="bg-primary/10 text-primary flex items-start gap-1.5 rounded-md p-2 text-sm">
                        <Zap className="mt-0.5 size-3.5 shrink-0" />
                        {block.intensification}
                    </p>
                ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
                {Array.from({ length: block.setCount }).map((_, i) => (
                    <SetRow
                        key={i}
                        sessionId={sessionId}
                        exerciseKey={block.key}
                        setIndex={i}
                        label={`${unitLabel} ${i + 1}`}
                        logged={block.logged[i]}
                        last={block.last[i]}
                        recommendedBand={block.band}
                        onSaved={onSetSaved}
                    />
                ))}
            </CardContent>
        </Card>
    );
}

interface SetRowProps {
    sessionId: number;
    exerciseKey: string;
    setIndex: number;
    label: string;
    logged?: { reps: number | null; band: string | null };
    last?: { reps: number | null; band: string | null };
    recommendedBand?: string;
    onSaved: () => void;
}

function SetRow({
    sessionId,
    exerciseKey,
    setIndex,
    label,
    logged,
    last,
    recommendedBand,
    onSaved,
}: SetRowProps) {
    const [reps, setReps] = useState(
        logged?.reps != null ? String(logged.reps) : last?.reps != null ? String(last.reps) : "",
    );
    const [band, setBand] = useState(logged?.band ?? last?.band ?? recommendedBand ?? "");
    const [saved, setSaved] = useState(logged != null);
    const [pending, startTransition] = useTransition();

    function onSave() {
        const parsed = reps.trim() === "" ? null : parseInt(reps, 10);
        if (parsed != null && (!Number.isFinite(parsed) || parsed < 0)) {
            toast.error("Reps invalides.");
            return;
        }
        startTransition(async () => {
            try {
                await saveSetLogAction({
                    sessionId,
                    exerciseKey,
                    setIndex,
                    reps: parsed,
                    band: band.trim() || null,
                    variant: null,
                    notes: null,
                });
                setSaved(true);
                onSaved();
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    const hint =
        last?.reps != null
            ? `dernière : ${last.reps}${last.band ? ` · ${last.band}` : ""}`
            : null;

    return (
        <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-2">
                <span className="text-muted-foreground w-12 shrink-0 text-xs">{label}</span>
                <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="reps"
                    value={reps}
                    onChange={(e) => {
                        setReps(e.target.value);
                        setSaved(false);
                    }}
                    className="h-10 w-16 px-2 text-center text-base"
                />
                <Input
                    type="text"
                    placeholder="bande / variante"
                    value={band}
                    onChange={(e) => {
                        setBand(e.target.value);
                        setSaved(false);
                    }}
                    className="h-10 flex-1 text-sm"
                />
                <Button
                    onClick={onSave}
                    disabled={pending}
                    size="icon"
                    variant={saved ? "default" : "outline"}
                    className="size-10 shrink-0"
                    aria-label="Enregistrer la série"
                >
                    <Check className="size-4" />
                </Button>
            </div>
            {hint ? <span className="text-muted-foreground pl-14 text-[11px]">{hint}</span> : null}
        </div>
    );
}

function HowToDialog({ block }: { block: ExerciseBlock }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0">
                        <HelpCircle className="size-4" />
                        Comment ?
                    </Button>
                }
            />
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{block.lexiconName}</DialogTitle>
                </DialogHeader>
                <p className="text-sm leading-relaxed">{block.lexiconText}</p>
                <Button
                    render={<a href={block.youtubeUrl} target="_blank" rel="noopener noreferrer" />}
                    variant="outline"
                    className="h-11"
                >
                    <PlayCircle className="size-4" />
                    Voir sur YouTube
                </Button>
            </DialogContent>
        </Dialog>
    );
}
