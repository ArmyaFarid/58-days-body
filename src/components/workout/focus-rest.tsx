"use client";

import { useEffect, useState } from "react";
import { ChevronsRight } from "lucide-react";

interface FocusRestProps {
    endAt: number;
    total: number;
    /** « Série 2 validée ». */
    justDoneLabel: string;
    /** « 12 reps · +1 ». */
    justDoneBadge: string;
    nextIndex: number;
    nextName: string;
    nextHint: string | null;
    onAdjust: (seconds: number) => void;
    onDone: () => void;
    /** Annule la série qui vient d'être notée. */
    onUndo?: () => void;
}

const RADIUS = 130;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

let audio: AudioContext | null = null;

/** À appeler pendant un geste : iOS ne joue un son que si le contexte a été débloqué ainsi. */
export function primeAudio() {
    try {
        audio ??= new AudioContext();
        if (audio.state === "suspended") void audio.resume();
    } catch {
        audio = null;
    }
}

export function beep() {
    if (!audio) return;
    const now = audio.currentTime;
    for (const [i, freq] of [880, 1320].entries()) {
        const osc = audio.createOscillator();
        const gain = audio.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + i * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.3, now + i * 0.18 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.18 + 0.16);
        osc.connect(gain).connect(audio.destination);
        osc.start(now + i * 0.18);
        osc.stop(now + i * 0.18 + 0.17);
    }
}

function fmt(s: number): string {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, "0")}`;
}

export function FocusRest({
    endAt,
    total,
    justDoneLabel,
    justDoneBadge,
    nextIndex,
    nextName,
    nextHint,
    onAdjust,
    onDone,
    onUndo,
}: FocusRestProps) {
    const [now, setNow] = useState(() => Date.now());
    // Calculé depuis l'heure de fin : reste juste même si l'app passe en arrière-plan.
    const remaining = Math.max(0, Math.ceil((endAt - now) / 1000));

    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 250);
        return () => clearInterval(t);
    }, []);

    useEffect(() => {
        if (remaining > 0) return;
        if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate([200, 100, 200]);
        beep();
        onDone();
    }, [remaining, onDone]);

    const progress = total > 0 ? remaining / total : 0;

    return (
        <div className="flex flex-1 flex-col items-center gap-6 overflow-y-auto px-5 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
            <div className="flex w-full items-center justify-between gap-2">
                <span className="text-muted-foreground text-xs font-bold tracking-[0.0625rem] uppercase">
                    Repos · {justDoneLabel}
                </span>
                <span className="bg-brand text-brand-foreground shrink-0 rounded-lg px-2.5 py-[0.3125rem] text-[0.8125rem] font-bold whitespace-nowrap">
                    {justDoneBadge}
                </span>
            </div>
            {onUndo ? (
                <button
                    type="button"
                    onClick={onUndo}
                    className="text-muted-foreground -mt-4 self-end text-[0.8125rem] font-semibold underline-offset-2 hover:underline"
                >
                    Annuler cette série
                </button>
            ) : null}

            <div className="flex flex-1 items-center justify-center">
                <svg
                    viewBox="0 0 300 300"
                    className="size-[min(74vw,18.125rem)]"
                    role="img"
                    aria-label={`Repos restant : ${fmt(remaining)} sur ${fmt(total)}`}
                >
                    <circle cx="150" cy="150" r={RADIUS} fill="none" className="stroke-nav" strokeWidth="18" />
                    <circle
                        cx="150"
                        cy="150"
                        r={RADIUS}
                        fill="none"
                        className="stroke-brand transition-[stroke-dasharray] duration-300 ease-linear"
                        strokeWidth="18"
                        strokeLinecap="round"
                        strokeDasharray={`${progress * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                        transform="rotate(-90 150 150)"
                    />
                    <text
                        x="150"
                        y="160"
                        textAnchor="middle"
                        className="fill-foreground font-heading text-[76px] font-bold tabular-nums"
                    >
                        {fmt(remaining)}
                    </text>
                    <text x="150" y="198" textAnchor="middle" className="fill-muted-foreground text-[16px]">
                        sur {fmt(total)}
                    </text>
                </svg>
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => onAdjust(-15)}
                    className="bg-muted h-[3.25rem] rounded-full px-[1.375rem] text-base font-bold"
                >
                    −15 s
                </button>
                <button
                    type="button"
                    onClick={() => onAdjust(15)}
                    className="bg-muted h-[3.25rem] rounded-full px-[1.375rem] text-base font-bold"
                >
                    +15 s
                </button>
            </div>

            <div className="bg-card flex w-full items-center gap-3.5 rounded-[1.25rem] p-4">
                <span className="bg-border font-heading flex size-11 shrink-0 items-center justify-center rounded-[0.875rem] text-[0.9375rem] font-bold">
                    {nextIndex}
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-muted-foreground text-xs">Ensuite</span>
                    <span className="text-[0.9375rem] font-semibold wrap-break-word">{nextName}</span>
                </div>
                {nextHint ? (
                    <span className="text-muted-foreground shrink-0 text-[0.8125rem] whitespace-nowrap">
                        {nextHint}
                    </span>
                ) : null}
            </div>

            <div className="flex w-full flex-col items-center gap-3">
                <button
                    type="button"
                    onClick={onDone}
                    className="bg-foreground text-background flex h-16 w-full shrink-0 items-center justify-center gap-2.5 rounded-[1.25rem] text-lg font-bold"
                >
                    Passer le repos
                    <ChevronsRight className="size-5" strokeWidth={2.6} />
                </button>
                <span className="text-muted-foreground text-xs">Vibration et son à la fin du repos</span>
            </div>
        </div>
    );
}
