"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORIES, type Food, type FoodCategory } from "@/lib/nutrition";
import { AddFoodDialog } from "./add-food-dialog";
import { MealPresetDialog, type CustomPresetView } from "./meal-preset-dialog";

const SHORT: Record<FoodCategory, string> = {
    "Viandes et œufs": "Viandes & œufs",
    "Poissons et fruits de mer": "Poissons",
    "Produits laitiers": "Laitiers",
    Glucides: "Glucides",
    "Fruits et légumes": "Fruits & légumes",
    "Lipides et extras": "Extras",
};

const FREQUENT = "frequent";

interface FoodPickerProps {
    foods: Food[];
    frequentKeys: string[];
    /** Portions déjà notées pour le jour. */
    portions: Record<string, number>;
    trackFat: boolean;
    customFoods: Food[];
    customPresets: CustomPresetView[];
    onCustomFoodsChange: (foods: Food[]) => void;
    onCustomPresetsChange: (presets: CustomPresetView[]) => void;
    /** Portions modifiées (aliment → nouveau total), envoyées à l'enregistrement. */
    onSave: (changes: Record<string, number>) => void;
    onClose: () => void;
}

export function FoodPicker({
    foods,
    frequentKeys,
    portions,
    trackFat,
    customFoods,
    customPresets,
    onCustomFoodsChange,
    onCustomPresetsChange,
    onSave,
    onClose,
}: FoodPickerProps) {
    // Brouillon : rien n'est enregistré avant « Enregistrer ».
    const [draft, setDraft] = useState<Record<string, number>>(() => ({ ...portions }));
    const [query, setQuery] = useState("");
    const frequent = frequentKeys.map((k) => foods.find((f) => f.key === k)).filter((f): f is Food => Boolean(f));
    const [tab, setTab] = useState<string>(frequent.length > 0 ? FREQUENT : CATEGORIES[0]);

    const q = query.trim().toLowerCase();
    const list = useMemo(() => {
        if (q) return foods.filter((f) => f.name.toLowerCase().includes(q));
        if (tab === FREQUENT) return frequent;
        return foods.filter((f) => f.category === tab);
    }, [q, tab, foods, frequent]);

    function bump(key: string, delta: number) {
        setDraft((d) => ({ ...d, [key]: Math.max(0, (d[key] ?? 0) + delta) }));
    }

    const changes: Record<string, number> = {};
    let added = 0;
    let protein = 0;
    let calories = 0;
    for (const f of foods) {
        const diff = (draft[f.key] ?? 0) - (portions[f.key] ?? 0);
        if (diff === 0) continue;
        changes[f.key] = draft[f.key] ?? 0;
        if (diff > 0) added += diff;
        protein += diff * f.protein;
        calories += diff * f.calories;
    }
    const changed = Object.keys(changes).length > 0;
    const sign = (n: number) => (n < 0 ? "−" : "+") + Math.abs(Math.round(n));

    return (
        <div className="bg-background fixed inset-0 z-50 pt-[env(safe-area-inset-top)]">
            <div className="mx-auto flex h-full max-w-xl flex-col">
                <div className="flex flex-col gap-3.5 px-5 pt-4">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Fermer sans enregistrer"
                            className="bg-card flex size-11 shrink-0 items-center justify-center rounded-full"
                        >
                            <X className="size-5" strokeWidth={2.4} />
                        </button>
                        <h2 className="font-heading min-w-0 flex-1 truncate text-xl font-bold">Qu’as-tu mangé ?</h2>
                        <AddFoodDialog
                            customFoods={customFoods}
                            trackFat={trackFat}
                            onAdded={(food) => onCustomFoodsChange([...customFoods, food])}
                            onUpdated={(food) =>
                                onCustomFoodsChange(customFoods.map((f) => (f.key === food.key ? food : f)))
                            }
                            onDeleted={(key) => onCustomFoodsChange(customFoods.filter((f) => f.key !== key))}
                            trigger={
                                <button
                                    type="button"
                                    className="h-9 shrink-0 rounded-full border px-3 text-xs font-semibold whitespace-nowrap"
                                >
                                    + Aliment perso
                                </button>
                            }
                        />
                    </div>

                    <label className="bg-card focus-within:border-brand flex h-[3.25rem] items-center gap-2.5 rounded-2xl border-2 border-transparent px-3.5">
                        <Search className="text-muted-foreground size-5 shrink-0" />
                        <span className="sr-only">Chercher un aliment</span>
                        <input
                            type="search"
                            inputMode="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Chercher un aliment…"
                            className="placeholder:text-muted-foreground h-full min-w-0 flex-1 bg-transparent text-base font-medium outline-none"
                        />
                    </label>

                    {!q ? (
                        <div className="-mx-5 flex gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            {[...(frequent.length > 0 ? [FREQUENT] : []), ...CATEGORIES].map((c) => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setTab(c)}
                                    aria-pressed={tab === c}
                                    className={cn(
                                        "h-9 shrink-0 rounded-full px-3.5 text-[0.8125rem] font-semibold whitespace-nowrap",
                                        tab === c ? "bg-foreground text-background" : "border",
                                    )}
                                >
                                    {c === FREQUENT ? "Fréquents" : SHORT[c as FoodCategory]}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </div>

                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain px-5 pt-4 pb-6">
                    <span className="text-muted-foreground text-xs font-bold tracking-[0.0625rem] uppercase">
                        {q ? "Résultats" : tab === FREQUENT ? "Fréquents" : SHORT[tab as FoodCategory]}
                    </span>
                    {list.length === 0 ? (
                        <p className="text-muted-foreground py-6 text-sm">Aucun aliment trouvé.</p>
                    ) : null}
                    {list.map((food) => {
                        const n = draft[food.key] ?? 0;
                        return (
                            <div
                                key={food.key}
                                className={cn(
                                    "flex items-center gap-2.5 rounded-2xl border-2 py-2.5 pr-2.5 pl-3.5",
                                    n > 0 ? "border-brand bg-muted" : "bg-card border-transparent",
                                )}
                            >
                                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                                    <span className="truncate text-sm font-semibold">{food.name}</span>
                                    <span className="text-muted-foreground text-xs">
                                        {food.portionLabel} ·{" "}
                                        <span className="text-foreground font-semibold">{food.protein} g</span> prot ·{" "}
                                        {food.calories} kcal
                                    </span>
                                </div>
                                {n > 0 ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => bump(food.key, -1)}
                                            aria-label={`Une portion de ${food.name} en moins`}
                                            className="bg-border flex size-9 shrink-0 items-center justify-center rounded-xl"
                                        >
                                            <Minus className="size-4" strokeWidth={2.8} />
                                        </button>
                                        <span className="font-heading w-[1.375rem] text-center text-[1.0625rem] font-bold tabular-nums">
                                            {n}
                                        </span>
                                    </>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={() => bump(food.key, 1)}
                                    aria-label={`Une portion de ${food.name} en plus`}
                                    className="bg-brand text-brand-foreground flex size-9 shrink-0 items-center justify-center rounded-xl"
                                >
                                    <Plus className="size-4" strokeWidth={3} />
                                </button>
                            </div>
                        );
                    })}
                    <MealPresetDialog
                        foods={foods}
                        presets={customPresets}
                        onCreated={(p) => onCustomPresetsChange([...customPresets, p])}
                        onUpdated={(p) => onCustomPresetsChange(customPresets.map((x) => (x.id === p.id ? p : x)))}
                        onDeleted={(id) => onCustomPresetsChange(customPresets.filter((x) => x.id !== id))}
                        trigger={
                            <button type="button" className="text-muted-foreground mt-2 h-11 text-sm font-semibold">
                                Créer ou modifier un repas
                            </button>
                        }
                    />
                </div>

                <div className="bg-card flex items-center gap-3.5 rounded-t-3xl border-t px-5 pt-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-muted-foreground text-xs">
                            {!changed
                                ? "Rien de modifié"
                                : added > 0
                                  ? `${added} portion${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""}`
                                  : "Portions retirées"}
                        </span>
                        <span className="font-heading text-lg font-bold tabular-nums">
                            {changed ? `${sign(protein)} g · ${sign(calories)} kcal` : "—"}
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={() => (changed ? onSave(changes) : onClose())}
                        className="bg-brand text-brand-foreground h-14 shrink-0 rounded-[1.125rem] px-[1.625rem] text-[1.0625rem] font-bold"
                    >
                        Enregistrer
                    </button>
                </div>
            </div>
        </div>
    );
}
