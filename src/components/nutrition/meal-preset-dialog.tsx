"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Search, Trash2, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { FoodRow } from "./food-row";
import type { Food } from "@/lib/nutrition";
import { addCustomPresetAction, deleteCustomPresetAction } from "@/lib/actions";

export interface CustomPresetView {
    id: number;
    name: string;
    items: { foodKey: string; portions: number }[];
}

interface MealPresetDialogProps {
    foods: Food[];
    presets: CustomPresetView[];
    onCreated: (preset: CustomPresetView) => void;
    onDeleted: (id: number) => void;
}

export function MealPresetDialog({ foods, presets, onCreated, onDeleted }: MealPresetDialogProps) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [query, setQuery] = useState("");
    const [items, setItems] = useState<Record<string, number>>({});
    const [saving, startSaving] = useTransition();
    const [deleting, startDeleting] = useTransition();

    const foodIndex = useMemo(() => {
        const m: Record<string, Food> = {};
        for (const f of foods) m[f.key] = f;
        return m;
    }, [foods]);

    const q = query.trim().toLowerCase();
    const results = useMemo(
        () => (q ? foods.filter((f) => f.name.toLowerCase().includes(q)) : []),
        [q, foods],
    );

    const selected = Object.entries(items).filter(([, n]) => n > 0);

    function bump(foodKey: string, delta: number) {
        setItems((prev) => {
            const next = Math.max(0, (prev[foodKey] ?? 0) + delta);
            const copy = { ...prev };
            if (next === 0) delete copy[foodKey];
            else copy[foodKey] = next;
            return copy;
        });
    }

    function onCreate() {
        if (!name.trim()) {
            toast.error("Donne un nom au repas.");
            return;
        }
        if (selected.length === 0) {
            toast.error("Ajoute au moins un ingrédient.");
            return;
        }
        const payload = {
            name: name.trim(),
            items: selected.map(([foodKey, portions]) => ({ foodKey, portions })),
        };
        startSaving(async () => {
            try {
                const preset = await addCustomPresetAction(payload);
                onCreated(preset);
                toast.success("Repas créé.");
                setName("");
                setQuery("");
                setItems({});
            } catch {
                toast.error("Création impossible.");
            }
        });
    }

    function onDelete(id: number) {
        startDeleting(async () => {
            try {
                await deleteCustomPresetAction(id);
                onDeleted(id);
            } catch {
                toast.error("Suppression impossible.");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button type="button" variant="outline" className="h-11">
                        <Plus className="size-4" />
                        Repas
                    </Button>
                }
            />
            <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Mes repas</DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {/* Création */}
                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="preset-name">Nom du repas</Label>
                            <Input
                                id="preset-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex. Smoothie mangue"
                                className="h-11"
                            />
                        </div>

                        {selected.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                                {selected.map(([foodKey, n]) => (
                                    <button
                                        key={foodKey}
                                        type="button"
                                        onClick={() => bump(foodKey, -n)}
                                        className="bg-muted flex items-center gap-1 rounded-full px-2.5 py-1 text-xs"
                                    >
                                        {(foodIndex[foodKey]?.name ?? foodKey)} ×{n}
                                        <X className="size-3" />
                                    </button>
                                ))}
                            </div>
                        ) : null}

                        <div className="relative">
                            <Search className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />
                            <Input
                                type="search"
                                inputMode="search"
                                placeholder="Chercher un ingrédient…"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="h-10 pl-9"
                            />
                        </div>

                        {q ? (
                            <div className="flex flex-col gap-2">
                                {results.length > 0 ? (
                                    results.map((food) => (
                                        <FoodRow
                                            key={food.key}
                                            food={food}
                                            count={items[food.key] ?? 0}
                                            onBump={bump}
                                        />
                                    ))
                                ) : (
                                    <p className="text-muted-foreground text-sm">Aucun aliment trouvé.</p>
                                )}
                            </div>
                        ) : null}

                        <Button type="button" className="h-11" onClick={onCreate} disabled={saving}>
                            {saving ? <Loader2 className="size-4 animate-spin" /> : "Créer le repas"}
                        </Button>
                    </div>

                    {/* Liste existante */}
                    {presets.length > 0 ? (
                        <div className="flex flex-col gap-2 border-t pt-3">
                            <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                                Enregistrés
                            </p>
                            {presets.map((p) => (
                                <div
                                    key={p.id}
                                    className="border-border/60 flex items-center gap-2 rounded-lg border p-2"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{p.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {p.items.length} ingrédient{p.items.length > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 shrink-0"
                                        onClick={() => onDelete(p.id)}
                                        disabled={deleting}
                                        aria-label="Supprimer"
                                    >
                                        <Trash2 className="text-destructive size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
