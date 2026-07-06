"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);

    const isDark = mounted && resolvedTheme === "dark";

    return (
        <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground"
            aria-label="Basculer le thème"
            onClick={() => setTheme(isDark ? "light" : "dark")}
        >
            {isDark ? <Moon className="size-5" /> : <Sun className="size-5" />}
        </Button>
    );
}
