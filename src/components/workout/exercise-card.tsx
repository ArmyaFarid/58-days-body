"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { HelpCircle, Check, PlayCircle, Zap, Minus, Plus, TrendingUp, Repeat2 } from "lucide-react";
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
import { saveSetLogAction, setExerciseVariantAction, setSessionInternatAction } from "@/lib/actions";
import { ExerciseSvg, hasExerciseSvg } from "@/components/exercise-svg";
import type { ExerciseBlock } from "./types";

const RESISTANCE_OPTIONS = ["aucune", "10 kg", "20 kg", "30 kg", "40 kg", "50 kg", "60 kg"];
const ASSIST_OPTIONS = ["strict", "bande 10", "bande 20", "bande 30", "lesté"];

export function bandOptionsFor(mode: ExerciseBlock["bandMode"]): string[] {
    if (mode === "resistance") return RESISTANCE_OPTIONS;
    if (mode === "assist") return ASSIST_OPTIONS;
    return [];
}

export function guessBand(value: string | null | undefined, options: string[]): string | null {
    if (!value) return null;
    if (value.toLowerCase().includes("strict")) return options.includes("strict") ? "strict" : null;
    const n = value.match(/\d+/)?.[0];
    if (!n) return null;
    return options.find((o) => o.match(/\d+/)?.[0] === n) ?? null;
}

interface ExerciseCardProps {
    /** null : aperçu, sans saisie. */
    sessionId: number | null;
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
    const [variant, setVariant] = useState<string | null>(block.variant ?? block.lastVariant);

    return (
        <Card>
            <CardHeader className="grid-cols-[minmax(0,1fr)] gap-1">
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 wrap-break-word">
                        <p className="font-semibold leading-tight">{block.name}</p>
                        <p className="text-muted-foreground text-sm">
                            Objectif : <span className="whitespace-nowrap">{block.sets} × {block.reps}</span>
                            {block.band ? ` · ${block.band}` : ""}
                        </p>
                    </div>
                    <HowToDialog block={block} />
                </div>
                {block.swap ? <SwapNotice sessionId={sessionId} swap={block.swap} /> : null}
                {block.notes ? <p className="text-muted-foreground text-sm">{block.notes}</p> : null}
                {block.progression ? (
                    <p className="text-muted-foreground flex items-start gap-1.5 text-xs">
                        <TrendingUp className="mt-0.5 size-3.5 shrink-0" />
                        <span>Cran suivant (optionnel) : {block.progression}</span>
                    </p>
                ) : null}
                {showIntensification && block.intensification ? (
                    <p className="bg-primary/10 text-primary flex items-start gap-1.5 rounded-md p-2 text-sm">
                        <Zap className="mt-0.5 size-3.5 shrink-0" />
                        {block.intensification}
                    </p>
                ) : null}
                {block.variantsEnabled && sessionId !== null ? (
                    <VariantSelector
                        sessionId={sessionId}
                        exerciseKey={block.key}
                        options={block.variants}
                        value={variant}
                        lastVariant={block.lastVariant}
                        onChange={setVariant}
                    />
                ) : null}
            </CardHeader>
            {sessionId !== null ? (
                <CardContent className="flex flex-col gap-3">
                    {Array.from({ length: block.setCount }).map((_, i) => (
                        <SetRow
                            key={i}
                            sessionId={sessionId}
                            exerciseKey={block.key}
                            setIndex={i}
                            label={`${unitLabel} ${i + 1}`}
                            bandMode={block.bandMode}
                            recommendedBand={block.band}
                            variant={variant}
                            logged={block.logged[i]}
                            last={block.last[i]}
                            onSaved={onSetSaved}
                        />
                    ))}
                </CardContent>
            ) : null}
        </Card>
    );
}

