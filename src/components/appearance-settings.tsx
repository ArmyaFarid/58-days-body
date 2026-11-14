"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon, Type, Palette, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ACCENTS, saveAccent, type Accent } from "@/lib/accents";

const SIZES = [
    { key: "normal", label: "Normal" },
    { key: "moyen", label: "Moyen" },
    { key: "gros", label: "Gros" },
];

function Segmented({
    value,
    options,
    onChange,
}: {
    value: string;
    options: { key: string; label: string; icon?: React.ReactNode }[];
    onChange: (key: string) => void;
}) {
    return (
        <div className="bg-muted flex gap-1 rounded-lg p-1">
            {options.map((o) => (
                <button
                    key={o.key}
                    type="button"
                    onClick={() => onChange(o.key)}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                        value === o.key
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground",
                    )}
                >
                    {o.icon}
                    {o.label}
                </button>
            ))}
        </div>
    );
}

export function AppearanceSettings() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [size, setSize] = useState("normal");
    const [accent, setAccent] = useState<Accent>("citron");

    useEffect(() => {
        setMounted(true);
        setSize(document.documentElement.getAttribute("data-size") || "normal");
        setAccent((document.documentElement.getAttribute("data-accent") as Accent | null) ?? "citron");
    }, []);

    function chooseAccent(a: Accent) {
        setAccent(a);
        saveAccent(a);
    }

    function chooseSize(s: string) {
        setSize(s);
        document.documentElement.setAttribute("data-size", s);
        try {
            localStorage.setItem("ui-size", s);
        } catch {
            // localStorage indisponible : la taille reste appliquée pour la session.
        }
    }

    const currentTheme = mounted ? (theme === "dark" ? "dark" : "light") : "light";

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Thème</span>
                <Segmented
                    value={currentTheme}
                    onChange={setTheme}
                    options={[
                        { key: "light", label: "Clair", icon: <Sun className="size-4" /> },
                        { key: "dark", label: "Sombre", icon: <Moon className="size-4" /> },
                    ]}
                />
            </div>
            <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Palette className="size-4" />
                    Couleur
                </span>
                <div className="grid grid-cols-4 gap-2">
                    {ACCENTS.map((a) => (
                        <button
                            key={a.key}
                            type="button"
                            onClick={() => chooseAccent(a.key)}
                            aria-pressed={accent === a.key}
                            className={cn(
                                "flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-xs font-medium transition-colors",
                                accent === a.key ? "border-foreground" : "border-transparent bg-muted",
                            )}
                        >
                            <span
                                className="flex size-9 items-center justify-center rounded-full text-[#0e0f12]"
                                style={{ backgroundColor: a.color }}
                            >
                                {accent === a.key ? <Check className="size-5" strokeWidth={3} /> : null}
                            </span>
                            {a.label}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex flex-col gap-2">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                    <Type className="size-4" />
                    Taille de l&apos;affichage
                </span>
                <Segmented value={size} onChange={chooseSize} options={SIZES} />
                <p className="text-muted-foreground text-xs">
                    Agrandit le texte et les icônes pour une meilleure lisibilité.
                </p>
            </div>
        </div>
    );
}
