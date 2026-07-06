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