export function SwapNotice({
    sessionId,
    swap,
}: {
    sessionId: number | null;
    swap: NonNullable<ExerciseBlock["swap"]>;
}) {
    const [pending, startTransition] = useTransition();

    function toggle() {
        if (sessionId === null) return;
        startTransition(async () => {
            try {
                const res = await setSessionInternatAction({
                    sessionId,
                    revert: { exerciseKey: swap.originalKey, reverted: swap.replaced },
                });
                if (res.error) toast.error(res.error);
            } catch {
                toast.error("Échec de la mise à jour.");
            }
        });
    }

    return (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-xs">
                {swap.replaced ? `Remplacé — original : ${swap.originalName}` : "Original conservé (mode Internat)"}
            </span>
            {sessionId !== null ? (
                <button
                    type="button"
                    onClick={toggle}
                    disabled={pending}
                    className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-xs underline-offset-2 hover:underline disabled:opacity-50"
                >
                    <Repeat2 className="size-3.5" />
                    {swap.replaced ? "Revenir à l'original" : `Reprendre le substitut (${swap.substituteName})`}
                </button>
            ) : null}
        </div>
    );
}

export function VariantSelector({
    sessionId,
    exerciseKey,
    options,
    value,
    lastVariant,
    onChange,
}: {
    sessionId: number;
    exerciseKey: string;
    options: string[];
    value: string | null;
    lastVariant: string | null;
    onChange: (v: string | null) => void;
}) {
    const [customOpen, setCustomOpen] = useState(false);
    const [customText, setCustomText] = useState("");
    const [, startSaving] = useTransition();

    // Options affichées : celles du catalogue + la valeur courante si personnalisée.
    const chips = [...options];
    if (value && !chips.includes(value)) chips.push(value);

    function choose(v: string | null) {
        onChange(v);
        setCustomOpen(false);
        startSaving(async () => {
            try {
                await setExerciseVariantAction({ sessionId, exerciseKey, variant: v });
            } catch {
                toast.error("Échec de l'enregistrement de la variante.");
            }
        });
    }

    function submitCustom() {
        const v = customText.trim();
        if (!v) return;
        setCustomText("");
        choose(v);
    }

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-muted-foreground wrap-break-word text-[11px] font-medium uppercase tracking-wide">
                Variante
                {lastVariant ? (
                    <span className="ml-1 normal-case">· la dernière fois : {lastVariant}</span>
                ) : null}
            </span>
            <div className="flex flex-wrap gap-1.5">
                <button
                    type="button"
                    onClick={() => choose(null)}
                    className={cn(
                        "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                        value == null ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70",
                    )}
                >
                    Standard
                </button>
                {chips.map((o) => (
                    <button
                        key={o}
                        type="button"
                        onClick={() => choose(o)}
                        className={cn(
                            "max-w-full rounded-md px-2.5 py-1.5 text-left text-sm wrap-break-word transition-colors",
                            value === o ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70",
                        )}
                    >
                        {o}
                    </button>
                ))}
                <button
                    type="button"
                    onClick={() => setCustomOpen((v) => !v)}
                    className="bg-muted hover:bg-muted/70 rounded-md px-2.5 py-1.5 text-sm transition-colors"
                >
                    Autre…
                </button>
            </div>
            {customOpen ? (
                <div className="flex gap-2">
                    <Input
                        value={customText}
                        onChange={(e) => setCustomText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                submitCustom();
                            }
                        }}
                        placeholder="Ex. pieds surélevés, tempo 4 s…"
                        className="h-9"
                    />
                    <Button type="button" variant="outline" className="h-9 shrink-0" onClick={submitCustom}>
                        OK
                    </Button>
                </div>
            ) : null}
        </div>
    );
}

interface SetRowProps {
    sessionId: number;
    exerciseKey: string;
    setIndex: number;
    label: string;
    bandMode: ExerciseBlock["bandMode"];
    recommendedBand?: string;
    variant: string | null;
    logged?: { reps: number | null; band: string | null };
    last?: { reps: number | null; band: string | null };
    onSaved: () => void;
}

