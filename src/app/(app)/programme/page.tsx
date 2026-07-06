import Link from "next/link";
import { Dumbbell, ChevronRight, Download } from "lucide-react";
import {
    Accordion,
    AccordionItem,
    AccordionTrigger,
    AccordionContent,
} from "@/components/ui/accordion";
import { Card, CardContent } from "@/components/ui/card";
import {
    PHASES,
    PROGRESSION_LEVERS,
    BLOC2_TECHNIQUES,
    EXERCISE_RANKING,
    LEXICON,
} from "@/lib/program";
import {
    PROFILE,
    NUTRITION_TARGETS,
    MEALS,
    BATCH_COOKING,
    GROCERY,
    SUPPLEMENTS,
    DAY_TIMELINE,
    OPTIMISATION_KEYS,
    MISTAKES,
} from "@/lib/program/reference";

export default function ProgrammePage() {
    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="pt-2">
                <h1 className="text-2xl font-bold tracking-tight">Programme</h1>
                <p className="text-muted-foreground text-sm">{PROFILE}</p>
            </div>

            <Link href="/equipement">
                <Card className="transition-colors hover:bg-muted/50">
                    <CardContent className="flex items-center gap-3 py-4">
                        <Dumbbell className="text-primary size-5" />
                        <span className="flex-1 font-medium">Équipement</span>
                        <ChevronRight className="text-muted-foreground size-4" />
                    </CardContent>
                </Card>
            </Link>

            <Accordion defaultValue={["nutrition"]} className="rounded-xl border px-4">
                <AccordionItem value="nutrition">
                    <AccordionTrigger>Nutrition — 50 % de la transformation</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-2">
                            {NUTRITION_TARGETS.map((t) => (
                                <div key={t.label} className="bg-muted rounded-lg p-2.5">
                                    <p className="text-muted-foreground text-xs">{t.label}</p>
                                    <p className="font-semibold">{t.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            {MEALS.map((m) => (
                                <div key={m.moment} className="border-b pb-2 last:border-0">
                                    <p className="flex justify-between font-medium">
                                        <span>{m.moment}</span>
                                        <span className="text-muted-foreground">{m.prot}</span>
                                    </p>
                                    <p className="text-muted-foreground text-sm">{m.repas}</p>
                                </div>
                            ))}
                        </div>
                        <p className="text-muted-foreground text-sm">{BATCH_COOKING}</p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="epicerie">
                    <AccordionTrigger>Épicerie hebdo</AccordionTrigger>
                    <AccordionContent>
                        <p className="text-muted-foreground text-sm">{GROCERY}</p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="supplements">
                    <AccordionTrigger>Suppléments</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-2">
                        {SUPPLEMENTS.map((s) => (
                            <div key={s.title}>
                                <p className="font-medium">{s.title}</p>
                                <p className="text-muted-foreground text-sm">{s.text}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="phases">
                    <AccordionTrigger>Les 4 phases</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-2">
                        {PHASES.map((p) => (
                            <div key={p.key}>
                                <p className="font-medium">
                                    {p.label}{" "}
                                    <span className="text-muted-foreground font-normal">
                                        (jours {p.startDay}–{p.endDay})
                                    </span>
                                </p>
                                <p className="text-muted-foreground text-sm">{p.description}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="progression">
                    <AccordionTrigger>Progression</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-2">
                        {PROGRESSION_LEVERS.map((l, i) => (
                            <div key={l.title}>
                                <p className="font-medium">
                                    {i + 1}. {l.title}
                                </p>
                                <p className="text-muted-foreground text-sm">{l.text}</p>
                            </div>
                        ))}
                        <p className="bg-muted mt-1 rounded-lg p-3 text-sm">
                            Jalon clé : passer des tractions assistées aux tractions strictes, puis
                            monter les reps.
                        </p>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="bloc2">
                    <AccordionTrigger>Intensification (Bloc 2)</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-2">
                        {BLOC2_TECHNIQUES.map((t) => (
                            <div key={t.title}>
                                <p className="font-medium">{t.title}</p>
                                <p className="text-muted-foreground text-sm">{t.text}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="classement">
                    <AccordionTrigger>Exercices par efficacité</AccordionTrigger>
                    <AccordionContent>
                        <ol className="flex flex-col gap-1.5">
                            {EXERCISE_RANKING.map((e, i) => (
                                <li key={e} className="flex gap-2 text-sm">
                                    <span className="text-muted-foreground w-4">{i + 1}.</span>
                                    <span>{e}</span>
                                </li>
                            ))}
                        </ol>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="journee">
                    <AccordionTrigger>Journée type</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-1.5">
                        {DAY_TIMELINE.map((d) => (
                            <div key={d.time} className="flex gap-3 text-sm">
                                <span className="text-muted-foreground w-20 shrink-0">{d.time}</span>
                                <span>{d.action}</span>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="lexique">
                    <AccordionTrigger>Lexique des exercices</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-3">
                        {Object.entries(LEXICON).map(([key, entry]) => (
                            <div key={key}>
                                <p className="font-medium">{entry.name}</p>
                                <p className="text-muted-foreground text-sm">{entry.text}</p>
                            </div>
                        ))}
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="optimisation">
                    <AccordionTrigger>Optimisation maximale</AccordionTrigger>
                    <AccordionContent className="flex flex-col gap-2">
                        <div>
                            <p className="font-medium">Les 20 % qui font 80 %</p>
                            <p className="text-muted-foreground text-sm">{OPTIMISATION_KEYS}</p>
                        </div>
                        <div>
                            <p className="font-medium">Erreurs à éviter</p>
                            <p className="text-muted-foreground text-sm">{MISTAKES}</p>
                        </div>
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
