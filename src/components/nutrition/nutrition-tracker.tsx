"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, CalendarDays, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { FOODS, CATEGORIES, PRESETS, computeTotals, type Food } from "@/lib/nutrition";
import {
    setFoodPortionAction,
    applyPresetAction,
    applyCustomPresetAction,
    getFoodPortionsAction,
} from "@/lib/actions";
import { formatShort } from "@/lib/date";
import { AddFoodDialog } from "./add-food-dialog";
import { FoodRow } from "./food-row";
import { MealPresetDialog, type CustomPresetView } from "./meal-preset-dialog";

interface HistoryDay {
    date: string;
    protein: number;
    calories: number;
}

interface NutritionTrackerProps {
    today: string;
    proteinGoal: number;
    calorieGoal: number;
    initialPortions: Record<string, number>;
    initialCustomFoods: Food[];
    initialCustomPresets: CustomPresetView[];
    frequentKeys: string[];
    history: HistoryDay[];
}

export function NutritionTracker({
    today,
    proteinGoal,
    calorieGoal,
    initialPortions,
    initialCustomFoods,
    initialCustomPresets,
    frequentKeys,
    history,
}: NutritionTrackerProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(today);
    const [portions, setPortions] = useState<Record<string, number>>(initialPortions);
    const portionsRef = useRef(portions);
    portionsRef.current = portions;
    const [query, setQuery] = useState("");
    const [customFoods, setCustomFoods] = useState<Food[]>(initialCustomFoods);
    const [customPresets, setCustomPresets] = useState<CustomPresetView[]>(initialCustomPresets);
    const [, startTransition] = useTransition();
    const [loadingDay, startDayLoad] = useTransition();

    const allFoods = useMemo(() => [...FOODS, ...customFoods], [customFoods]);
    const foodIndex = useMemo(() => {
        const m: Record<string, Food> = {};
        for (const f of allFoods) m[f.key] = f;
        return m;
    }, [allFoods]);

    const totals = computeTotals(portions, customFoods);
    const isToday = selectedDate === today;

    function changeDay(date: string) {
        if (!date || date === selectedDate) return;
        setSelectedDate(date);
        startDayLoad(async () => {
            try {
                const p = await getFoodPortionsAction(date);
                portionsRef.current = p;
                setPortions(p);
            } catch {
                toast.error("Chargement du jour impossible.");
            }
        });
    }

    function bump(foodKey: string, delta: number) {
        const next = Math.max(0, (portionsRef.current[foodKey] ?? 0) + delta);
        const copy = { ...portionsRef.current };
        if (next === 0) delete copy[foodKey];
        else copy[foodKey] = next;
        portionsRef.current = copy;
        setPortions(copy);
        startTransition(async () => {
            try {
                await setFoodPortionAction({ date: selectedDate, foodKey, portions: next });
            } catch {
                toast.error("Échec de l'enregistrement.");
                router.refresh();
            }
        });
    }

    function applyItems(items: { foodKey: string; portions: number }[]) {
        const copy = { ...portionsRef.current };
        for (const it of items) {
            copy[it.foodKey] = (copy[it.foodKey] ?? 0) + it.portions;
        }
        portionsRef.current = copy;
        setPortions(copy);
    }

    function applyPreset(presetKey: string) {
        const preset = PRESETS.find((p) => p.key === presetKey);
        if (!preset) return;
        applyItems(preset.items);
        startTransition(async () => {
            try {
                await applyPresetAction(selectedDate, presetKey);
            } catch {
                toast.error("Échec du preset.");
                router.refresh();
            }
        });
    }

    function applyCustom(preset: CustomPresetView) {
        applyItems(preset.items);
        startTransition(async () => {
            try {
                await applyCustomPresetAction(selectedDate, preset.id);
            } catch {
                toast.error("Échec du repas.");
                router.refresh();
            }
        });
    }

    const frequentFoods = frequentKeys
        .map((k) => foodIndex[k])
        .filter((f): f is Food => Boolean(f));

    const q = query.trim().toLowerCase();
    const searchResults = useMemo(
        () => (q ? allFoods.filter((f) => f.name.toLowerCase().includes(q)) : []),
        [q, allFoods],
    );

    return (
        <div className="flex flex-col gap-4">
            {/* Jour + compteurs live */}
            <div className="flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <CalendarDays className="text-muted-foreground size-4 shrink-0" />
                    <Input
                        type="date"
                        max={today}
                        value={selectedDate}
                        onChange={(e) => changeDay(e.target.value)}
                        className="h-9 w-auto"
                        aria-label="Jour à modifier"
                    />
                    {loadingDay ? <Loader2 className="text-muted-foreground size-4 animate-spin" /> : null}
                    {!isToday ? (
                        <button
                            type="button"
                            onClick={() => changeDay(today)}
                            className="text-primary ml-auto text-xs font-medium"
                        >
                            Revenir à aujourd&apos;hui
                        </button>
                    ) : null}
                </div>
                {!isToday ? (
                    <p className="text-muted-foreground -mt-1 text-xs">
                        Tu modifies le {formatShort(selectedDate)}.
                    </p>
                ) : null}
                <StatBar label="Protéines" value={totals.protein} goal={proteinGoal} unit="g" />
                <StatBar label="Calories" value={totals.calories} goal={calorieGoal} unit="kcal" />
            </div>

            {/* Presets / repas */}
            <div className="flex flex-col gap-2">
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
                    {customPresets.map((p) => (
                        <Button
                            key={p.id}
                            type="button"
                            variant="secondary"
                            className="h-11"
                            onClick={() => applyCustom(p)}
                        >
                            {p.name}
                        </Button>
                    ))}
                </div>
                <MealPresetDialog
                    foods={allFoods}
                    presets={customPresets}
                    onCreated={(p) => setCustomPresets((prev) => [...prev, p])}
                    onDeleted={(id) => setCustomPresets((prev) => prev.filter((x) => x.id !== id))}
                />
            </div>

            {/* Recherche */}
            <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                <Input
                    type="search"
                    inputMode="search"
                    placeholder="Chercher un aliment…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="h-10 pl-9"
                />
            </div>

            <AddFoodDialog onAdded={(food) => setCustomFoods((prev) => [...prev, food])} />

            {q ? (
                /* Résultats de recherche */
                <div className="flex flex-col gap-2">
                    {searchResults.length > 0 ? (
                        searchResults.map((food) => (
                            <FoodRow
                                key={food.key}
                                food={food}
                                count={portions[food.key] ?? 0}
                                onBump={bump}
                            />
                        ))
                    ) : (
                        <p className="text-muted-foreground text-sm">Aucun aliment trouvé.</p>
                    )}
                </div>
            ) : (
                <>
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
                                            <p className="text-muted-foreground text-xs font-medium">
                                                {cat}
                                            </p>
                                            {allFoods.filter((f) => f.category === cat).map((food) => (
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
                </>
            )}
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
