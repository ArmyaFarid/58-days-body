"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { beep, primeAudio } from "@/components/workout/focus-rest";
import { STEP_CUES } from "@/lib/program/plancher-pelvien";

const R = 90;
const C = 2 * Math.PI * R;

function vibrate(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Non supporté (iOS) : le bip suffit.
  }
}

/** Chrono à reprise : temps écoulé (ms) tant que `running` est vrai. */
function useElapsed(running: boolean, onTick: (ms: number) => void) {
  const [elapsed, setElapsed] = useState(0);
  const base = useRef(0);
  const tick = useRef(onTick);
  useEffect(() => {
    tick.current = onTick;
  });
  useEffect(() => {
    if (!running) return;
    const startedAt = Date.now();
    const id = setInterval(() => {
      const ms = base.current + Date.now() - startedAt;
      setElapsed(ms);
      tick.current(ms);
    }, 100);
    return () => {
      clearInterval(id);
      base.current += Date.now() - startedAt;
    };
  }, [running]);
  return elapsed;
}

interface CycleTimerProps {
  stepKey: string;
  reps: number;
  holdSec: number;
  relaxSec: number;
  /** « Allongé, genoux pliés ». */
  context: string;
  title: string;
  onDone: () => void;
}

/** Minuteur guidé contracte / relâche, répété `reps` fois. */
export function CycleTimer({
  stepKey,
  reps,
  holdSec,
  relaxSec,
  context,
  title,
  onDone,
}: CycleTimerProps) {
  const [running, setRunning] = useState(false);
  const cycle = (holdSec + relaxSec) * 1000;
  const last = useRef("");
  const ended = useRef(false);
  const elapsed = useElapsed(running, (ms) => {
    if (ended.current) return;
    if (ms >= reps * cycle) {
      ended.current = true;
      setRunning(false);
      beep();
      vibrate(200);
      onDone();
      return;
    }
    const contract = ms % cycle < holdSec * 1000;
    const marker = `${Math.floor(ms / cycle)}-${contract}`;
    if (marker !== last.current) {
      last.current = marker;
      if (holdSec > 1) beep();
      vibrate(contract ? 60 : 30);
    }
  });

  const rep = Math.min(reps, Math.floor(elapsed / cycle) + 1);
  const within = elapsed % cycle;
  const contract = within < holdSec * 1000;
  const phaseMs = contract ? holdSec * 1000 : relaxSec * 1000;
  const phaseElapsed = contract ? within : within - holdSec * 1000;
  const left = Math.max(1, Math.ceil((phaseMs - phaseElapsed) / 1000));
  const fraction = running || elapsed > 0 ? 1 - phaseElapsed / phaseMs : 1;
  const cues = STEP_CUES[stepKey] ?? STEP_CUES["pp-lente"];

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-[1.625rem] leading-[1.1] font-bold tracking-[-0.019rem]">
          {title}
        </h2>
        <p className="text-muted-foreground text-sm">
          {context} · rep {rep} / {reps}
        </p>
      </div>
      <div className="bg-card flex min-h-64 flex-1 flex-col items-center justify-center gap-2.5 rounded-3xl p-[1.125rem]">
        <div className="relative size-[13.125rem]">
          <svg
            viewBox="0 0 210 210"
            className="size-full -rotate-90"
            aria-hidden
          >
            <circle
              cx="105"
              cy="105"
              r={R}
              fill="none"
              className="stroke-border"
              strokeWidth="14"
            />
            <circle
              cx="105"
              cy="105"
              r={R}
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={`${fraction * C} ${C}`}
              className={contract ? "stroke-brand" : "stroke-muted-foreground"}
            />
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1"
            role="timer"
            aria-live="polite"
          >
            <span
              className={cn(
                "text-base font-bold tracking-[0.0625rem]",
                contract ? "text-brand" : "text-muted-foreground",
              )}
            >
              {contract ? "CONTRACTE" : "RELÂCHE"}
            </span>
            <span className="font-heading text-[3.75rem] leading-none font-bold tabular-nums">
              {holdSec === 1 ? rep : left}
            </span>
          </div>
        </div>
        <p className="text-muted-foreground min-h-10 text-center text-sm leading-[1.45]">
          {contract ? cues.contract : cues.relax}
        </p>
      </div>
      <button
        type="button"
        onClick={() => {
          primeAudio();
          setRunning((r) => !r);
        }}
        className="bg-brand text-brand-foreground flex h-16 w-full shrink-0 items-center justify-center rounded-[1.25rem] text-lg font-bold active:scale-[0.98]"
      >
        {running ? "Pause" : elapsed > 0 ? "Reprendre" : "Démarrer"}
      </button>
    </>
  );
}

