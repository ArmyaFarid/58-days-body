import { getSession } from "@/lib/auth";
import { getActiveProgram } from "@/lib/data/user-programs";
import { PROGRESSION_LEVERS, BLOC2_TECHNIQUES, EXERCISE_RANKING, type Program } from "@/lib/program";
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
import { todayISO } from "@/lib/date";
import { FemmeGuide } from "./femme-summary";
import { SummaryGuide } from "./program-summary";
import { Guide, GuideItem } from "./guide";
import { ProgrammeOverview } from "./programme-overview";

/** Guide du programme 58 jours (référence complète). */
function Programme58Guide() {
    return (
        <Guide>
            <GuideItem title="Pour qui">
                <p className="text-muted-foreground">{PROFILE}</p>
            </GuideItem>
            <GuideItem title="Nutrition — 50 % de la transformation">
                <div className="grid grid-cols-2 gap-2">
                    {NUTRITION_TARGETS.map((t) => (
                        <div key={t.label} className="bg-muted rounded-xl p-2.5">
                            <p className="text-muted-foreground text-xs">{t.label}</p>
                            <p className="font-semibold">{t.value}</p>
                        </div>
                    ))}
                </div>
                {MEALS.map((m) => (
                    <div key={m.moment} className="border-b pb-2 last:border-0">
                        <p className="flex justify-between font-medium">
                            <span>{m.moment}</span>
                            <span className="text-muted-foreground">{m.prot}</span>
                        </p>
                        <p className="text-muted-foreground">{m.repas}</p>
                    </div>
                ))}
                <p className="text-muted-foreground">{BATCH_COOKING}</p>
            </GuideItem>
            <GuideItem title="Épicerie hebdo">
                <p className="text-muted-foreground">{GROCERY}</p>
            </GuideItem>
            <GuideItem title="Suppléments">
                {SUPPLEMENTS.map((s) => (
                    <div key={s.title}>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-muted-foreground">{s.text}</p>
                    </div>
                ))}
            </GuideItem>
            <GuideItem title="Progression">
                {PROGRESSION_LEVERS.map((l, i) => (
                    <div key={l.title}>
                        <p className="font-medium">
                            {i + 1}. {l.title}
                        </p>
                        <p className="text-muted-foreground">{l.text}</p>
                    </div>
                ))}
                <p className="bg-muted rounded-xl p-3">
                    Jalon clé : passer des tractions assistées aux tractions strictes, puis monter les reps.
                </p>
            </GuideItem>
            <GuideItem title="Intensification (Bloc 2)">
                {BLOC2_TECHNIQUES.map((t) => (
                    <div key={t.title}>
                        <p className="font-medium">{t.title}</p>
                        <p className="text-muted-foreground">{t.text}</p>
                    </div>
                ))}
            </GuideItem>
            <GuideItem title="Exercices par efficacité">
                <ol className="flex flex-col gap-1.5">
                    {EXERCISE_RANKING.map((e, i) => (
                        <li key={e} className="flex gap-2">
                            <span className="text-muted-foreground w-5">{i + 1}.</span>
                            <span>{e}</span>
                        </li>
                    ))}
                </ol>
            </GuideItem>
            <GuideItem title="Journée type">
                {DAY_TIMELINE.map((d) => (
                    <div key={d.time} className="flex gap-3">
                        <span className="text-muted-foreground w-20 shrink-0">{d.time}</span>
                        <span>{d.action}</span>
                    </div>
                ))}
            </GuideItem>
            <GuideItem title="Optimisation maximale">
                <div>
                    <p className="font-medium">Les 20 % qui font 80 %</p>
                    <p className="text-muted-foreground">{OPTIMISATION_KEYS}</p>
                </div>
                <div>
                    <p className="font-medium">Erreurs à éviter</p>
                    <p className="text-muted-foreground">{MISTAKES}</p>
                </div>
            </GuideItem>
        </Guide>
    );
}

function guideFor(program: Program) {
    if (program.id === "masse-femme") return <FemmeGuide />;
    if (program.summary) return <SummaryGuide program={program} />;
    return <Programme58Guide />;
}

export default async function ProgrammePage() {
    const { userId } = (await getSession())!;
    const { program, row } = (await getActiveProgram(userId))!;
    return <ProgrammeOverview program={program} row={row} today={todayISO()} guide={guideFor(program)} />;
}
