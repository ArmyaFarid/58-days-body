"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface SuiviTab {
    value: string;
    label: string;
    /** Élément affiché à droite du titre quand l'onglet est actif. */
    headerRight?: React.ReactNode;
    content: React.ReactNode;
}

interface SuiviTabsProps {
    initialTab?: string;
    tabs: SuiviTab[];
}

export function SuiviTabs({ initialTab, tabs }: SuiviTabsProps) {
    const values = tabs.map((t) => t.value);
    const [active, setActive] = useState(initialTab && values.includes(initialTab) ? initialTab : values[0]);
    const current = tabs.find((t) => t.value === active) ?? tabs[0];

    function onChange(value: string) {
        setActive(value);
        // Met à jour l'URL sans recharger : le reload restaure l'onglet.
        const url = new URL(window.location.href);
        url.searchParams.set("tab", value);
        window.history.replaceState(null, "", url);
    }

    return (
        <div className="flex flex-col gap-4 px-5 pt-4">
            <div className="flex min-h-9 items-end justify-between gap-3">
                <h1 className="font-heading text-[2.125rem] leading-none font-bold tracking-[-0.03125rem]">Suivi</h1>
                {current.headerRight}
            </div>

            <div
                role="tablist"
                className="bg-card grid gap-1 rounded-2xl p-1"
                style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
            >
                {tabs.map((t) => (
                    <button
                        key={t.value}
                        type="button"
                        role="tab"
                        aria-selected={t.value === active}
                        onClick={() => onChange(t.value)}
                        className={cn(
                            "h-10 min-w-0 truncate rounded-xl px-1 text-xs transition-colors",
                            t.value === active
                                ? "bg-brand text-brand-foreground font-bold"
                                : "text-muted-foreground font-semibold",
                        )}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Les onglets restent montés (saisies en cours conservées) ; display:none masque aussi leurs éléments fixes. */}
            {tabs.map((t) => (
                <div key={t.value} role="tabpanel" hidden={t.value !== active}>
                    {t.content}
                </div>
            ))}
        </div>
    );
}
