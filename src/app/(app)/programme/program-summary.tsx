import { ChevronRight, Download } from "lucide-react";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import { EquipmentBadges } from "@/components/equipment-badges";
import type { Program } from "@/lib/program";

/** Page Programme générée depuis la définition (objectif, sections, séances, lexique). */
export function ProgramSummary({ program }: { program: Program }) {
    const sessions = Object.values(program.sessions);
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex flex-col gap-2 pt-2">
                <h1 className="text-2xl font-bold tracking-tight">{program.label}</h1>
                {program.objective ? (
                    <p className="text-muted-foreground text-sm">{program.objective}</p>
                ) : null}
                <EquipmentBadges program={program} />
            </div>

            <Accordion defaultValue={[program.summary?.[0]?.title ?? "seances"]} className="rounded-xl border px-4">
                {(program.summary ?? []).map((section) => (
                    <AccordionItem key={section.title} value={section.title}>
                        <AccordionTrigger>{section.title}</AccordionTrigger>
                        <AccordionContent className="flex flex-col gap-1.5">
                            {section.items.map((t) => (
                                <p key={t} className="text-muted-foreground text-sm">
                                    {t}
                                </p>
                            ))}
                        </AccordionContent>
                    </AccordionItem>
                ))}

                <AccordionItem value="seances">
                    <AccordionTrigger>Les séances</AccordionTrigger>
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
