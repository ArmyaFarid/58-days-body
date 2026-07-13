"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
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
import { addCustomFoodAction } from "@/lib/actions";

export function AddFoodDialog({ onAdded }: { onAdded: (food: Food) => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [portionLabel, setPortionLabel] = useState("");
    const [metric, setMetric] = useState("");
    const [protein, setProtein] = useState("");
    const [calories, setCalories] = useState("");
    const [category, setCategory] = useState<FoodCategory>(CATEGORIES[0]);
    const [saving, startSaving] = useTransition();

    function reset() {
        setName("");
        setPortionLabel("");
        setMetric("");
        setProtein("");
        setCalories("");
        setCategory(CATEGORIES[0]);
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
        startSaving(async () => {
            try {
                const food = await addCustomFoodAction({
                    name: name.trim(),
                    portionLabel: portionLabel.trim(),
                    metric: metric.trim(),
                    protein: p,
                    calories: c,
                    category,
                });
                onAdded(food);
                toast.success("Aliment ajouté.");
                reset();
                setOpen(false);
            } catch {
                toast.error("Ajout impossible.");
            }
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button type="button" variant="outline" className="h-10 w-full">
                        <Plus className="size-4" />
                        Ajouter un aliment
                    </Button>
                }
            />
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nouvel aliment</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
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
                    <Button type="button" className="h-11" onClick={onSubmit} disabled={saving}>
                        {saving ? <Loader2 className="size-4 animate-spin" /> : "Ajouter"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
