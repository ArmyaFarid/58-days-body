"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { addTimingEntryAction } from "@/lib/actions";
import {
  TIMING_OUTCOMES,
  TIMING_SIGNALS,
  type TimingOutcome,
} from "@/lib/program/plancher-pelvien";

interface TimingJournalSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string;
  /** « semaine 2 : observe sans agir ». */
  stage: string;
}

/** Feuille « Journal timing » : niveau max, signaux, intervention, note. */
export function TimingJournalSheet({
  open,
  onOpenChange,
  date,
  stage,
}: TimingJournalSheetProps) {
  const [level, setLevel] = useState<number | null>(null);
  const [signals, setSignals] = useState<string[]>([]);
  const [outcome, setOutcome] = useState<TimingOutcome>("none");
  const [note, setNote] = useState("");
  const [pending, startTransition] = useTransition();

  function toggle(key: string) {
    setSignals((s) =>
      s.includes(key) ? s.filter((k) => k !== key) : [...s, key],
    );
  }

  function save() {
    if (level == null) return;
    startTransition(async () => {
      try {
        await addTimingEntryAction({
          date,
          level,
          signals,
          outcome,
          note: note || null,
        });
        toast.success("Noté dans ton journal.");
        setLevel(null);
        setSignals([]);
        setOutcome("none");
        setNote("");
        onOpenChange(false);
      } catch {
        toast.error("Note non enregistrée.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="gap-[1.125rem]">
        <div className="flex flex-col gap-1">
          <DialogTitle className="font-heading text-[1.375rem] font-bold">
            Journal timing
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-[0.8125rem]">
            Privé, visible seulement par toi · {stage}
          </DialogDescription>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[0.8125rem]">
            Niveau le plus haut atteint
          </span>
          <div className="grid grid-cols-10 gap-1">
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setLevel(n)}
                aria-pressed={level === n}
                className={cn(
                  "font-heading h-10 rounded-[0.625rem] text-sm font-bold",
                  level === n
                    ? "bg-brand text-brand-foreground"
                    : n === 7 || n === 8
                      ? "border-brand border-[1.5px]"
                      : n === 9
                        ? "border-streak border-[1.5px]"
                        : "bg-muted",
                )}
              >
                {n}
              </button>
            ))}
          </div>
          <span className="text-muted-foreground text-xs">
            7-8 = zone d’intervention · 9 = trop tard
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[0.8125rem]">
            Signaux remarqués
          </span>
          <div className="flex flex-wrap gap-2">
            {TIMING_SIGNALS.map((s) => {
              const on = signals.includes(s.key);
              return (
                <button
                  key={s.key}
                  type="button"
                  onClick={() => toggle(s.key)}
                  aria-pressed={on}
                  className={cn(
                    "h-10 rounded-full px-3.5 text-[0.8125rem] font-semibold",
                    on ? "bg-brand text-brand-foreground" : "border",
                  )}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[0.8125rem]">
            Intervention
          </span>
          <div className="bg-muted grid grid-cols-3 gap-1 rounded-xl p-[3px]">
            {TIMING_OUTCOMES.map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setOutcome(o.key)}
                aria-pressed={outcome === o.key}
                className={cn(
                  "h-9 rounded-[0.625rem] text-[0.8125rem] font-semibold",
                  outcome === o.key
                    ? "bg-foreground text-background"
                    : "text-muted-foreground",
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-muted-foreground text-[0.8125rem]">
            Note (facultatif)
          </span>
          <textarea
            rows={2}
            value={note}
            maxLength={500}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ce que tu as remarqué…"
            className="bg-muted placeholder:text-muted-foreground resize-none rounded-[0.875rem] p-3 text-[0.9375rem] outline-none"
          />
        </label>

        <button
          type="button"
          onClick={save}
          disabled={level == null || pending}
          className="bg-brand text-brand-foreground flex h-14 items-center justify-center gap-2 rounded-[1.125rem] text-[1.0625rem] font-bold disabled:opacity-50"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : null}
          {level == null ? "Choisis un niveau" : "Enregistrer"}
        </button>
      </DialogContent>
    </Dialog>
  );
}
