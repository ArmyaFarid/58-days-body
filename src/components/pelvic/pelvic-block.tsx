"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, SkipForward, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { completePelvicBlockAction } from "@/lib/actions";
import { useWakeLock } from "@/hooks/use-wake-lock";
import {
  PELVIC_BLOCKS,
  type PelvicPosition,
  type PelvicStep,
} from "@/lib/program/plancher-pelvien";
import { PelvicFigure, type PelvicFigureVariant } from "./pelvic-figure";
import { CycleTimer, HoldTimer } from "./pelvic-timers";

interface PelvicBlockProps {
  sessionId: number;
  block: number;
  steps: PelvicStep[];
  position: PelvicPosition;
  positionLabel: string;
  record: number | null;
  onClose: () => void;
  onSaved: (allDone: boolean) => void;
}

function figureFor(
  step: PelvicStep,
  position: PelvicPosition,
): PelvicFigureVariant {
  if (step.kind === "walk") return "marche";
  if (step.kind === "hold") return "debout";
  return position;
}

/** Un bloc guidé : les exercices de la phase, l'un après l'autre, comme le mode focus. */
export function PelvicBlock({
  sessionId,
  block,
  steps,
  position,
  positionLabel,
  record,
  onClose,
  onSaved,
}: PelvicBlockProps) {
  const [index, setIndex] = useState(0);
  const [series, setSeries] = useState(0);
  const [holds, setHolds] = useState<number[]>([]);
  const [best, setBest] = useState(record);
  const [saving, startSaving] = useTransition();
  useWakeLock(true);

  const step = steps[index];
  const finished = index >= steps.length;

  function save(finalHolds: number[]) {
    startSaving(async () => {
      try {
        const { allDone } = await completePelvicBlockAction({
          sessionId,
          block,
          holds: finalHolds,
        });
        toast.success(
          allDone
            ? "Les 3 blocs sont faits. À demain."
            : `Bloc ${PELVIC_BLOCKS[block].short} fait.`,
        );
        onSaved(allDone);
      } catch {
        toast.error("Bloc non enregistré.", {
          action: { label: "Réessayer", onClick: () => save(finalHolds) },
        });
      }
    });
  }

  function next(finalHolds = holds) {
    setSeries(0);
    if (index + 1 >= steps.length) {
      setIndex(steps.length);
      save(finalHolds);
    } else {
      setIndex(index + 1);
    }
  }

  function saveHold(seconds: number) {
    const all = [...holds, seconds];
    setHolds(all);
    if (best == null || seconds > best) setBest(seconds);
    if (step.kind === "hold" && series + 1 < step.series) setSeries(series + 1);
    else next(all);
  }

  return (
    <div className="bg-background fixed inset-0 z-50 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-full max-w-xl flex-col">
        <div className="flex items-center gap-3 px-5 pt-4 pb-[1.125rem]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Revenir aux blocs du jour"
            className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
          >
            <X className="size-5" strokeWidth={2.4} />
          </button>
          <div className="flex min-w-0 flex-1 gap-1">
            {steps.map((s, i) => (
              <span
                key={s.key}
                className={cn(
                  "h-1.5 flex-1 rounded-full",
                  i < index
                    ? "bg-brand"
                    : i === index
                      ? "bg-brand/50"
                      : "bg-border",
                )}
              />
            ))}
          </div>
          <span className="text-muted-foreground shrink-0 text-[0.8125rem] font-semibold tabular-nums">
            {Math.min(index + 1, steps.length)} / {steps.length}
          </span>
          {!finished ? (
            <button
              type="button"
              onClick={() => next()}
              className="bg-card flex h-11 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[0.8125rem] font-semibold"
            >
              Passer
              <SkipForward className="size-4" strokeWidth={2.4} />
            </button>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col gap-[1.125rem] overflow-y-auto overscroll-contain px-5 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          {finished ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
              {saving ? (
                <Loader2 className="text-brand size-8 animate-spin" />
              ) : null}
              <p className="font-heading text-2xl font-bold">
                Bloc {PELVIC_BLOCKS[block].short}
              </p>
              <p className="text-muted-foreground text-sm">
                {saving ? "Enregistrement…" : "Terminé."}
              </p>
              {!saving ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-card mt-2 flex h-11 items-center rounded-full px-5 text-sm font-semibold"
                >
                  Fermer
                </button>
              ) : null}
            </div>
          ) : (
            <>
              {step.kind !== "hold" ? (
                <div className="bg-card flex h-[9.375rem] shrink-0 items-center justify-center rounded-3xl">
                  <PelvicFigure
                    variant={figureFor(step, position)}
                    className="h-[6.875rem] w-[14.375rem]"
                  />
                </div>
              ) : null}
              {step.kind === "hold" ? (
                <HoldTimer
                  key={`${index}-${series}`}
                  series={step.series}
                  seriesIndex={series}
                  target={step.target}
                  record={best}
                  onSave={saveHold}
                />
              ) : (
                <CycleTimer
                  key={index}
                  stepKey={step.key}
                  title={step.name}
                  context={step.kind === "walk" ? "En marchant" : positionLabel}
                  reps={step.reps}
                  holdSec={step.kind === "walk" ? 3 : step.holdSec}
                  relaxSec={step.kind === "walk" ? 3 : step.relaxSec}
                  onDone={() => next()}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
