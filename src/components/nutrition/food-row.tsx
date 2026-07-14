"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Food } from "@/lib/nutrition";

export function FoodRow({
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
                    {food.portionLabel} ({food.metric}) · {food.protein} g · {food.calories} kcal
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
