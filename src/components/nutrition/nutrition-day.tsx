"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { applyCustomPresetAction, applyPresetAction, setFoodPortionAction } from "@/lib/actions";
import { FOODS, PRESETS, type Food, type LoggedEntry, type Macro } from "@/lib/nutrition";
import { formatShort } from "@/lib/date";
import { FoodPicker } from "./food-picker";
import type { CustomPresetView } from "./meal-preset-dialog";

interface NutritionDayProps {
    date: string;
    today: string;
    proteinGoal: number;
    calorieGoal: number;
    /** Objectif lipides (g) : fourni ⇒ barre lipides affichée. */
    fatGoal?: number | null;
    initialEntries: LoggedEntry[];
    initialCustomFoods: Food[];
    initialCustomPresets: CustomPresetView[];
    frequentKeys: string[];
    /** Ouvre directement « Qu'as-tu mangé ? » (lien depuis l'accueil). */
    openPicker?: boolean;
}

const RING = 2 * Math.PI * 52;
const SHOWN = 3;

export function NutritionDay({
    date,
    today,
    proteinGoal,
    calorieGoal,
    fatGoal,
    initialEntries,
    initialCustomFoods,
    initialCustomPresets,
    frequentKeys,
    openPicker = false,
}: NutritionDayProps) {
    const router = useRouter();
    const [portions, setPortions] = useState<Record<string, number>>(() =>
        Object.fromEntries(initialEntries.map((e) => [e.foodKey, e.portions])),
    );
    // Macros figées par aliment pour ce jour : modifier un aliment ne change pas les totaux déjà notés.
    const [snapshot, setSnapshot] = useState<Record<string, Macro>>(() =>
        Object.fromEntries(
            initialEntries.map((e) => [e.foodKey, { protein: e.protein, calories: e.calories, fat: e.fat }]),
        ),
    );
    const [customFoods, setCustomFoods] = useState<Food[]>(initialCustomFoods);
    const [customPresets, setCustomPresets] = useState<CustomPresetView[]>(initialCustomPresets);
    const [picking, setPicking] = useState(openPicker);
    const [expanded, setExpanded] = useState(false);
    const [, startTransition] = useTransition();

    const foods = useMemo(() => [...FOODS, ...customFoods], [customFoods]);
    const index = useMemo(() => Object.fromEntries(foods.map((f) => [f.key, f])), [foods]);
    const showFat = fatGoal != null && fatGoal > 0;

    const eaten = Object.entries(portions)
        .filter(([, n]) => n > 0)
        .map(([key, n]) => {
            const m = snapshot[key] ?? index[key];
            return { key, n, name: index[key]?.name ?? key, macro: m };
        })
        .filter((e) => e.macro);
    const totals = eaten.reduce(
        (t, e) => ({
            protein: t.protein + e.macro!.protein * e.n,
            calories: t.calories + e.macro!.calories * e.n,
            fat: t.fat + (e.macro!.fat ?? 0) * e.n,
        }),
        { protein: 0, calories: 0, fat: 0 },
    );
    const list = [...eaten].sort((a, b) => b.macro!.calories * b.n - a.macro!.calories * a.n);

    /** Applique des portions (aliment → total) : affichage immédiat, puis enregistrement. */
    function commit(next: Record<string, number>, persist: () => Promise<void>) {
        setPortions((p) => ({ ...p, ...next }));
        setSnapshot((s) => {
            const copy = { ...s };
            for (const key of Object.keys(next)) {
                const f = index[key];
                if (f && !copy[key]) copy[key] = { protein: f.protein, calories: f.calories, fat: f.fat };
            }
            return copy;
        });
        startTransition(async () => {
            try {
                await persist();
            } catch {
                toast.error("Échec de l'enregistrement.");
                router.refresh();
            }
        });
    }

    function save(changes: Record<string, number>) {
        closePicker();
        commit(changes, async () => {
            for (const [foodKey, n] of Object.entries(changes)) {
                await setFoodPortionAction({ date, foodKey, portions: n });
            }
            toast.success("Repas noté.");
        });
    }

    function addItems(items: { foodKey: string; portions: number }[], persist: () => Promise<void>) {
        const next: Record<string, number> = {};
        for (const it of items) next[it.foodKey] = (portions[it.foodKey] ?? 0) + it.portions;
        commit(next, persist);
    }

    function closePicker() {
        setPicking(false);
        // Le lien « J'ai mangé » de l'accueil ne rouvre pas la fenêtre au rechargement.
        const url = new URL(window.location.href);
        if (url.searchParams.has("noter")) {
            url.searchParams.delete("noter");
            window.history.replaceState(null, "", url);
        }
    }

    const ratio = calorieGoal > 0 ? Math.min(1, totals.calories / calorieGoal) : 0;

    return (
        <div className="flex flex-col gap-4">
            {date !== today ? (
                <div className="bg-primary/10 text-primary flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm">
                    <span>Tu modifies le {formatShort(date)}.</span>
                    <Link
                        href="/suivi?tab=nutrition"
                        className="shrink-0 font-semibold underline-offset-2 hover:underline"
                    >
                        Revenir à aujourd’hui
                    </Link>
                </div>
            ) : null}

            <section className="bg-card mt-1 flex flex-col gap-[1.125rem] rounded-3xl p-5">
                <div className="flex items-center gap-5">
                    <svg
                        viewBox="0 0 120 120"
                        className="size-28 shrink-0"
                        role="img"
                        aria-label={`${Math.round(totals.calories)} kcal sur ${calorieGoal}`}
                    >
                        <circle cx="60" cy="60" r="52" fill="none" className="stroke-border" strokeWidth="12" />
                        {ratio > 0 ? (
                            <circle
                                cx="60"
                                cy="60"
                                r="52"
                                fill="none"
                                className="stroke-brand"
                                strokeWidth="12"
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
                            {Math.round(totals.calories).toLocaleString("fr-FR")}
                        </text>
                        <text x="60" y="80" textAnchor="middle" className="fill-muted-foreground text-[12px]">
                            / {calorieGoal.toLocaleString("fr-FR")} kcal
                        </text>
                    </svg>
                    <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <span className="text-muted-foreground text-[0.8125rem]">Protéines</span>
                        <span className="font-heading text-[1.625rem] leading-[1.1] font-bold tabular-nums">
                            {Math.round(totals.protein)}
                            <span className="text-muted-foreground text-sm"> / {proteinGoal} g</span>
                        </span>
                        <Bar value={totals.protein} goal={proteinGoal} />
                        {showFat ? (
                            <div className="mt-2 flex flex-col gap-1">
                                <span className="text-muted-foreground flex justify-between text-xs">
                                    Lipides
                                    <span className="text-foreground font-semibold tabular-nums">
                                        {Math.round(totals.fat)} / {fatGoal} g
                                    </span>
                                </span>
                                <Bar value={totals.fat} goal={fatGoal!} muted />
                            </div>
                        ) : null}
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            onClick={() => addItems(p.items, () => applyPresetAction(date, p.key))}
                            className="bg-muted h-12 min-w-0 truncate rounded-[0.875rem] px-2 text-sm font-semibold"
                        >
                            + {p.label}
                        </button>
                    ))}
                    {customPresets.map((p) => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => addItems(p.items, () => applyCustomPresetAction(date, p.id))}
                            className="bg-muted h-12 min-w-0 truncate rounded-[0.875rem] px-2 text-sm font-semibold"
                        >
                            + {p.name}
                        </button>
                    ))}
                </div>
            </section>

            <section className="flex flex-col pt-1">
                <div className="flex items-baseline justify-between pb-1.5">
                    <h2 className="text-[0.9375rem] font-semibold">
                        {date === today ? "Mangé aujourd’hui" : "Mangé ce jour-là"}
                    </h2>
                    {list.length > SHOWN ? (
                        <button
                            type="button"
                            onClick={() => setExpanded((v) => !v)}
                            className="text-muted-foreground text-[0.8125rem] font-semibold"
                        >
                            {expanded ? "Réduire" : `Tout voir (${list.length})`}
                        </button>
                    ) : null}
                </div>
                {list.length === 0 ? (
                    <p className="text-muted-foreground py-3 text-sm">Rien de noté pour l’instant.</p>
                ) : null}
                {(expanded ? list : list.slice(0, SHOWN)).map((e) => (
                    <button
                        key={e.key}
                        type="button"
                        onClick={() => setPicking(true)}
                        className="flex items-center justify-between gap-3 border-b py-3 text-left"
                    >
                        <span className="min-w-0 truncate text-[0.9375rem]">
                            {e.name} <span className="text-muted-foreground">×{e.n}</span>
                        </span>
                        <span className="text-muted-foreground shrink-0 text-sm whitespace-nowrap tabular-nums">
                            {Math.round(e.macro!.calories * e.n).toLocaleString("fr-FR")} kcal
                        </span>
                    </button>
                ))}
            </section>

            {/* Espace pour que la liste ne passe pas sous le bouton fixe. */}
            <div className="h-20" />

            <div className="from-background pointer-events-none fixed inset-x-0 bottom-[calc(max(1.25rem,env(safe-area-inset-bottom))+4.25rem)] z-30 mx-auto max-w-xl bg-linear-to-t from-70% to-transparent px-5 pt-6 pb-3">
                <button
                    type="button"
                    onClick={() => setPicking(true)}
                    className="bg-brand text-brand-foreground pointer-events-auto flex h-[3.75rem] w-full items-center justify-center gap-2.5 rounded-[1.125rem] text-[1.0625rem] font-bold active:scale-[0.98]"
                >
                    <Plus className="size-5" strokeWidth={2.8} />
                    Noter ce que j’ai mangé
                </button>
            </div>

            {picking ? (
                <FoodPicker
                    foods={foods}
                    frequentKeys={frequentKeys}
                    portions={portions}
                    trackFat={showFat}
                    customFoods={customFoods}
                    customPresets={customPresets}
                    onCustomFoodsChange={setCustomFoods}
                    onCustomPresetsChange={setCustomPresets}
                    onSave={save}
                    onClose={closePicker}
                />
            ) : null}
        </div>
    );
}

function Bar({ value, goal, muted = false }: { value: number; goal: number; muted?: boolean }) {
    const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
    return (
        <div className="bg-border mt-1 h-2 overflow-hidden rounded-full">
            <div
                className={muted ? "bg-foreground h-full rounded-full" : "bg-brand h-full rounded-full"}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}
