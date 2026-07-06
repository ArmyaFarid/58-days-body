// Contenu de référence tiré de programme-final-58-jours.md, structuré pour
// affichage dans les pages Programme et Équipement.

export const PROFILE = "Homme, 24 ans, 1,79 m, ~65 kg, Chicoutimi (QC)";

export const NUTRITION_TARGETS: { label: string; value: string }[] = [
    { label: "Calories", value: "3 000 kcal / jour" },
    { label: "Protéines", value: "130–145 g" },
    { label: "Lipides", value: "80–90 g" },
    { label: "Glucides", value: "~400 g" },
    { label: "Prise visée", value: "+0,25 à 0,35 kg / semaine" },
];

export const MEALS: { moment: string; repas: string; prot: string }[] = [
    {
        moment: "Déjeuner",
        repas: "Gruau 100 g + lait + banane + 2 c. à s. beurre d'arachide + whey",
        prot: "40 g",
    },
    {
        moment: "Dîner",
        repas: "Meal prep : 150 g bœuf haché ou 2 cuisses de poulet + 250 g riz + légumes congelés",
        prot: "40 g",
    },
    {
        moment: "Collation",
        repas: "Yogourt grec + granola / œufs durs + fromage / smoothie lait-avoine-PB-banane",
        prot: "25–30 g",
    },
    {
        moment: "Souper",
        repas: "Pâtes + sauce + bœuf haché, ou 2 wraps thon-mayo",
        prot: "40 g",
    },
    { moment: "Soir", repas: "Fromage cottage ou lait + toast PB", prot: "15–20 g" },
];

export const BATCH_COOKING =
    "Batch cooking 1×/semaine (~1 h) : 1,5 kg de viande au four + grosse chaudronnée de riz + œufs durs = 8–10 repas prêts.";

export const GROCERY =
    "Avoine, riz 2 kg, pâtes + sauce, protéine en spécial (< 10 $/kg : bœuf haché ↔ cuisses ↔ porc ↔ thon), 2–3 douz. d'œufs, lait 4 L, yogourt grec, cottage, thon ×4, beurre d'arachide, bananes, légumes congelés, tortillas, lentilles. (Maxi/Super C, ~75–95 $/sem.)";

export const SUPPLEMENTS: { title: string; text: string }[] = [
    {
        title: "Créatine monohydrate 5 g/jour",
        text: "Tous les jours, n'importe quand, bien diluée. ~1 kg d'eau les 2 premières semaines : normal, pas du gras.",
    },
    {
        title: "Whey",
        text: "Si difficile d'atteindre 140 g de protéines (gros format en spécial).",
    },
    { title: "Caféine", text: "Café 45 min avant la séance, jamais après 14 h." },
    { title: "Vitamine D3", text: "1000–2000 UI/jour. Oméga-3 seulement si zéro poisson." },
    { title: "Inutiles", text: "BCAA, glutamine, boosters, brûleurs." },
];

export const DAY_TIMELINE: { time: string; action: string }[] = [
    { time: "7 h 00", action: "Lever, pesée, eau, déjeuner + créatine" },
    { time: "8 h – 12 h", action: "Cours / études" },
    { time: "12 h 00", action: "Dîner meal prep" },
    { time: "15 h 30", action: "Café + collation" },
    { time: "16 h 30", action: "Séance (40–55 min), corde en échauffement" },
    { time: "18 h 30", action: "Souper (plus gros repas)" },
    { time: "21 h 30", action: "Cottage ou lait + toast PB, écrans en baisse" },
    { time: "22 h 30", action: "Coucher, même heure chaque soir" },
];

export const OPTIMISATION_KEYS =
    "3 000 kcal + 140 g de protéines chaque jour · battre le carnet à chaque séance · 7,5–9 h de sommeil · zéro changement de programme · les 5 clés poussées près de l'échec (élévations latérales, tractions, pike push-ups, pompes déclinées, rowings).";

export const MISTAKES =
    "S'arrêter loin de l'échec « parce que c'est des élastiques », reps rapides sans excentrique contrôlée, sauter les élévations latérales, sous-manger, remplacer le sommeil par du volume, skater intensément la veille du jour jambes.";

export const EQUIPMENT: { name: string; note: string }[] = [
    { name: "Barre de traction de porte", note: "Le dos en V." },
    {
        name: "Lot de 3 bandes Domyos 10 / 20 / 30 kg",
        note: "Empilables : 30, 40, 50, 60 kg — épaules, bras, tirages.",
    },
    { name: "Poids du corps + table solide + 2 chaises stables", note: "La base de tout." },
    { name: "Corde à sauter", note: "Échauffement et conditionnement." },
    { name: "Cruiser board", note: "Récupération active les jours off." },
    {
        name: "Sac à dos lesté (optionnel)",
        note: "Rempli de livres pour lester pompes/dips/tractions — seulement si trop facile.",
    },
    { name: "Tapis", note: "Une serviette pliée suffit." },
];

export const BAND_TIP =
    "La résistance indiquée vaut quand la bande est étirée au double de sa longueur. Pour durcir : raccourcis la bande (prends-la plus bas / élargis ta position), empile deux bandes, ou ralentis le tempo. Pour faciliter : l'inverse. Objectif partout : finir chaque série à 0–2 reps de l'échec.";