interface HoldTimerProps {
  series: number;
  seriesIndex: number;
  target: string;
  record: number | null;
  onSave: (seconds: number) => void;
}

/** Tenue longue : chrono montant, record à battre, enregistrement du temps. */
export function HoldTimer(props: HoldTimerProps) {
  // « Recommencer » remonte un chrono neuf.
  const [run, setRun] = useState(0);
  return (
    <HoldRun key={run} {...props} onRestart={() => setRun((n) => n + 1)} />
  );
}

function HoldRun({
  series,
  seriesIndex,
  target,
  record,
  onSave,
  onRestart,
}: HoldTimerProps & { onRestart: () => void }) {
  const [status, setStatus] = useState<"idle" | "running" | "stopped">("idle");
  const elapsed = useElapsed(status === "running", () => {});
  const sec = Math.floor(elapsed / 1000);
  const scale = Math.max(60, (record ?? 0) + 15);
  const angle = record ? (record / scale) * 2 * Math.PI - Math.PI / 2 : 0;
  const beat = record != null && sec > record;

  function action() {
    primeAudio();
    if (status === "idle") setStatus("running");
    else if (status === "running") setStatus("stopped");
    else if (sec > 0) onSave(sec);
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-heading text-[1.625rem] leading-[1.1] font-bold tracking-[-0.019rem]">
          Tenue longue
        </h2>
        <p className="text-muted-foreground text-sm">
          Debout · série {seriesIndex + 1} sur {series} · objectif {target}
        </p>
      </div>
      <div className="bg-card flex items-start gap-3 rounded-[1.25rem] px-4 py-3.5">
        <span className="bg-muted font-heading text-brand flex size-8 shrink-0 items-center justify-center rounded-[0.625rem] text-xs font-bold">
          70%
        </span>
        <p className="text-muted-foreground text-[0.8125rem] leading-[1.45]">
          Contracte à environ 70 % de ton maximum et respire normalement. Arrête
          quand ça faiblit ou que les fessiers prennent le relais.
        </p>
      </div>
      <div className="bg-card flex min-h-64 flex-1 flex-col items-center justify-center gap-3 rounded-3xl p-[1.125rem]">
        <div className="relative size-[13.75rem]">
          <svg viewBox="0 0 220 220" className="size-full" aria-hidden>
            <circle
              cx="110"
              cy="110"
              r="94"
              fill="none"
              className="stroke-border"
              strokeWidth="14"
            />
            <circle
              cx="110"
              cy="110"
              r="94"
              fill="none"
              strokeWidth="14"
              strokeLinecap="round"
              className="stroke-brand"
              strokeDasharray={`${Math.min(1, elapsed / 1000 / scale) * 2 * Math.PI * 94} ${2 * Math.PI * 94}`}
              transform="rotate(-90 110 110)"
            />
            {record ? (
              <circle
                cx={110 + 94 * Math.cos(angle)}
                cy={110 + 94 * Math.sin(angle)}
                r="7"
                className="fill-streak stroke-card"
                strokeWidth="3"
              />
            ) : null}
          </svg>
          <div
            className="absolute inset-0 flex flex-col items-center justify-center"
            role="timer"
          >
            <span className="font-heading text-[4rem] leading-none font-bold tabular-nums">
              {sec}
            </span>
            <span className="text-muted-foreground mt-2 text-sm">secondes</span>
          </div>
        </div>
        {beat ? (
          <span className="bg-streak text-brand-foreground animate-in zoom-in-75 rounded-lg px-2.5 py-[0.3125rem] text-[0.8125rem] font-bold">
            Nouveau record ! (ancien : {record} s)
          </span>
        ) : record != null ? (
          <span className="text-streak text-[0.8125rem] font-semibold">
            Record : {record} s
          </span>
        ) : (
          <span className="text-muted-foreground text-[0.8125rem]">
            Note ton temps : il deviendra ton record.
          </span>
        )}
      </div>
      <button
        type="button"
        onClick={action}
        className={cn(
          "flex h-16 w-full shrink-0 items-center justify-center rounded-[1.25rem] text-lg font-bold active:scale-[0.98]",
          status === "running"
            ? "bg-foreground text-background"
            : "bg-brand text-brand-foreground",
        )}
      >
        {status === "idle"
          ? "Démarrer"
          : status === "running"
            ? "Stop"
            : `Enregistrer ${sec} s`}
      </button>
      {status === "stopped" ? (
        <button
          type="button"
          onClick={onRestart}
          className="text-muted-foreground -mt-2 h-10 shrink-0 text-sm font-semibold"
        >
          Recommencer
        </button>
      ) : null}
    </>
  );
}
