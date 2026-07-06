"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
    username: z.string().min(3, "Min. 3 caractères"),
    password: z.string().min(4, "Min. 4 caractères"),
    inviteCode: z.string().min(1, "Requis"),
});

type Values = z.infer<typeof schema>;

export default function SignupPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<Values>({
        resolver: zodResolver(schema),
        defaultValues: { username: "", password: "", inviteCode: "" },
    });

    async function onSubmit(values: Values) {
        setError(null);
        const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(values),
        });
        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            setError(data.error ?? "Inscription impossible.");
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
                        <UserPlus className="size-6" />
                    </div>
                    <CardTitle className="text-xl">Créer un compte</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="username">Identifiant</Label>
                            <Input
                                id="username"
                                autoComplete="username"
                                autoCapitalize="none"
                                className="h-11"
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
                                autoComplete="new-password"
                                className="h-11"
                                {...register("password")}
                            />
                            {errors.password ? (
                                <p className="text-sm text-destructive">{errors.password.message}</p>
                            ) : null}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="inviteCode">Code d&apos;invitation</Label>
                            <Input
                                id="inviteCode"
                                autoComplete="off"
                                className="h-11"
                                {...register("inviteCode")}
                            />
                            {errors.inviteCode ? (
                                <p className="text-sm text-destructive">
                                    {errors.inviteCode.message}
                                </p>
                            ) : null}
                        </div>
                        {error ? <p className="text-sm text-destructive">{error}</p> : null}
                        <Button type="submit" className="h-11 w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Créer"}
                        </Button>
                        <a
                            href="/login"
                            className="text-muted-foreground text-center text-sm hover:underline"
                        >
                            J&apos;ai déjà un compte
                        </a>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
