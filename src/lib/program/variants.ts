// Échelles de variantes (progressions) par exercice, du plus facile au plus dur.
// Clé = clé d'exercice. « Standard » (= aucune variante) est implicite ; ces
// entrées sont les crans plus durs. L'utilisateur peut aussi saisir une variante
// manuelle. N'affecte que les programmes dont `features.variants` est vrai.

export const EXERCISE_VARIANTS: Record<string, string[]> = {
    // ─── Poussée ───
    "pompes-declinees": ["Pieds plus hauts", "Archer", "Une main surélevée"],
    "pompes-standards": ["Pieds surélevés", "Déclinées", "Diamant", "Archer"],
    "pompes-diamant": ["Pieds surélevés", "Archer"],
    "pompes-pseudo-planche": ["Pieds surélevés", "Négatives planche"],
    "dips-chaises": ["Pieds surélevés", "Lesté (sac)"],
    "pike-push-ups": ["Pieds surélevés", "Déficit (livres)", "Contre le mur"],
    "developpe-epaules-bande": ["Bande plus courte", "Tempo 3 s"],
    "extension-triceps-oh": ["Bande plus courte", "Tempo 3 s"],
    "elevations-laterales": ["Tempo 3 s", "Bande plus courte"],
    "upright-row": ["Bande plus courte", "Tempo 3 s"],

    // ─── Tirage ───
    tractions: ["Prise large", "Tempo 3 s", "Lestées", "L-sit"],
    "rowing-inverse": ["Pieds surélevés", "Tempo 3 s", "Une main"],
    "tirage-bande-assis": ["Bande plus courte", "Tempo 3 s"],
    "face-pull": ["Bande plus courte", "Tempo 3 s"],
    "pull-over-bande": ["Bande plus courte", "Tempo 3 s"],
    "curl-bande": ["Bande plus courte", "Tempo 3 s", "21s"],
    "curl-marteau": ["Bande plus courte", "Tempo 3 s"],
    "curl-concentre": ["Tempo 3 s", "Négatives lentes"],
    "curl-inverse": ["Bande plus courte", "Tempo 3 s"],
    "dead-hang": ["Une main (assistée)", "Lesté"],

    // ─── Jambes / abdos ───
    "squat-bulgare": ["Tempo 3 s", "Sauté", "Lesté (sac)"],
    "pistol-squat": ["Sur une marche", "Amplitude complète", "Lesté"],
    "good-morning": ["Bande plus courte", "Tempo 3 s"],
    "pont-fessier-unilateral": ["Pied surélevé", "Lesté sur les hanches"],
    mollets: ["Tempo 3 s", "Lesté"],
    "releves-jambes": ["Jambes tendues", "Toes-to-bar"],
    "crunch-bande": ["Bande plus courte", "Tempo lent"],
    shrugs: ["Bande plus courte", "Tempo 3 s"],
    "elevations-buste-penche": ["Tempo 3 s", "Bande plus courte"],
};

export function variantsFor(exerciseKey: string): string[] {
    return EXERCISE_VARIANTS[exerciseKey] ?? [];
}
