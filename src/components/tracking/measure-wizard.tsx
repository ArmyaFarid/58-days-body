"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Minus, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { upsertMeasurementAction } from "@/lib/actions";
import type { Measurement } from "@/lib/data/measurements";
import type { MeasurementKey } from "@/lib/program";
import { BodySilhouette, MEASUREMENT_LABELS } from "./body-silhouette";

const TIPS: Record<MeasurementKey, string> = {
    shoulders: "Mètre à l’horizontale, au point le plus large des épaules, bras le long du corps.",
    chest: "Sous les aisselles, à la hauteur des tétons. Expire normalement.",
    arm: "Biceps contracté, au point le plus gros. Toujours le même bras.",
    waist: "Au niveau du nombril, ventre relâché, sans rentrer le ventre.",
    hips: "Au point le plus large des fesses, pieds joints.",
    thigh: "Juste sous le pli de la fesse, jambe détendue. Toujours la même jambe.",
};

const STEP = 0.5;

// Point de départ des boutons −/+ quand la zone n'a encore jamais été mesurée.
const TYPICAL: Record<MeasurementKey, number> = {
    shoulders: 110,
    chest: 95,
    arm: 32,
    waist: 80,
    hips: 95,
    thigh: 55,
};

interface MeasureWizardProps {
    today: string;
    fields: MeasurementKey[];
    /** Mesure déjà saisie aujourd'hui (reprise et non écrasée par « Passer »). */
    initial: Measurement | null;
    /** Dernière valeur connue par zone. */
    last: Partial<Record<MeasurementKey, number>>;
    onClose: () => void;
}

function parse(v: string): number | null {
    const n = parseFloat(v.replace(",", "."));
    return Number.isFinite(n) && n > 0 ? n : null;
}

function cm(n: number): string {
    return n.toFixed(1).replace(".", ",");
}

/** Saisie « Mesurer » zone par zone, en plein écran. */
export function MeasureWizard({ today, fields, initial, last, onClose }: MeasureWizardProps) {
    const router = useRouter();
    const start = (k: MeasurementKey) => (initial?.[k] != null ? cm(initial[k] as number) : "");
    const [step, setStep] = useState(0);
    const [values, setValues] = useState<Record<string, string>>(() =>
        Object.fromEntries(fields.map((k) => [k, start(k)])),
    );
    const [saving, startSaving] = useTransition();

    const key = fields[step];
    const isLast = step === fields.length - 1;
    const previous = last[key];

    function bump(delta: number) {
        const base = parse(values[key]) ?? previous ?? TYPICAL[key];
        const next = Math.max(0, Math.round((base + delta) / STEP) * STEP);
        setValues((v) => ({ ...v, [key]: cm(next) }));
    }

    function save(final: Record<string, string>) {
        startSaving(async () => {
            try {
                // Seules les zones du programme sont envoyées : les autres ne sont jamais écrasées.
                await upsertMeasurementAction({
                    date: today,
                    ...Object.fromEntries(fields.map((k) => [k, parse(final[k] ?? "")])),
                });
                toast.success("Mensurations enregistrées.");
                onClose();
                router.refresh();
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    function advance(final: Record<string, string>) {
        if (isLast) save(final);
        else setStep((s) => s + 1);
    }

    function skip() {
        // « Passer » garde la valeur déjà notée aujourd'hui, sinon laisse la zone vide.
        const final = { ...values, [key]: start(key) };
        setValues(final);
        advance(final);
    }

    return (
        <div className="bg-background fixed inset-0 z-50 pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex h-full max-w-xl flex-col gap-4 px-5 pt-4 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fermer sans enregistrer"
                        className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                    >
                        <X className="size-5" strokeWidth={2.4} />
                    </button>
                    <div className="flex min-w-0 flex-1 gap-1">
                        {fields.map((k, i) => (
                            <button
                                key={k}
                                type="button"
                                onClick={() => setStep(i)}
                                aria-label={`Aller à ${MEASUREMENT_LABELS[k]}`}
                                className="flex h-6 min-w-0 flex-1 items-center"
                            >
                                <span
                                    className={cn(
                                        "h-1.5 w-full rounded-full",
                                        i < step ? "bg-brand" : i === step ? "bg-brand/50" : "bg-border",
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                    <span className="text-muted-foreground shrink-0 text-[0.8125rem] font-semibold tabular-nums">
                        {step + 1} / {fields.length}
                    </span>
                </div>

                <section className="bg-card flex items-center gap-4 rounded-3xl p-4">
                    <BodySilhouette zone={key} className="h-60 w-[7.5rem] shrink-0" />
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <span className="text-muted-foreground text-xs font-bold tracking-[0.0625rem] uppercase">
                            Zone {step + 1}
                        </span>
                        <h2 className="font-heading text-[1.875rem] leading-none font-bold">
                            {MEASUREMENT_LABELS[key]}
                        </h2>
                        <p className="text-muted-foreground text-[0.8125rem] leading-[1.45]">{TIPS[key]}</p>
                    </div>
                </section>

                <section className="bg-card flex min-h-56 flex-1 flex-col justify-center gap-3.5 rounded-3xl p-[1.125rem]">
                    <div className="flex justify-between gap-2 text-[0.8125rem]">
                        <span className="text-muted-foreground">Centimètres</span>
                        {previous != null ? (
                            <span className="text-primary font-semibold">La dernière fois : {cm(previous)} cm</span>
                        ) : null}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={() => bump(-STEP)}
                            aria-label="0,5 cm de moins"
                            className="bg-border flex size-18 shrink-0 items-center justify-center rounded-full active:scale-95"
                        >
                            <Minus className="size-7" strokeWidth={2.8} />
                        </button>
                        <label className="min-w-0 flex-1">
                            <span className="sr-only">{MEASUREMENT_LABELS[key]} en centimètres</span>
                            <input
                                key={key}
                                type="text"
                                inputMode="decimal"
                                value={values[key]}
                                onChange={(e) =>
                                    setValues((v) => ({ ...v, [key]: e.target.value.replace(/[^\d.,]/g, "") }))
                                }
                                placeholder={previous != null ? cm(previous) : "0"}
                                className="font-heading placeholder:text-muted-foreground/40 w-full bg-transparent text-center text-[4rem] leading-none font-bold tabular-nums outline-none"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => bump(STEP)}
                            aria-label="0,5 cm de plus"
                            className="bg-border flex size-18 shrink-0 items-center justify-center rounded-full active:scale-95"
                        >
                            <Plus className="size-7" strokeWidth={2.8} />
                        </button>
                    </div>
                    <span className="text-muted-foreground self-center text-[0.8125rem]">
                        Pas de 0,5 cm · touche le chiffre pour le taper
                    </span>
                </section>

                <div className="flex gap-2.5">
                    <button
                        type="button"
                        onClick={skip}
                        disabled={saving}
                        className="bg-card h-16 shrink-0 rounded-[1.25rem] px-5 text-[0.9375rem] font-semibold disabled:opacity-60"
                    >
                        Passer
                    </button>
                    <button
                        type="button"
                        onClick={() => advance(values)}
                        disabled={saving}
                        className="bg-brand text-brand-foreground flex h-16 flex-1 items-center justify-center gap-2 rounded-[1.25rem] text-lg font-bold disabled:opacity-60"
                    >
                        {saving ? <Loader2 className="size-5 animate-spin" /> : null}
                        {isLast ? "Enregistrer" : "Suivant"}
                    </button>
                </div>
            </div>
        </div>
    );
}
