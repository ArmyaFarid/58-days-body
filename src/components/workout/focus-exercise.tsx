"use client";

import { useState } from "react";
import { Check, ChevronDown, Loader2, Minus, Plus, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseSvg, hasExerciseSvg } from "@/components/exercise-svg";
import { HowToDialog, SwapNotice, VariantSelector, bandOptionsFor, guessBand } from "./exercise-card";
import { targetFloor } from "./focus-sequence";
import type { ExerciseBlock, LoggedSet } from "./types";

interface FocusExerciseProps {
    sessionId: number;
    block: ExerciseBlock;
    setIndex: number;
    unitLabel: string;
    logged: Record<number, LoggedSet>;
    variant: string | null;
    showIntensification: boolean;
    pending: boolean;
    onVariantChange: (v: string | null) => void;
    onSelectSet: (i: number) => void;
    onValidate: (reps: number | null, band: string | null) => void;
}

export function FocusExercise({
    sessionId,
    block,
    setIndex,
    unitLabel,
    logged,
    variant,
    showIntensification,
    pending,
    onVariantChange,
    onSelectSet,
    onValidate,
}: FocusExerciseProps) {
    const options = bandOptionsFor(block.bandMode);
    const isTime = block.bandMode === "time";
    const step = isTime ? 5 : 1;
    const current = logged[setIndex];
    const last = block.last[setIndex];

    const [reps, setReps] = useState<number>(current?.reps ?? last?.reps ?? targetFloor(block.reps) ?? 0);
    const [band, setBand] = useState<string | null>(
        current?.band ?? guessBand(last?.band, options) ?? guessBand(block.band, options),
    );
    const [variantOpen, setVariantOpen] = useState(false);

    const beat = last?.reps != null ? reps - last.reps : null;
    const unit = isTime ? "secondes" : "répétitions";

    return (
        <>
            <div className="flex flex-1 flex-col gap-[1.125rem] overflow-y-auto overscroll-contain px-5 pb-[1.125rem]">
                <div className="bg-card relative flex h-[12.25rem] shrink-0 items-center justify-center rounded-3xl p-3">
                    {hasExerciseSvg(block.lexiconKey) ? (
                        <div className="w-full">
                            <ExerciseSvg lexiconKey={block.lexiconKey} />
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm">Pas d&apos;illustration</span>
                    )}
                    <div className="absolute top-3 right-3">
                        <HowToDialog block={block} pill />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5">
                    <h2 className="font-heading text-[1.625rem] leading-[1.1] font-bold tracking-[-0.019rem] wrap-break-word">
                        {block.name}
                    </h2>
                    {block.swap ? <SwapNotice sessionId={sessionId} swap={block.swap} /> : null}
                    <p className="text-muted-foreground text-sm">
                        Objectif{" "}
                        <span className="whitespace-nowrap">
                            {block.sets} × {block.reps}
                        </span>
                        {block.band ? <span className="whitespace-nowrap"> · {block.band}</span> : null}
                        {block.notes ? ` · ${block.notes}` : ""}
                    </p>
                </div>

                {showIntensification && block.intensification ? (
                    <p className="bg-primary/10 text-primary flex items-start gap-1.5 rounded-xl p-3 text-sm">
                        <Zap className="mt-0.5 size-4 shrink-0" />
                        {block.intensification}
                    </p>
                ) : null}

                <div className="flex gap-2">
                    {Array.from({ length: block.setCount }).map((_, i) => {
                        const l = logged[i];
                        const active = i === setIndex;
                        return (
                            <button
                                key={i}
                                type="button"
                                onClick={() => onSelectSet(i)}
                                aria-current={active ? "step" : undefined}
                                className={cn(
                                    "flex h-14 min-w-0 flex-1 flex-col items-center justify-center gap-px rounded-[0.875rem] border-2",
                                    active
                                        ? "border-brand bg-muted"
                                        : l
                                          ? "bg-brand text-brand-foreground border-transparent"
                                          : "bg-card text-muted-foreground border-transparent",
                                )}
                            >
                                <span className="text-[11px] font-semibold opacity-80">
                                    {unitLabel} {i + 1}
                                </span>
                                <span className="font-heading text-lg leading-none font-bold tabular-nums">
                                    {active ? reps : (l?.reps ?? "–")}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-card flex min-h-60 flex-1 flex-col justify-center gap-3.5 rounded-3xl p-[1.125rem]">
                    <div className="flex items-baseline justify-between gap-2 text-[0.8125rem]">
                        <span className="text-muted-foreground">
                            {unitLabel} {setIndex + 1} · {unit}
                        </span>
                        {last?.reps != null ? (
                            <span className="text-primary min-w-0 truncate font-semibold">
                                Dernière fois : {last.reps}
                                {isTime ? " s" : ""}
                                {last.band ? ` · ${last.band}` : ""}
                            </span>
                        ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => setReps((r) => Math.max(0, r - step))}
                            aria-label={`${step} de moins`}
                            className="bg-border flex size-18 shrink-0 items-center justify-center rounded-full active:scale-95"
                        >
                            <Minus className="size-7" strokeWidth={2.8} />
                        </button>
                        <span className="font-heading min-w-0 text-7xl leading-none font-bold tabular-nums">
                            {reps}
                        </span>
                        <button
                            type="button"
                            onClick={() => setReps((r) => r + step)}
                            aria-label={`${step} de plus`}
                            className="bg-border flex size-18 shrink-0 items-center justify-center rounded-full active:scale-95"
                        >
                            <Plus className="size-7" strokeWidth={2.8} />
                        </button>
                    </div>
                    {beat != null && beat > 0 ? (
                        <span className="bg-brand text-brand-foreground self-center rounded-lg px-2.5 py-[0.3125rem] text-[0.8125rem] font-bold">
                            +{beat} vs la dernière fois
                        </span>
                    ) : null}

                    {options.length > 0 ? (
                        <div className="flex flex-col gap-1.5">
                            <span className="text-muted-foreground text-xs">
                                {block.bandMode === "assist" ? "Assistance" : "Bande"}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {options.map((o) => {
                                    const active = o === "aucune" ? band == null : band === o;
                                    return (
                                        <button
                                            key={o}
                                            type="button"
                                            onClick={() => setBand(o === "aucune" ? null : o)}
                                            className={cn(
                                                "h-10 rounded-lg px-3 text-sm font-medium",
                                                active ? "bg-primary text-primary-foreground" : "bg-muted",
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

                {block.variantsEnabled ? (
                    <div className="flex flex-col gap-2">
                        <button
                            type="button"
                            onClick={() => setVariantOpen((v) => !v)}
                            aria-expanded={variantOpen}
                            className="text-muted-foreground flex items-center gap-1.5 self-start text-sm font-medium"
                        >
                            Variante : {variant ?? "Standard"}
                            <ChevronDown className={cn("size-4 transition-transform", variantOpen && "rotate-180")} />
                        </button>
                        {variantOpen ? (
                            <VariantSelector
                                sessionId={sessionId}
                                exerciseKey={block.key}
                                options={block.variants}
                                value={variant}
                                lastVariant={block.lastVariant}
                                onChange={onVariantChange}
                            />
                        ) : null}
                    </div>
                ) : null}
            </div>

            <div className="px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
                <button
                    type="button"
                    onClick={() => onValidate(reps, band)}
                    disabled={pending}
                    className="bg-brand text-brand-foreground flex h-16 w-full items-center justify-center gap-2.5 rounded-[1.25rem] text-lg font-bold active:scale-[0.98] disabled:opacity-60"
                >
                    {pending ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <Check className="size-[1.375rem]" strokeWidth={3} />
                    )}
                    {current ? "Mettre à jour la série" : `Valider ${unitLabel === "Tour" ? "le tour" : "la série"}`}
                </button>
            </div>
        </>
    );
}
