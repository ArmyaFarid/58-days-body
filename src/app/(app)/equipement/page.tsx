import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EQUIPMENT, BAND_TIP } from "@/lib/program/reference";

export default function EquipementPage() {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center gap-2 pt-2">
                <Button
                    render={<Link href="/programme" />}
                    variant="ghost"
                    size="icon"
                    aria-label="Retour"
                >
                    <ArrowLeft className="size-5" />
                </Button>
                <h1 className="text-2xl font-bold tracking-tight">Équipement</h1>
            </div>

            <div className="flex flex-col gap-2">
                {EQUIPMENT.map((e) => (
                    <Card key={e.name}>
                        <CardContent className="flex items-start gap-3 py-3">
                            <span className="bg-primary/10 text-primary mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md">
                                <Check className="size-4" />
                            </span>
                            <div>
                                <p className="font-medium">{e.name}</p>
                                <p className="text-muted-foreground text-sm">{e.note}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Réglage de la charge (bandes)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground text-sm">{BAND_TIP}</p>
                </CardContent>
            </Card>
        </div>
    );
}
