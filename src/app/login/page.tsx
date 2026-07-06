"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dumbbell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const loginSchema = z.object({
    username: z.string().min(1, "Requis"),
    password: z.string().min(1, "Requis"),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: { username: "", password: "" },
    });

    async function onSubmit(values: LoginValues) {
        setError(null);
        const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Connexion impossible.");
            return;
        }
        router.replace("/");
        router.refresh();
    }

    return (
        <div className="flex min-h-full flex-1 items-center justify-center p-6">
            <Card className="w-full max-w-sm">
                <CardHeader className="items-center text-center">
                    <div className="mb-2 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Dumbbell className="size-6" />
                    </div>
                    <CardTitle className="text-xl">Programme 58 jours</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="username">Identifiant</Label>
                            <Input
                                id="username"
                                autoComplete="username"
                                autoCapitalize="none"
                                {...register("username")}
                            />
                            {errors.username ? (
                                <p className="text-sm text-destructive">{errors.username.message}</p>
                            ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="password">Mot de passe</Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                {...register("password")}
                            />
                            {errors.password ? (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            ) : null}
                        </div>
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}
                        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Se connecter"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
