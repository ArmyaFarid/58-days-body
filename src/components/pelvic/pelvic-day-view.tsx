"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, Check, Eye, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BLOCKS_WARNING,
  PELVIC_BLOCKS,
  blockMinutes,
  type PelvicPosition,
  type PelvicStep,
} from "@/lib/program/plancher-pelvien";
import { PelvicBlock } from "./pelvic-block";
import { TimingJournalSheet } from "./timing-journal-sheet";

interface PelvicDayViewProps {
  today: string;
  selectedDate: string;
  /** null : aperçu d'un jour à venir. */
  sessionId: number | null;
  dayLabel: string;
  /** Heure de fin de chaque bloc fait (« 7 h 40 »), null sinon. */
  doneAt: (string | null)[];
  steps: PelvicStep[];
  position: PelvicPosition;
  positionLabel: string;
  record: number | null;
  timing: { label: string; short: string };
  /** « Dernière note : niveau 8, il y a 2 j ». */
  lastEntry: string | null;
}

export function PelvicDayView({
  today,
  selectedDate,
  sessionId,
  dayLabel,
  doneAt,
  steps,
  position,
  positionLabel,
  record,
  timing,
  lastEntry,
}: PelvicDayViewProps) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [journal, setJournal] = useState(false);

  const doneCount = doneAt.filter(Boolean).length;
  const next = doneAt.findIndex((d) => d == null);
  const minutes = blockMinutes(steps);

  function pickDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    router.push(value === today ? "/seance" : `/seance?date=${value}`);
  }

  if (open != null && sessionId !== null) {
    return (
      <PelvicBlock
        sessionId={sessionId}
        block={open}
        steps={steps}
        position={position}
        positionLabel={positionLabel}
        record={record}
        onClose={() => setOpen(null)}
        onSaved={() => {
          setOpen(null);
          router.refresh();
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-4">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground flex items-center gap-1.5 text-xs font-bold tracking-[0.0625rem] uppercase">
            {dayLabel}
            <label className="relative flex size-5 items-center justify-center">
              <CalendarDays className="size-3.5" />
              <span className="sr-only">Choisir un jour</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => pickDate(e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
          </span>
          {selectedDate !== today ? (
            <Link href="/seance" className="text-primary text-xs font-semibold">
              Aujourd&apos;hui
            </Link>
          ) : null}
        </div>
        <h1 className="font-heading text-[2.125rem] leading-none font-bold tracking-[-0.03125rem]">
          Blocs du jour
        </h1>
        {sessionId !== null ? (
          <div className="mt-1.5 flex items-center gap-2.5">
            <div className="bg-border h-2 flex-1 overflow-hidden rounded-full">
              <div
                className="bg-brand h-full rounded-full transition-[width]"
                style={{
                  width: `${(doneCount / PELVIC_BLOCKS.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-[0.8125rem] font-semibold whitespace-nowrap tabular-nums">
              {doneCount} / {PELVIC_BLOCKS.length}
            </span>
          </div>
        ) : null}
      </section>

      {sessionId === null ? (
        <p className="bg-primary/10 text-primary flex items-start gap-1.5 rounded-2xl p-3 text-sm">
          <Eye className="mt-0.5 size-4 shrink-0" />
          Aperçu : tu pourras faire tes blocs le jour venu.
        </p>
      ) : null}

      <div className="flex flex-col gap-2.5">
        {PELVIC_BLOCKS.map((b, i) => {
          const done = doneAt[i] != null;
          const current = sessionId !== null && i === next;
          return (
            <button
              key={b.key}
              type="button"
              disabled={sessionId === null}
              onClick={() => setOpen(i)}
              className={cn(
                "flex w-full items-center gap-3.5 rounded-[1.125rem] border-2 p-3.5 text-left",
                current
                  ? "border-brand bg-muted"
                  : "bg-card border-transparent",
                done && "opacity-60",
              )}
            >
              <span
                className={cn(
                  "font-heading flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold",
                  done || current
                    ? "bg-brand text-brand-foreground"
                    : "bg-border",
                )}
              >
                {done ? <Check className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span
                  className={cn(
                    "text-[0.9375rem] font-semibold",
                    done && "line-through",
                  )}
                >
                  {b.label}
                </span>
                <span className="text-muted-foreground text-[0.8125rem]">
                  {done
                    ? `${minutes} min · fait à ${doneAt[i]}`
                    : `≈ ${minutes} min`}
                </span>
              </span>
              {done ? (
                <span className="text-muted-foreground text-xs font-semibold">
                  Fait
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <section className="bg-card flex flex-col gap-2.5 rounded-[1.25rem] p-4">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[0.9375rem] font-semibold">
            Dans chaque bloc
          </span>
          <span className="text-muted-foreground text-xs">{positionLabel}</span>
        </div>
        {steps.map((s) => (
          <div key={s.key} className="flex justify-between gap-3 text-sm">
            <span>{s.name}</span>
            <span className="text-muted-foreground whitespace-nowrap">
              {s.summary}
            </span>
          </div>
        ))}
        {record != null && steps.some((s) => s.kind === "hold") ? (
          <p className="text-streak text-[0.8125rem] font-semibold">
            Record de tenue : {record} s
          </p>
        ) : null}
      </section>

      <section className="bg-card flex items-center gap-3 rounded-[1.25rem] px-4 py-3.5">
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="text-[0.9375rem] font-semibold">Journal timing</span>
          <span className="text-muted-foreground text-[0.8125rem]">
            {lastEntry ?? timing.label}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setJournal(true)}
          className="bg-muted flex h-10 shrink-0 items-center rounded-xl px-3.5 text-[0.8125rem] font-semibold"
        >
          Noter
        </button>
      </section>

      <p className="text-muted-foreground flex items-start gap-1.5 text-[0.8125rem]">
        <Info className="mt-0.5 size-3.5 shrink-0" />
        {BLOCKS_WARNING}
      </p>

      <TimingJournalSheet
        open={journal}
        onOpenChange={setJournal}
        date={today}
        stage={timing.short}
      />

      {sessionId !== null && next !== -1 ? (
        <>
          <div className="h-20" />
          <div className="from-background pointer-events-none fixed inset-x-0 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.25rem)] z-30 mx-auto max-w-xl bg-linear-to-t from-70% to-transparent px-5 pt-6 pb-3">
            <button
              type="button"
              onClick={() => setOpen(next)}
              className="bg-brand text-brand-foreground pointer-events-auto flex h-[3.75rem] w-full items-center justify-center gap-2.5 rounded-[1.125rem] px-4 text-[1.0625rem] font-bold active:scale-[0.98]"
            >
              <span className="min-w-0 truncate">
                Commencer le bloc {PELVIC_BLOCKS[next].short}
              </span>
              <ArrowRight className="size-5 shrink-0" strokeWidth={2.6} />
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
