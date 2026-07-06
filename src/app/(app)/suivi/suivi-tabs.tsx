"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const VALID = ["poids", "photos", "mensurations", "historique"];

interface SuiviTabsProps {
    initialTab?: string;
    poids: React.ReactNode;
    photos: React.ReactNode;
    mensurations: React.ReactNode;
    historique: React.ReactNode;
}

export function SuiviTabs({ initialTab, poids, photos, mensurations, historique }: SuiviTabsProps) {
    const [active, setActive] = useState(
        initialTab && VALID.includes(initialTab) ? initialTab : "poids",
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
                <TabsTrigger value="poids">Poids</TabsTrigger>
                <TabsTrigger value="photos">Photos</TabsTrigger>
                <TabsTrigger value="mensurations">Mensur.</TabsTrigger>
                <TabsTrigger value="historique">Perf</TabsTrigger>
            </TabsList>
            <TabsContent value="poids" className="pt-4" keepMounted>
                {poids}
            </TabsContent>
            <TabsContent value="photos" className="pt-4" keepMounted>
                {photos}
            </TabsContent>
            <TabsContent value="mensurations" className="pt-4" keepMounted>
                {mensurations}
            </TabsContent>
            <TabsContent value="historique" className="pt-4" keepMounted>
                {historique}
            </TabsContent>
        </Tabs>
    );
}
