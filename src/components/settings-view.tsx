"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, KeyRound, TriangleAlert, Palette, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppearanceSettings } from "@/components/appearance-settings";
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
import { changePasswordAction, resetAllAction, setNutritionGoalsAction } from "@/lib/actions";

const passwordSchema = z
    .object({
        current: z.string().min(1, "Requis"),
        next: z.string().min(4, "Minimum 4 caractères"),
        confirm: z.string().min(1, "Requis"),
    })
    .refine((d) => d.next === d.confirm, {
        message: "Les mots de passe ne correspondent pas",
        path: ["confirm"],
    });

type PasswordValues = z.infer<typeof passwordSchema>;

interface SettingsViewProps {
    proteinGoal: number;
    calorieGoal: number;
}

export function SettingsView({ proteinGoal, calorieGoal }: SettingsViewProps) {
    const router = useRouter();
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<PasswordValues>({
        resolver: zodResolver(passwordSchema),
        defaultValues: { current: "", next: "", confirm: "" },
    });

    async function onChangePassword(values: PasswordValues) {
        try {
            await changePasswordAction(values.current, values.next);
            toast.success("Mot de passe changé.");
            reset();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Échec du changement.");
        }
    }

    const [resetOpen, setResetOpen] = useState(false);
    const [resetting, startReset] = useTransition();

    const [protein, setProtein] = useState(String(proteinGoal));
    const [calorie, setCalorie] = useState(String(calorieGoal));
    const [savingGoals, startGoals] = useTransition();

    function onSaveGoals() {
        const p = parseInt(protein, 10);
        const c = parseInt(calorie, 10);
        if (!Number.isFinite(p) || p <= 0 || !Number.isFinite(c) || c <= 0) {
            toast.error("Valeurs invalides.");
            return;
        }
        startGoals(async () => {
            try {
                await setNutritionGoalsAction({ proteinGoal: p, calorieGoal: c });
                toast.success("Objectifs enregistrés.");
                router.refresh();
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    function onReset() {
        startReset(async () => {
            try {
                await resetAllAction();
                toast.success("Données réinitialisées.");
                setResetOpen(false);
                router.replace("/onboarding");
                router.refresh();
            } catch {
                toast.error("Échec de la réinitialisation.");
            }
        });
    }

    return (
        <div className="flex flex-col gap-4 p-4">
            <h1 className="pt-2 text-2xl font-bold tracking-tight">Paramètres</h1>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Palette className="size-4" />
                        Apparence
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <AppearanceSettings />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Target className="size-4" />
                        Objectifs nutrition
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="protein-goal">Protéines (g)</Label>
                            <Input
                                id="protein-goal"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                className="h-11"
                                value={protein}
                                onChange={(e) => setProtein(e.target.value)}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="calorie-goal">Calories (kcal)</Label>
                            <Input
                                id="calorie-goal"
                                type="number"
                                inputMode="numeric"
                                min={1}
                                className="h-11"
                                value={calorie}
                                onChange={(e) => setCalorie(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button type="button" className="h-11" onClick={onSaveGoals} disabled={savingGoals}>
                        {savingGoals ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <KeyRound className="size-4" />
                        Changer le mot de passe
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onChangePassword)}
                        className="flex flex-col gap-3"
                    >
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="current">Mot de passe actuel</Label>
                            <Input
                                id="current"
                                type="password"
                                autoComplete="current-password"
                                className="h-11"
                                {...register("current")}
                            />
                            {errors.current ? (
                                <p className="text-destructive text-sm">{errors.current.message}</p>
                            ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="next">Nouveau mot de passe</Label>
                            <Input
                                id="next"
                                type="password"
                                autoComplete="new-password"
                                className="h-11"
                                {...register("next")}
                            />
                            {errors.next ? (
                                <p className="text-destructive text-sm">{errors.next.message}</p>
                            ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="confirm">Confirmer</Label>
                            <Input
                                id="confirm"
                                type="password"
                                autoComplete="new-password"
                                className="h-11"
                                {...register("confirm")}
                            />
                            {errors.confirm ? (
                                <p className="text-destructive text-sm">{errors.confirm.message}</p>
                            ) : null}
                        </div>
                        <Button type="submit" className="h-11" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Changer"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-destructive/40">
                <CardHeader>
                    <CardTitle className="text-destructive flex items-center gap-2 text-base">
                        <TriangleAlert className="size-4" />
                        Zone dangereuse
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-muted-foreground text-sm">
                        Réinitialiser efface toutes tes données (poids, séances, habitudes, photos,
                        mensurations) et te ramène à l&apos;onboarding. Ton mot de passe est conservé.
                        Irréversible.
                    </p>
                    <Dialog open={resetOpen} onOpenChange={setResetOpen}>
                        <DialogTrigger
                            render={
                                <Button variant="destructive" className="h-11">
                                    Réinitialiser toutes mes données
                                </Button>
                            }
                        />
                        <DialogContent className="max-w-sm">
                            <DialogHeader>
                                <DialogTitle>Tout effacer ?</DialogTitle>
                            </DialogHeader>
                            <p className="text-muted-foreground text-sm">
                                Cette action est définitive. Pense à exporter tes données avant
                                (Programme → Exporter).
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="h-11 flex-1"
                                    onClick={() => setResetOpen(false)}
                                    disabled={resetting}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="h-11 flex-1"
                                    onClick={onReset}
                                    disabled={resetting}
                                >
                                    {resetting ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : (
                                        "Effacer tout"
                                    )}
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>
        </div>
    );
}
