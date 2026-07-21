"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
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
import { CATEGORIES, type Food, type FoodCategory } from "@/lib/nutrition";
import {
    addCustomFoodAction,
    updateCustomFoodAction,
    deleteCustomFoodAction,
} from "@/lib/actions";

interface AddFoodDialogProps {
    customFoods: Food[];
    onAdded: (food: Food) => void;
    onUpdated: (food: Food) => void;
    onDeleted: (key: string) => void;
}

export function AddFoodDialog({ customFoods, onAdded, onUpdated, onDeleted }: AddFoodDialogProps) {
    const [open, setOpen] = useState(false);
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [portionLabel, setPortionLabel] = useState("");
    const [metric, setMetric] = useState("");
    const [protein, setProtein] = useState("");
    const [calories, setCalories] = useState("");
    const [category, setCategory] = useState<FoodCategory>(CATEGORIES[0]);
    const [saving, startSaving] = useTransition();
    const [deleting, startDeleting] = useTransition();

    function reset() {
        setEditingKey(null);
        setName("");
        setPortionLabel("");
        setMetric("");
        setProtein("");
        setCalories("");
        setCategory(CATEGORIES[0]);
    }

    function startEdit(food: Food) {
        setEditingKey(food.key);
        setName(food.name);
        setPortionLabel(food.portionLabel);
        setMetric(food.metric);
        setProtein(String(food.protein));
        setCalories(String(food.calories));
        setCategory(food.category);
    }

    function onSubmit() {
        const p = parseFloat(protein.replace(",", "."));
        const c = parseFloat(calories.replace(",", "."));
        if (!name.trim() || !portionLabel.trim()) {
            toast.error("Nom et portion requis.");
            return;
        }
        if (!Number.isFinite(p) || p < 0 || !Number.isFinite(c) || c < 0) {
            toast.error("Protéines et calories invalides.");
            return;
        }
        const payload = {
            name: name.trim(),
            portionLabel: portionLabel.trim(),
            metric: metric.trim(),
            protein: p,
            calories: c,
            category,
        };
        startSaving(async () => {
            try {
                if (editingKey) {
                    const food = await updateCustomFoodAction({ key: editingKey, ...payload });
                    onUpdated(food);
                    toast.success("Aliment modifié.");
                } else {
                    const food = await addCustomFoodAction(payload);
                    onAdded(food);
                    toast.success("Aliment ajouté.");
                }
                reset();
            } catch {
                toast.error(editingKey ? "Modification impossible." : "Ajout impossible.");
            }
        });
    }

    function onDelete(key: string) {
        startDeleting(async () => {
            try {
                await deleteCustomFoodAction(key);
                onDeleted(key);
                if (editingKey === key) reset();
            } catch {
                toast.error("Suppression impossible.");
            }
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(o) => {
                setOpen(o);
                if (!o) reset();
            }}
        >
            <DialogTrigger
                render={
                    <Button type="button" variant="outline" className="h-10 w-full">
                        <Plus className="size-4" />
                        Ajouter / modifier un aliment
                    </Button>
                }
            />
            <DialogContent className="max-h-[85vh] max-w-sm overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{editingKey ? "Modifier l'aliment" : "Mes aliments"}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                    {!editingKey && customFoods.length > 0 ? (
                        <div className="flex flex-col gap-2">
                            <p className="text-muted-foreground text-xs font-medium">
                                Touche ✎ pour modifier, 🗑 pour supprimer.
                            </p>
                            {customFoods.map((food) => (
                                <div
                                    key={food.key}
                                    className="border-border/60 flex items-center gap-2 rounded-lg border p-2"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">{food.name}</p>
                                        <p className="text-muted-foreground text-xs">
                                            {food.portionLabel} · {food.protein} g · {food.calories} kcal
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 shrink-0"
                                        onClick={() => startEdit(food)}
                                        aria-label="Modifier"
                                    >
                                        <Pencil className="size-4" />
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="size-9 shrink-0"
                                        onClick={() => onDelete(food.key)}
                                        disabled={deleting}
                                        aria-label="Supprimer"
                                    >
                                        <Trash2 className="text-destructive size-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    ) : null}
                    <div className="flex flex-col gap-3 border-t pt-3">
                        <p className="text-sm font-semibold">
                            {editingKey ? "Modifier l'aliment" : "Nouvel aliment"}
                        </p>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="food-name">Nom</Label>
                            <Input
                                id="food-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Ex. Poulet grillé"
                                className="h-11"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="food-portion">Portion</Label>
                                <Input
                                    id="food-portion"
                                    value={portionLabel}
                                    onChange={(e) => setPortionLabel(e.target.value)}
                                    placeholder="1 paume"
                                    className="h-11"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="food-metric">Équivalent (g/ml)</Label>
                                <Input
                                    id="food-metric"
                                    value={metric}
                                    onChange={(e) => setMetric(e.target.value)}
                                    placeholder="≈120 g"
                                    className="h-11"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="food-protein">Protéines (g)</Label>
                                <Input
                                    id="food-protein"
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    value={protein}
                                    onChange={(e) => setProtein(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="food-calories">Calories</Label>
                                <Input
                                    id="food-calories"
                                    type="number"
                                    inputMode="decimal"
                                    min={0}
                                    value={calories}
                                    onChange={(e) => setCalories(e.target.value)}
                                    className="h-11"
                                />
                            </div>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Catégorie</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {CATEGORIES.map((cat) => (
                                    <button
                                        key={cat}
                                        type="button"
                                        onClick={() => setCategory(cat)}
                                        className={cn(
                                            "rounded-full px-3 py-1.5 text-xs transition-colors",
                                            category === cat
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted",
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {editingKey ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    onClick={reset}
                                    disabled={saving}
                                >
                                    Annuler
                                </Button>
                            ) : null}
                            <Button
                                type="button"
                                className="h-11 flex-1"
                                onClick={onSubmit}
                                disabled={saving}
                            >
                                {saving ? (
                                    <Loader2 className="size-4 animate-spin" />
                                ) : editingKey ? (
                                    "Enregistrer"
                                ) : (
                                    "Ajouter"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
