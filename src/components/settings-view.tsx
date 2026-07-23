"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, KeyRound, TriangleAlert, Palette, Target, Ticket, Copy } from "lucide-react";
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
import {
    changePasswordAction,
    resetAllAction,
    setNutritionGoalsAction,
    generateInviteCodeAction,
} from "@/lib/actions";

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

interface PhaseGoals {
    proteinGoal: number;
    calorieGoal: number;
    fatGoal: number | null;
}

interface SettingsViewProps {
    features: { trackFat: boolean; targetWeight: boolean; multiPhase: boolean };
    settings: {
        targetWeightKg: number | null;
        phase1: PhaseGoals;
        phase2: PhaseGoals;
    };
    inviteCodes: { code: string; used: boolean }[];
}

export function SettingsView({ features, settings, inviteCodes }: SettingsViewProps) {
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

    // Objectifs nutrition (phase 1 / phase 2).
    const [p1Protein, setP1Protein] = useState(String(settings.phase1.proteinGoal));
    const [p1Calorie, setP1Calorie] = useState(String(settings.phase1.calorieGoal));
    const [p1Fat, setP1Fat] = useState(String(settings.phase1.fatGoal ?? ""));
    const [p2Protein, setP2Protein] = useState(String(settings.phase2.proteinGoal));
    const [p2Calorie, setP2Calorie] = useState(String(settings.phase2.calorieGoal));
    const [p2Fat, setP2Fat] = useState(String(settings.phase2.fatGoal ?? ""));
    const [targetWeight, setTargetWeight] = useState(
        settings.targetWeightKg != null ? String(settings.targetWeightKg) : "",
    );
    const [savingGoals, startGoals] = useTransition();

    // Codes d'invitation.
    const [codes, setCodes] = useState(inviteCodes);
    const [generating, startGenerate] = useTransition();

    function onSaveGoals() {
        const p1p = parseInt(p1Protein, 10);
        const p1c = parseInt(p1Calorie, 10);
        if (!Number.isFinite(p1p) || p1p <= 0 || !Number.isFinite(p1c) || p1c <= 0) {
            toast.error("Objectifs de phase 1 invalides.");
            return;
        }
        const patch: Parameters<typeof setNutritionGoalsAction>[0] = {
            proteinGoal: p1p,
            calorieGoal: p1c,
        };
        if (features.trackFat) patch.fatGoal = Math.max(0, parseInt(p1Fat, 10) || 0);
        if (features.multiPhase) {
            const p2p = parseInt(p2Protein, 10);
            const p2c = parseInt(p2Calorie, 10);
            if (!Number.isFinite(p2p) || p2p <= 0 || !Number.isFinite(p2c) || p2c <= 0) {
                toast.error("Objectifs de phase 2 invalides.");
                return;
            }
            patch.proteinGoal2 = p2p;
            patch.calorieGoal2 = p2c;
            if (features.trackFat) patch.fatGoal2 = Math.max(0, parseInt(p2Fat, 10) || 0);
        }
        if (features.targetWeight && targetWeight.trim()) {
            const tw = parseFloat(targetWeight.replace(",", "."));
            if (!Number.isFinite(tw) || tw < 20 || tw > 400) {
                toast.error("Poids cible invalide.");
                return;
            }
            patch.targetWeightKg = tw;
        }
        startGoals(async () => {
            try {
                await setNutritionGoalsAction(patch);
                toast.success("Objectifs enregistrés.");
                router.refresh();
            } catch {
                toast.error("Échec de l'enregistrement.");
            }
        });
    }

    function onGenerate() {
        startGenerate(async () => {
            try {
                const code = await generateInviteCodeAction();
                setCodes((prev) => [{ code, used: false }, ...prev]);
                toast.success("Code généré.");
            } catch {
                toast.error("Génération impossible.");
            }
        });
    }

    async function copyCode(code: string) {
        try {
            await navigator.clipboard.writeText(code);
            toast.success("Code copié.");
        } catch {
            toast.error("Copie impossible.");
        }
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
                    {features.multiPhase ? (
                        <p className="text-muted-foreground text-sm font-medium">Phase 1 (prise rapide)</p>
                    ) : null}
                    <GoalInputs
                        idPrefix="p1"
                        protein={p1Protein}
                        calorie={p1Calorie}
                        fat={p1Fat}
                        showFat={features.trackFat}
                        onProtein={setP1Protein}
                        onCalorie={setP1Calorie}
                        onFat={setP1Fat}
                    />
                    {features.multiPhase ? (
                        <>
                            <p className="text-muted-foreground mt-1 text-sm font-medium">
                                Phase 2 (progression normale)
                            </p>
                            <GoalInputs
                                idPrefix="p2"
                                protein={p2Protein}
                                calorie={p2Calorie}
                                fat={p2Fat}
                                showFat={features.trackFat}
                                onProtein={setP2Protein}
                                onCalorie={setP2Calorie}
                                onFat={setP2Fat}
                            />
                        </>
                    ) : null}
                    {features.targetWeight ? (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="target-weight">Poids cible (kg)</Label>
                            <Input
                                id="target-weight"
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                className="h-11"
                                value={targetWeight}
                                onChange={(e) => setTargetWeight(e.target.value)}
                            />
                        </div>
                    ) : null}
                    <Button type="button" className="h-11" onClick={onSaveGoals} disabled={savingGoals}>
                        {savingGoals ? <Loader2 className="size-4 animate-spin" /> : "Enregistrer"}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <Ticket className="size-4" />
                        Inviter quelqu&apos;un
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-3">
                    <p className="text-muted-foreground text-sm">
                        Génère un code d&apos;invitation à usage unique. La personne crée son compte et
                        choisit son programme à l&apos;inscription.
                    </p>
                    <Button type="button" variant="outline" className="h-11" onClick={onGenerate} disabled={generating}>
                        {generating ? <Loader2 className="size-4 animate-spin" /> : "Générer un code"}
                    </Button>
                    {codes.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                            {codes.map((c) => (
                                <li
                                    key={c.code}
                                    className="border-border/60 flex items-center gap-2 rounded-lg border p-2.5"
                                >
                                    <span className="font-mono text-sm tracking-wider">{c.code}</span>
                                    {c.used ? (
                                        <span className="text-muted-foreground text-xs">utilisé</span>
                                    ) : (
                                        <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                            actif
                                        </span>
                                    )}
                                    {!c.used ? (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="ml-auto size-9"
                                            onClick={() => copyCode(c.code)}
                                            aria-label="Copier"
                                        >
                                            <Copy className="size-4" />
                                        </Button>
                                    ) : null}
                                </li>
                            ))}
                        </ul>
                    ) : null}
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
                    <form onSubmit={handleSubmit(onChangePassword)} className="flex flex-col gap-3">
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

function GoalInputs({
    idPrefix,
    protein,
    calorie,
    fat,
    showFat,
    onProtein,
    onCalorie,
    onFat,
}: {
    idPrefix: string;
    protein: string;
    calorie: string;
    fat: string;
    showFat: boolean;
    onProtein: (v: string) => void;
    onCalorie: (v: string) => void;
    onFat: (v: string) => void;
}) {
    return (
        <div className={showFat ? "grid grid-cols-3 gap-3" : "grid grid-cols-2 gap-3"}>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-protein`}>Protéines (g)</Label>
                <Input
                    id={`${idPrefix}-protein`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    className="h-11"
                    value={protein}
                    onChange={(e) => onProtein(e.target.value)}
                />
            </div>
            <div className="flex flex-col gap-1.5">
                <Label htmlFor={`${idPrefix}-calorie`}>Calories</Label>
                <Input
                    id={`${idPrefix}-calorie`}
                    type="number"
                    inputMode="numeric"
                    min={1}
                    className="h-11"
                    value={calorie}
                    onChange={(e) => onCalorie(e.target.value)}
                />
            </div>
            {showFat ? (
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor={`${idPrefix}-fat`}>Lipides (g)</Label>
                    <Input
                        id={`${idPrefix}-fat`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        className="h-11"
                        value={fat}
                        onChange={(e) => onFat(e.target.value)}
                    />
                </div>
            ) : null}
        </div>
    );
}
