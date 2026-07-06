"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { setStartDateAction, upsertWeightAction } from "@/lib/actions";

const schema = z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date requise"),
    weight: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function OnboardingForm({ defaultDate }: { defaultDate: string }) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { startDate: defaultDate, weight: "" },
    });

    async function onSubmit(values: Values) {
        try {
            await setStartDateAction(values.startDate);
            const kg = values.weight ? parseFloat(values.weight.replace(",", ".")) : NaN;
            if (Number.isFinite(kg) && kg > 0) {
                await upsertWeightAction(values.startDate, kg);
            }
            router.replace("/");
            router.refresh();
        } catch {
            toast.error("Impossible d'enregistrer.");
        }
    }

    return (
        <div className="flex min-h-full flex-1 items-center justify-center p-6">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <CalendarDays className="size-6" />
                    </div>
                    <CardTitle className="text-xl">Ton jour 1</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <p className="text-muted-foreground text-sm">
                            Choisis la date de début du programme. Elle sert à calculer ton jour et ta
                            phase. Rappel : photo du jour 1 aujourd&apos;hui.
                        </p>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="startDate">Date de début</Label>
                            <Input
                                id="startDate"
                                type="date"
                                className="h-11"
                                {...register("startDate")}
                            />
                            {errors.startDate ? (
                                <p className="text-destructive text-sm">{errors.startDate.message}</p>
                            ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="weight">Poids du jour 1 (optionnel)</Label>
                            <Input
                                id="weight"
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                placeholder="kg"
                                className="h-11"
                                {...register("weight")}
                            />
                        </div>
                        <p className="text-muted-foreground text-xs">
                            Pense à prendre tes photos du jour 1 : tu les ajouteras dans Suivi →
                            Photos (tu peux choisir la date).
                        </p>
                        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Commencer"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
