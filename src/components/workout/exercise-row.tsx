"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ExerciseCard } from "./exercise-card";
import type { ExerciseBlock } from "./types";

interface ExerciseRowProps {
    index: number;
    /** null : aperçu d'un jour à venir, la ligne déplie le détail au lieu d'ouvrir le mode focus. */
    sessionId: number | null;
    block: ExerciseBlock;
    current: boolean;
    showIntensification: boolean;
    unitLabel: string;
    onOpen: () => void;
}

const noop = () => {};

export function ExerciseRow({
    index,
    sessionId,
    block,
    current,
    showIntensification,
    unitLabel,
    onOpen,
}: ExerciseRowProps) {
    const [expanded, setExpanded] = useState(false);
    const loggedCount = Object.keys(block.logged).length;
    const done = loggedCount >= block.setCount;
    const preview = sessionId === null;

    return (
        <div
            className={cn(
                "overflow-hidden rounded-[1.125rem] border-2",
                current ? "border-brand bg-muted" : "bg-card border-transparent",
                done && "opacity-60",
            )}
        >
            <button
                type="button"
                onClick={preview ? () => setExpanded((v) => !v) : onOpen}
                aria-expanded={preview ? expanded : undefined}
                className="flex w-full items-center gap-3.5 p-3.5 text-left"
            >
                <span
                    className={cn(
                        "font-heading flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                        done || current ? "bg-brand text-brand-foreground" : "bg-border",
                    )}
                >
                    {done ? <Check className="size-4" strokeWidth={3} /> : index + 1}
                </span>
                <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                    <span
                        className={cn(
                            "text-[0.9375rem] leading-[1.25] font-semibold wrap-break-word",
                            done && "line-through",
                        )}
                    >
                        {block.name}
                    </span>
                    <span className="text-muted-foreground text-[0.8125rem]">
                        {block.sets} × {block.reps}
                        {block.band ? ` · ${block.band}` : ""}
                    </span>
                </span>
                {!preview ? (
                    <span className="text-muted-foreground shrink-0 text-xs font-semibold whitespace-nowrap tabular-nums">
                        {done ? "Fait" : loggedCount > 0 ? `${loggedCount}/${block.setCount}` : ""}
                    </span>
                ) : null}
            </button>
            {preview && expanded ? (
                <div className="border-t">
                    <ExerciseCard
                        sessionId={null}
                        block={block}
                        showIntensification={showIntensification}
                        unitLabel={unitLabel}
                        onSetSaved={noop}
                    />
                </div>
            ) : null}
        </div>
    );
}
