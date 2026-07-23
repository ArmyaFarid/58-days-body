"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export interface SuiviTab {
    value: string;
    label: string;
    content: React.ReactNode;
}

interface SuiviTabsProps {
    initialTab?: string;
    tabs: SuiviTab[];
}

export function SuiviTabs({ initialTab, tabs }: SuiviTabsProps) {
    const values = tabs.map((t) => t.value);
    const [active, setActive] = useState(
        initialTab && values.includes(initialTab) ? initialTab : values[0],
    );

    function onChange(value: string) {
        setActive(value);
        // Met à jour l'URL sans recharger : le reload restaure l'onglet.
        const url = new URL(window.location.href);
        url.searchParams.set("tab", value);
        window.history.replaceState(null, "", url);
    }

    return (
        <Tabs value={active} onValueChange={(v) => onChange(String(v))} className="p-4">
            <TabsList className="w-full">
                {tabs.map((t) => (
                    <TabsTrigger key={t.value} value={t.value}>
                        {t.label}
                    </TabsTrigger>
                ))}
            </TabsList>
            {tabs.map((t) => (
                <TabsContent key={t.value} value={t.value} className="pt-4" keepMounted>
                    {t.content}
                </TabsContent>
            ))}
        </Tabs>
    );
}
