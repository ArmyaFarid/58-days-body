"use client";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SuiviTabsProps {
    poids: React.ReactNode;
    photos: React.ReactNode;
    mensurations: React.ReactNode;
    historique: React.ReactNode;
}

export function SuiviTabs({ poids, photos, mensurations, historique }: SuiviTabsProps) {
    return (
        <Tabs defaultValue="poids" className="p-4">
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
