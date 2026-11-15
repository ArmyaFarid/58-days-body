import { Guide, GuideItem } from "./guide";

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

/** Guide du programme « Prise de masse — femme ». */
export function FemmeGuide() {
    return (
        <Guide>
            <GuideItem title="Les 2 phases nutrition">
                {PHASES.map((p) => (
                    <div key={p.label}>
                        <p className="font-medium">{p.label}</p>
                        <p className="text-muted-foreground">{p.text}</p>
                    </div>
                ))}
            </GuideItem>
            <GuideItem title="Progression">
                {PROGRESSION.map((t) => (
                    <p key={t} className="text-muted-foreground">
                        {t}
                    </p>
                ))}
            </GuideItem>
        </Guide>
    );
}