function SetRow({
    sessionId,
    exerciseKey,
    setIndex,
    label,
    bandMode,
    recommendedBand,
    variant,
    logged,
    last,
    onSaved,
}: SetRowProps) {
    const options = bandOptionsFor(bandMode);
    const isTime = bandMode === "time";
    const step = isTime ? 5 : 1;

    const [reps, setReps] = useState<number | null>(
        logged?.reps ?? last?.reps ?? null,
    );
    const [band, setBand] = useState<string | null>(
        logged?.band ??
            guessBand(last?.band, options) ??
            guessBand(recommendedBand, options),
    );
    const [saved, setSaved] = useState(logged != null);
    const [pending, startTransition] = useTransition();

    function bump(delta: number) {
        setReps((r) => Math.max(0, (r ?? 0) + delta));
        setSaved(false);
    }

    function chooseBand(value: string) {
        setBand(value === "aucune" ? null : value);
        setSaved(false);
    }

    function onSave() {
        startTransition(async () => {
            try {
                await saveSetLogAction({
                    sessionId,
                    exerciseKey,
                    setIndex,
                    reps: reps,
                    band: band,
                    variant: variant,
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
            ? `Dernière fois : ${last.reps}${isTime ? " s" : ""}${last.band ? ` · ${last.band}` : ""}`
            : null;

    return (
        <div className="border-border/60 flex flex-col gap-2 rounded-lg border p-2.5">
            <div className="flex items-baseline justify-between gap-2">
                <span className="text-muted-foreground shrink-0 text-xs font-medium">
                    {label} · {isTime ? "secondes" : "reps"}
                </span>
                {hint ? <span className="text-muted-foreground min-w-0 truncate text-[11px]">{hint}</span> : null}
            </div>
            {/* Toute la largeur disponible : rien ne déborde, même sur un petit écran ou en grande taille. */}
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    onClick={() => bump(-step)}
                    aria-label="Moins"
                >
                    <Minus className="size-4" />
                </Button>
                <Input
                    type="number"
                    inputMode="numeric"
                    value={reps ?? ""}
                    placeholder="0"
                    onChange={(e) => {
                        const v = e.target.value;
                        setReps(v === "" ? null : Math.max(0, parseInt(v, 10) || 0));
                        setSaved(false);
                    }}
                    aria-label={`${label} — ${isTime ? "secondes" : "répétitions"}`}
                    className="h-10 max-w-28 min-w-0 flex-1 px-1 text-center text-lg font-semibold"
                />
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-10 shrink-0"
                    onClick={() => bump(step)}
                    aria-label="Plus"
                >
                    <Plus className="size-4" />
                </Button>
                <Button
                    onClick={onSave}
                    disabled={pending}
                    size="icon"
                    variant={saved ? "default" : "outline"}
                    className="ml-auto size-10 shrink-0"
                    aria-label="Enregistrer la série"
                >
                    <Check className="size-5" />
                </Button>
            </div>

            {options.length > 0 ? (
                <div className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-[11px]">
                        {bandMode === "assist" ? "Assistance" : "Bande"}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                        {options.map((o) => {
                            const active = o === "aucune" ? band == null : band === o;
                            return (
                                <button
                                    key={o}
                                    type="button"
                                    onClick={() => chooseBand(o)}
                                    className={cn(
                                        "rounded-md px-2.5 py-1.5 text-sm transition-colors",
                                        active
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-muted/70",
                                    )}
                                >
                                    {o}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : null}

        </div>
    );
}

export function HowToDialog({ block, pill = false }: { block: ExerciseBlock; pill?: boolean }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    pill ? (
                        <button type="button" className="bg-muted h-9 rounded-full px-3 text-xs font-semibold">
                            Comment ?
                        </button>
                    ) : (
                        <Button variant="ghost" size="sm" className="text-muted-foreground shrink-0">
                            <HelpCircle className="size-4" />
                            Comment ?
                        </Button>
                    )
                }
            />
            <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto overscroll-contain">
                <DialogHeader>
                    <DialogTitle className="pr-8">{block.lexiconName}</DialogTitle>
                </DialogHeader>
                {hasExerciseSvg(block.lexiconKey) ? (
                    <div className="bg-muted rounded-lg p-2">
                        <ExerciseSvg lexiconKey={block.lexiconKey} />
                    </div>
                ) : null}
                <p className="text-sm leading-relaxed">{block.lexiconText}</p>
                <Button
                    render={<a href={block.youtubeUrl} target="_blank" rel="noopener noreferrer" />}
                    nativeButton={false}
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
