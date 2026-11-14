"use client";

import { useState, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Check, Moon, Sun } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ACCENTS, ACCENT_STORAGE_KEY, applyAccent, saveAccent, type Accent } from "@/lib/accents";

function subscribe(onChange: () => void) {
    window.addEventListener("storage", onChange);
    window.addEventListener("ui-accent-change", onChange);
    return () => {
        window.removeEventListener("storage", onChange);
        window.removeEventListener("ui-accent-change", onChange);
    };
}

function storedAccent(): string | null {
    try {
        return localStorage.getItem(ACCENT_STORAGE_KEY);
    } catch {
        // Pas de stockage : on ne redemande pas à chaque visite.
        return "citron";
    }
}

/** Au premier passage sur cet appareil : choisir sa couleur (et sombre / clair). */
export function ThemePicker() {
    // Côté serveur : rien d'enregistré n'est connu, on n'affiche rien.
    const stored = useSyncExternalStore(subscribe, storedAccent, () => "server");
    const [closed, setClosed] = useState(false);
    const [accent, setAccent] = useState<Accent>("citron");
    const { resolvedTheme, setTheme } = useTheme();
    const light = resolvedTheme === "light";

    const open = stored === null && !closed;

    function pick(a: Accent) {
        setAccent(a);
        applyAccent(a);
    }

    function confirm() {
        saveAccent(accent);
        setClosed(true);
    }

    return (
        <Dialog open={open} onOpenChange={(next) => (next ? null : confirm())}>
            <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-sm overflow-y-auto" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle className="font-heading text-2xl">Choisis ton thème</DialogTitle>
                    <DialogDescription>Tu pourras le changer quand tu veux dans Paramètres › Apparence.</DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-3">
                    {ACCENTS.map((a) => {
                        const selected = a.key === accent;
                        return (
                            <button
                                key={a.key}
                                type="button"
                                onClick={() => pick(a.key)}
                                aria-pressed={selected}
                                className={cn(
                                    "flex flex-col gap-2 rounded-2xl border-2 p-1.5 text-left transition-colors",
                                    selected ? "border-foreground" : "border-transparent",
                                )}
                            >
                                <span
                                    className="flex flex-col gap-2 rounded-xl p-2.5"
                                    style={{ backgroundColor: light ? "#f6f7f9" : a.ground }}
                                >
                                    <span className="flex items-center gap-2">
                                        <svg viewBox="0 0 40 40" className="size-8 shrink-0" aria-hidden>
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="15"
                                                fill="none"
                                                strokeWidth="5"
                                                stroke={light ? "#e4e6ea" : "#2a2e36"}
                                            />
                                            <circle
                                                cx="20"
                                                cy="20"
                                                r="15"
                                                fill="none"
                                                strokeWidth="5"
                                                strokeLinecap="round"
                                                stroke={a.color}
                                                strokeDasharray="38 94"
                                                transform="rotate(-90 20 20)"
                                            />
                                        </svg>
                                        <span className="flex flex-1 flex-col gap-1">
                                            <span
                                                className="h-1.5 w-full rounded-full"
                                                style={{ backgroundColor: light ? "#d5d8de" : "#2a2e36" }}
                                            />
                                            <span
                                                className="h-1.5 w-2/3 rounded-full"
                                                style={{ backgroundColor: light ? "#d5d8de" : "#2a2e36" }}
                                            />
                                        </span>
                                    </span>
                                    <span
                                        className="flex h-8 items-center justify-center rounded-lg text-[0.6875rem] font-bold text-[#0e0f12]"
                                        style={{ backgroundColor: a.color }}
                                    >
                                        Démarrer
                                    </span>
                                </span>
                                <span className="flex items-center justify-between px-1 pb-0.5 text-sm font-semibold">
                                    {a.label}
                                    {selected ? <Check className="size-4" strokeWidth={3} /> : null}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <div className="bg-muted flex gap-1 rounded-xl p-1">
                    {[
                        { key: "dark", label: "Sombre", icon: <Moon className="size-4" /> },
                        { key: "light", label: "Clair", icon: <Sun className="size-4" /> },
                    ].map((m) => (
                        <button
                            key={m.key}
                            type="button"
                            onClick={() => setTheme(m.key)}
                            aria-pressed={(m.key === "light") === light}
                            className={cn(
                                "flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg text-sm font-medium",
                                (m.key === "light") === light
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground",
                            )}
                        >
                            {m.icon}
                            {m.label}
                        </button>
                    ))}
                </div>

                <button
                    type="button"
                    onClick={confirm}
                    className="bg-brand text-brand-foreground h-14 rounded-2xl text-base font-bold"
                >
                    C&apos;est parti
                </button>
            </DialogContent>
        </Dialog>
    );
}
