"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronRight, Loader2 } from "lucide-react";
import { applyPresetAction } from "@/lib/actions";

interface NutritionSummaryCardProps {
    date: string;
    calories: number;
    protein: number;
    calorieGoal: number;
    proteinGoal: number;
    /** Repas prédéfini proposé selon l'heure (matin ou soir). */
    preset: { key: string; label: string };
}

const RING = 2 * Math.PI * 50;

export function NutritionSummaryCard({
    date,
    calories,
    protein,
    calorieGoal,
    proteinGoal,
    preset,
}: NutritionSummaryCardProps) {
    const router = useRouter();
    const [pending, startTransition] = useTransition();
    const ratio = calorieGoal > 0 ? Math.min(1, calories / calorieGoal) : 0;
    const proteinPct = proteinGoal > 0 ? Math.min(100, (protein / proteinGoal) * 100) : 0;

    function addPreset() {
        startTransition(async () => {
            try {
                await applyPresetAction(date, preset.key);
                toast.success(`${preset.label} noté.`);
                router.refresh();
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    return (
        <section className="bg-card flex flex-col gap-3.5 rounded-[1.25rem] p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-[0.9375rem] font-semibold">Nutrition</h2>
                <Link
                    href="/suivi?tab=nutrition"
                    className="text-muted-foreground flex items-center gap-0.5 text-[0.8125rem] font-semibold"
                >
                    Détail
                    <ChevronRight className="size-4" strokeWidth={2.4} />
                </Link>
            </div>
            <div className="flex items-center gap-4">
                <svg
                    viewBox="0 0 120 120"
                    className="size-[5.25rem] shrink-0"
                    role="img"
                    aria-label={`${calories} kcal sur ${calorieGoal}`}
                >
                    <circle cx="60" cy="60" r="50" fill="none" className="stroke-border" strokeWidth="14" />
                    {ratio > 0 ? (
                        <circle
                            cx="60"
                            cy="60"
                            r="50"
                            fill="none"
                            className="stroke-brand transition-[stroke-dasharray] duration-700 ease-out"
                            strokeWidth="14"
                            strokeLinecap="round"
                            strokeDasharray={`${ratio * RING} ${RING}`}
                            transform="rotate(-90 60 60)"
                        />
                    ) : null}
                    <text
                        x="60"
                        y="60"
                        textAnchor="middle"
                        className="fill-foreground font-heading text-[28px] font-bold"
                    >
                        {Math.round(ratio * 100)}%
                    </text>
                    <text x="60" y="82" textAnchor="middle" className="fill-muted-foreground text-[14px]">
                        kcal
                    </text>
                </svg>
                <div className="flex min-w-0 flex-1 flex-col gap-2.5 text-[0.8125rem]">
                    <div className="flex justify-between gap-2">
                        <span className="text-muted-foreground">Calories</span>
                        <span className="font-bold tabular-nums">
                            {calories.toLocaleString("fr-FR")} / {calorieGoal.toLocaleString("fr-FR")}
                        </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between gap-2">
                            <span className="text-muted-foreground">Protéines</span>
                            <span className="font-bold tabular-nums">
                                {protein} / {proteinGoal} g
                            </span>
                        </div>
                        <div className="bg-border h-1.5 overflow-hidden rounded-full">
                            <div className="bg-brand h-full rounded-full" style={{ width: `${proteinPct}%` }} />
                        </div>
                    </div>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={addPreset}
                    disabled={pending}
                    className="bg-muted flex h-11 min-w-0 items-center justify-center gap-1.5 rounded-[0.875rem] px-2 text-[0.8125rem] font-semibold disabled:opacity-60"
                >
                    {pending ? <Loader2 className="size-4 animate-spin" /> : null}
                    <span className="truncate">+ {preset.label}</span>
                </button>
                <Link
                    href="/suivi?tab=nutrition&noter=1"
                    className="bg-brand text-brand-foreground flex h-11 items-center justify-center rounded-[0.875rem] text-[0.8125rem] font-bold"
                >
                    + J’ai mangé
                </Link>
            </div>
        </section>
    );
}
