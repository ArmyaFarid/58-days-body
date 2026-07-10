"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import {
    FOODS,
    CATEGORIES,
    PRESETS,
    foodByKey,
    computeTotals,
    type Food,
} from "@/lib/nutrition";
import { setFoodPortionAction, applyPresetAction } from "@/lib/actions";
import { formatShort } from "@/lib/date";

interface HistoryDay {
    date: string;
    protein: number;
    calories: number;
}

interface NutritionTrackerProps {
    date: string;
    proteinGoal: number;
    calorieGoal: number;
    initialPortions: Record<string, number>;
    frequentKeys: string[];
    history: HistoryDay[];
}

export function NutritionTracker({
    date,
    proteinGoal,
    calorieGoal,
    initialPortions,
    frequentKeys,
    history,
}: NutritionTrackerProps) {
    const router = useRouter();
    const [portions, setPortions] = useState<Record<string, number>>(initialPortions);
    const portionsRef = useRef(portions);
    portionsRef.current = portions;
    const [, startTransition] = useTransition();

    const totals = computeTotals(portions);

    function bump(foodKey: string, delta: number) {
        const next = Math.max(0, (portionsRef.current[foodKey] ?? 0) + delta);
        const copy = { ...portionsRef.current };
        if (next === 0) delete copy[foodKey];
        else copy[foodKey] = next;
        portionsRef.current = copy;
        setPortions(copy);
        startTransition(async () => {
            try {
                await setFoodPortionAction({ date, foodKey, portions: next });
            } catch {
                toast.error("Échec de l'enregistrement.");
                router.refresh();
            }
        });
    }

    function applyPreset(presetKey: string) {
        const preset = PRESETS.find((p) => p.key === presetKey);
        if (!preset) return;
        const copy = { ...portionsRef.current };
        for (const it of preset.items) {
            copy[it.foodKey] = (copy[it.foodKey] ?? 0) + it.portions;
        }
        portionsRef.current = copy;
        setPortions(copy);
        startTransition(async () => {
            try {
                await applyPresetAction(date, presetKey);
            } catch {
                toast.error("Échec du preset.");
                router.refresh();
            }
        });
    }

    const frequentFoods = frequentKeys
        .map((k) => foodByKey(k))
        .filter((f): f is Food => Boolean(f));

    return (
        <div className="flex flex-col gap-4">
            {/* Compteurs live */}
            <div className="flex flex-col gap-3">
                <StatBar label="Protéines" value={totals.protein} goal={proteinGoal} unit="g" />
                <StatBar label="Calories" value={totals.calories} goal={calorieGoal} unit="kcal" />
            </div>

            {/* Presets */}
            <div className="grid grid-cols-2 gap-2">
                {PRESETS.map((p) => (
                    <Button
                        key={p.key}
                        type="button"
                        variant="secondary"
                        className="h-11"
                        onClick={() => applyPreset(p.key)}
                    >
                        {p.label}
                    </Button>
                ))}
            </div>

            {/* Fréquents */}
            {frequentFoods.length > 0 ? (
                <div className="flex flex-col gap-2">
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                        Fréquents
                    </p>
                    {frequentFoods.map((food) => (
                        <FoodRow
                            key={food.key}
                            food={food}
                            count={portions[food.key] ?? 0}
                            onBump={bump}
                        />
                    ))}
                </div>
            ) : null}

            {/* Catalogue complet + historique */}
            <Accordion className="gap-0">
                <AccordionItem value="foods">
                    <AccordionTrigger>Tous les aliments</AccordionTrigger>
                    <AccordionContent>
                        <div className="flex flex-col gap-3">
                            {CATEGORIES.map((cat) => (
                                <div key={cat} className="flex flex-col gap-2">
                                    <p className="text-muted-foreground text-xs font-medium">{cat}</p>
                                    {FOODS.filter((f) => f.category === cat).map((food) => (
                                        <FoodRow
                                            key={food.key}
                                            food={food}
                                            count={portions[food.key] ?? 0}
                                            onBump={bump}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {history.length > 0 ? (
                    <AccordionItem value="history">
                        <AccordionTrigger>Historique</AccordionTrigger>
                        <AccordionContent>
                            <ul className="flex flex-col gap-1.5">
                                {history.map((d) => (
                                    <li
                                        key={d.date}
                                        className="flex items-center justify-between text-sm"
                                    >
                                        <span className="text-muted-foreground">
                                            {formatShort(d.date)}
                                        </span>
                                        <span className="tabular-nums">
                                            {d.protein} g · {d.calories} kcal
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                ) : null}
            </Accordion>
        </div>
    );
}

function StatBar({
    label,
    value,
    goal,
    unit,
}: {
    label: string;
    value: number;
    goal: number;
    unit: string;
}) {
    const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
    const reached = value >= goal;
    return (
        <div>
            <div className="flex items-baseline justify-between">
                <span className="text-sm font-medium">{label}</span>
                <span
                    className={cn(
                        "text-xl font-bold tabular-nums",
                        reached && "text-emerald-600 dark:text-emerald-400",
                    )}
                >
                    {value}
                    <span className="text-muted-foreground ml-1 text-sm font-normal">
                        / {goal} {unit}
                    </span>
                </span>
            </div>
            <div className="bg-muted mt-1.5 h-2.5 w-full overflow-hidden rounded-full">
                <div
                    className={cn(
                        "h-full rounded-full transition-all",
                        reached ? "bg-emerald-500" : "bg-primary",
                    )}
                    style={{ width: `${pct}%` }}
                />
            </div>
        </div>
    );
}

function FoodRow({
    food,
    count,
    onBump,
}: {
    food: Food;
    count: number;
    onBump: (foodKey: string, delta: number) => void;
}) {
    return (
        <div
            className={cn(
                "flex items-center gap-2 rounded-lg border p-2",
                count > 0 ? "border-primary/40 bg-primary/5" : "border-border/60",
            )}
        >
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{food.name}</p>
                <p className="text-muted-foreground text-xs">
                    {food.portionLabel} · {food.protein} g · {food.calories} kcal
                </p>
            </div>
            <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => onBump(food.key, -1)}
                disabled={count === 0}
                aria-label="Moins"
            >
                <Minus className="size-4" />
            </Button>
            <span className="w-6 shrink-0 text-center text-base font-semibold tabular-nums">
                {count}
            </span>
            <Button
                type="button"
                size="icon"
                className="size-9 shrink-0"
                onClick={() => onBump(food.key, 1)}
                aria-label="Plus"
            >
                <Plus className="size-4" />
            </Button>
        </div>
    );
}
