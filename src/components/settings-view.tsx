"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, KeyRound, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { changePasswordAction, resetAllAction } from "@/lib/actions";

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

export function SettingsView() {
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
