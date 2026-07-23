import { ChevronRight, Download } from "lucide-react";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import type { Program } from "@/lib/program";

const PHASES = [
    {
        label: "Phase 1 — prise rapide (jours 1–40)",
        text: "2 200 kcal · 100 g protéines · ~70 g lipides. Surplus marqué pour construire du volume.",
    },
    {
        label: "Phase 2 — progression normale (jour 41+)",
        text: "1 950 kcal · 100 g protéines. Sans date de fin, jusqu'au poids cible défini dans les réglages.",
    },
];

const PROGRESSION = [
    "Double progression : quand tu atteins le haut de la fourchette sur toutes les séries, passe à la variante plus dure.",
    "Pont deux jambes → une jambe → pieds surélevés.",
    "Pompes inclinées → appui plus bas → au sol.",
    "Squat → tempo plus lent → squat bulgare.",
    "Séries menées à 2–3 reps de l'échec, jamais à l'échec. Repos 60–90 s.",
];

export function FemmeProgrammeSummary({ program }: { program: Program }) {
    const sessions = Object.values(program.sessions);
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="pt-2">
                <h1 className="text-2xl font-bold tracking-tight">Programme</h1>
                <p className="text-muted-foreground text-sm">
                    Prise de masse — femme · 3 séances/semaine (lun/mer/ven), tapis de yoga, accent
                    fessiers.
                </p>
            </div>

            <Accordion defaultValue={["phases"]} className="rounded-xl border px-4">
                <AccordionItem value="phases">
                    <AccordionTrigger>Les 2 phases</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-2">
                        {PHASES.map((p) => (
                            <div key={p.label}>
                                <p className="font-medium">{p.label}</p>
                                <p className="text-muted-foreground text-sm">{p.text}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="seances">
                    <AccordionTrigger>Les 3 séances</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-3">
                        {sessions.map((s) => (
                            <div key={s.dayType}>
                                <p className="font-medium">{s.title}</p>
                                <p className="text-muted-foreground text-xs">{s.focus}</p>
                                <ul className="mt-1 flex flex-col gap-0.5">
                                    {s.exercises.map((ex) => (
                                        <li key={ex.key} className="flex justify-between gap-2 text-sm">
                                            <span>{ex.name}</span>
                                            <span className="text-muted-foreground shrink-0">
                                                {ex.sets} × {ex.reps}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="progression">
                    <AccordionTrigger>Progression</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-1.5">
                        {PROGRESSION.map((t) => (
                            <p key={t} className="text-muted-foreground text-sm">
                                {t}
                            </p>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="lexique">
                    <AccordionTrigger>Lexique des exercices</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-3">
                        {Object.entries(program.lexicon).map(([key, entry]) => (
                            <div key={key}>
                                <p className="font-medium">{entry.name}</p>
                                <p className="text-muted-foreground text-sm">{entry.text}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            <a href="/api/export" download>
                <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center gap-3 py-4">
                        <Download className="text-primary size-5" />
                        <div className="flex-1">
                            <p className="font-medium">Exporter mes données</p>
                            <p className="text-muted-foreground text-sm">
                                Télécharge tout ton historique en JSON.
                            </p>
                        </div>
                        <ChevronRight className="text-muted-foreground size-4" />
                    </CardContent>
                </Card>
            </a>
        </div>
    );
}
