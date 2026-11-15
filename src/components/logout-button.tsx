"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    const router = useRouter();

    async function onLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
    }

    return (
        <Button variant="ghost" size="sm" onClick={onLogout} className="text-muted-foreground">
            <LogOut className="size-4" />
            Quitter
        </Button>
    );
}

/** Ligne « Se déconnecter » (menu des paramètres). */
export function LogoutRow() {
    const router = useRouter();

    async function onLogout() {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
    }

    return (
        <button
            type="button"
            onClick={onLogout}
            className="bg-card text-muted-foreground flex h-12 items-center justify-center gap-2 rounded-[1.25rem] text-sm font-semibold"
        >
            <LogOut className="size-4" />
            Se déconnecter
        </button>
    );
}
