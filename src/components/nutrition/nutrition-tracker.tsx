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
import { FOODS, CATEGORIES, PRESETS, type Food, type LoggedEntry } from "@/lib/nutrition";
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
    fat: number;
}

type Macro = { protein: number; calories: number; fat: number };

interface NutritionTrackerProps {
    today: string;
    proteinGoal: number;
    calorieGoal: number;
    /** Objectif lipides (g). Fourni ⇒ affiche le compteur lipides (programmes qui suivent le gras). */
    fatGoal?: number | null;
    initialEntries: LoggedEntry[];
    initialCustomFoods: Food[];
    initialCustomPresets: CustomPresetView[];
    frequentKeys: string[];
    history: HistoryDay[];
}

function portionsOf(entries: LoggedEntry[]): Record<string, number> {
    const p: Record<string, number> = {};
    for (const e of entries) p[e.foodKey] = e.portions;
    return p;
}

function snapshotOf(entries: LoggedEntry[]): Record<string, Macro> {
    const s: Record<string, Macro> = {};
    for (const e of entries) s[e.foodKey] = { protein: e.protein, calories: e.calories, fat: e.fat };
    return s;
}

export function NutritionTracker({
    today,
    proteinGoal,
    calorieGoal,
    fatGoal,
    initialEntries,
    initialCustomFoods,
    initialCustomPresets,
    frequentKeys,
    history,
}: NutritionTrackerProps) {
    const router = useRouter();
    const [selectedDate, setSelectedDate] = useState(today);
    const [portions, setPortions] = useState<Record<string, number>>(() => portionsOf(initialEntries));
    const portionsRef = useRef(portions);
    portionsRef.current = portions;
    // Macros figées par aliment pour le jour affiché : modifier un aliment ne
    // change pas les totaux déjà enregistrés.
    const [snapshot, setSnapshot] = useState<Record<string, Macro>>(() => snapshotOf(initialEntries));
    const snapshotRef = useRef(snapshot);
    snapshotRef.current = snapshot;
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

    let totalProtein = 0;
    let totalCalories = 0;
    let totalFat = 0;
    for (const [key, n] of Object.entries(portions)) {
        if (!n) continue;
        const m = snapshot[key] ?? foodIndex[key];
        if (!m) continue;
        totalProtein += m.protein * n;
        totalCalories += m.calories * n;
        totalFat += (m.fat ?? 0) * n;
    }
    const totals = {
        protein: Math.round(totalProtein),
        calories: Math.round(totalCalories),
        fat: Math.round(totalFat),
    };
    const isToday = selectedDate === today;
    const showFat = fatGoal != null && fatGoal > 0;

    function freeze(foodKey: string, base: Record<string, Macro>): Record<string, Macro> {
        const food = foodIndex[foodKey];
        if (!food) return base;
        return { ...base, [foodKey]: { protein: food.protein, calories: food.calories, fat: food.fat } };
    }

    function changeDay(date: string) {
        if (!date || date === selectedDate) return;
        setSelectedDate(date);
        startDayLoad(async () => {
            try {
                const entries = await getFoodPortionsAction(date);
                const p = portionsOf(entries);
                const s = snapshotOf(entries);
                portionsRef.current = p;
                snapshotRef.current = s;
                setPortions(p);
                setSnapshot(s);
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
        const s = freeze(foodKey, snapshotRef.current);
        snapshotRef.current = s;
        setSnapshot(s);
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
        let s = snapshotRef.current;
        for (const it of items) {
            copy[it.foodKey] = (copy[it.foodKey] ?? 0) + it.portions;
            s = freeze(it.foodKey, s);
        }
        portionsRef.current = copy;
        snapshotRef.current = s;
        setPortions(copy);
        setSnapshot(s);
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
                {showFat ? (
                    <StatBar label="Lipides" value={totals.fat} goal={fatGoal} unit="g" />
                ) : null}
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
                    onUpdated={(p) =>
                        setCustomPresets((prev) => prev.map((x) => (x.id === p.id ? p : x)))
                    }
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

            <AddFoodDialog
                customFoods={customFoods}
                trackFat={showFat}
                onAdded={(food) => setCustomFoods((prev) => [...prev, food])}
                onUpdated={(food) =>
                    setCustomFoods((prev) => prev.map((f) => (f.key === food.key ? food : f)))
                }
                onDeleted={(key) => setCustomFoods((prev) => prev.filter((f) => f.key !== key))}
            />

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
                                                    {showFat ? ` · ${d.fat} g lip.` : ""}
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
