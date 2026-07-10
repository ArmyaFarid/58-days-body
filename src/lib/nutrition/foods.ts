// Catalogue d'aliments à portions intuitives (mesurables sans balance) et presets
// de repas. Régime halal (aucun produit de porc). Source de vérité côté config :
// ce que l'utilisateur sélectionne chaque jour est persisté en base (food_logs),
// mais les définitions (portions, macros) vivent ici — facile à éditer/étendre.

export type FoodCategory =
    | "Poissons et fruits de mer"
    | "Viandes et œufs"
    | "Produits laitiers"
    | "Glucides"
    | "Fruits et légumes"
    | "Lipides et extras";

export interface Food {
    key: string;
    name: string;
    /** Portion intuitive, ex. « 1 œuf », « 1 paume », « 1 poing serré ». */
    portionLabel: string;
    /** Protéines (g) pour 1 portion. */
    protein: number;
    /** Calories (kcal) pour 1 portion. */
    calories: number;
    category: FoodCategory;
}

/** Ordre d'affichage des catégories. */
export const CATEGORIES: FoodCategory[] = [
    "Viandes et œufs",
    "Poissons et fruits de mer",
    "Produits laitiers",
    "Glucides",
    "Fruits et légumes",
    "Lipides et extras",
];

export const FOODS: Food[] = [
    // ─── Poissons et fruits de mer ───
    {
        key: "poisson-entier",
        name: "Poisson entier (carpe, tilapia…) mangé complet",
        portionLabel: "1 poisson moyen",
        protein: 60,
        calories: 420,
        category: "Poissons et fruits de mer",
    },
    {
        key: "poisson-chair",
        name: "Poisson (chair)",
        portionLabel: "1 paume",
        protein: 30,
        calories: 210,
        category: "Poissons et fruits de mer",
    },
    {
        key: "tilapia-filet",
        name: "Filet de tilapia congelé",
        portionLabel: "1 filet",
        protein: 23,
        calories: 110,
        category: "Poissons et fruits de mer",
    },
    {
        key: "saumon",
        name: "Saumon",
        portionLabel: "1 paume ou 1 conserve",
        protein: 25,
        calories: 230,
        category: "Poissons et fruits de mer",
    },
    {
        key: "sardines",
        name: "Sardines",
        portionLabel: "1 conserve",
        protein: 22,
        calories: 190,
        category: "Poissons et fruits de mer",
    },
    {
        key: "thon",
        name: "Thon",
        portionLabel: "1 conserve",
        protein: 25,
        calories: 120,
        category: "Poissons et fruits de mer",
    },
    {
        key: "crevettes",
        name: "Crevettes",
        portionLabel: "1 poignée généreuse",
        protein: 20,
        calories: 100,
        category: "Poissons et fruits de mer",
    },
    {
        key: "goberge",
        name: "Goberge (imitation crabe)",
        portionLabel: "1 poignée",
        protein: 8,
        calories: 90,
        category: "Poissons et fruits de mer",
    },

    // ─── Viandes et œufs ───
    {
        key: "oeuf",
        name: "Œuf",
        portionLabel: "1 œuf",
        protein: 6,
        calories: 75,
        category: "Viandes et œufs",
    },
    {
        key: "poulet",
        name: "Poulet cuit",
        portionLabel: "1 paume entière épaisse",
        protein: 35,
        calories: 300,
        category: "Viandes et œufs",
    },
    {
        key: "boeuf-hache",
        name: "Bœuf haché cuit",
        portionLabel: "1 paume",
        protein: 32,
        calories: 330,
        category: "Viandes et œufs",
    },
    {
        key: "dinde-hachee",
        name: "Dinde hachée cuite",
        portionLabel: "1 paume",
        protein: 33,
        calories: 260,
        category: "Viandes et œufs",
    },
    {
        key: "saucisses-halal",
        name: "Saucisses halal (poulet/bœuf)",
        portionLabel: "2 saucisses",
        protein: 14,
        calories: 300,
        category: "Viandes et œufs",
    },
    {
        key: "boeuf-tranche",
        name: "Bœuf tranché halal (style smoked meat)",
        portionLabel: "3 tranches",
        protein: 15,
        calories: 100,
        category: "Viandes et œufs",
    },
    {
        key: "foie",
        name: "Foie (bœuf/poulet)",
        portionLabel: "1 paume",
        protein: 26,
        calories: 175,
        category: "Viandes et œufs",
    },

    // ─── Produits laitiers ───
    {
        key: "lait",
        name: "Lait",
        portionLabel: "1 verre (250 ml)",
        protein: 8,
        calories: 150,
        category: "Produits laitiers",
    },
    {
        key: "lait-evapore",
        name: "Lait évaporé",
        portionLabel: "1 petit verre (125 ml)",
        protein: 8,
        calories: 170,
        category: "Produits laitiers",
    },
    {
        key: "yogourt-grec",
        name: "Yogourt grec",
        portionLabel: "½ tasse ou 1 pot",
        protein: 9,
        calories: 60,
        category: "Produits laitiers",
    },
    {
        key: "yogourt-regulier",
        name: "Yogourt régulier (type Activia)",
        portionLabel: "1 pot individuel",
        protein: 4,
        calories: 90,
        category: "Produits laitiers",
    },
    {
        key: "cottage",
        name: "Fromage cottage",
        portionLabel: "½ tasse",
        protein: 13,
        calories: 110,
        category: "Produits laitiers",
    },
    {
        key: "fromage",
        name: "Fromage (cheddar/mozzarella)",
        portionLabel: "1 cube de 2 pouces",
        protein: 7,
        calories: 110,
        category: "Produits laitiers",
    },
    {
        key: "whey",
        name: "Whey",
        portionLabel: "1 scoop",
        protein: 24,
        calories: 120,
        category: "Produits laitiers",
    },

    // ─── Glucides ───
    {
        key: "riz-cuit",
        name: "Riz cuit",
        portionLabel: "1 poing serré",
        protein: 4,
        calories: 200,
        category: "Glucides",
    },
    {
        key: "avoine",
        name: "Avoine sèche",
        portionLabel: "1 tasse/mug rempli",
        protein: 13,
        calories: 380,
        category: "Glucides",
    },
    {
        key: "pates-cuites",
        name: "Pâtes cuites",
        portionLabel: "1 poing",
        protein: 4,
        calories: 200,
        category: "Glucides",
    },
    {
        key: "pomme-de-terre",
        name: "Pomme de terre",
        portionLabel: "1 moyenne (poing)",
        protein: 3,
        calories: 160,
        category: "Glucides",
    },
    {
        key: "plantain-bouilli",
        name: "Banane plantain bouillie",
        portionLabel: "1 moyenne",
        protein: 2,
        calories: 220,
        category: "Glucides",
    },
    {
        key: "plantain-frit",
        name: "Banane plantain frite",
        portionLabel: "1 moyenne",
        protein: 2,
        calories: 280,
        category: "Glucides",
    },
    {
        key: "patate-douce",
        name: "Patate douce",
        portionLabel: "1 moyenne",
        protein: 2,
        calories: 115,
        category: "Glucides",
    },
    {
        key: "pain",
        name: "Pain",
        portionLabel: "1 tranche",
        protein: 3,
        calories: 80,
        category: "Glucides",
    },
    {
        key: "tortilla",
        name: "Tortilla/wrap",
        portionLabel: "1 grande",
        protein: 4,
        calories: 140,
        category: "Glucides",
    },
    {
        key: "couscous",
        name: "Couscous cuit",
        portionLabel: "1 poing",
        protein: 4,
        calories: 175,
        category: "Glucides",
    },
    {
        key: "lentilles",
        name: "Lentilles en conserve",
        portionLabel: "½ conserve",
        protein: 12,
        calories: 175,
        category: "Glucides",
    },
    {
        key: "pois-chiches",
        name: "Pois chiches en conserve",
        portionLabel: "½ conserve",
        protein: 10,
        calories: 190,
        category: "Glucides",
    },
    {
        key: "mais",
        name: "Maïs en conserve",
        portionLabel: "½ conserve",
        protein: 4,
        calories: 130,
        category: "Glucides",
    },

    // ─── Fruits et légumes ───
    {
        key: "banane",
        name: "Banane",
        portionLabel: "1 moyenne",
        protein: 1,
        calories: 105,
        category: "Fruits et légumes",
    },
    {
        key: "pomme",
        name: "Pomme",
        portionLabel: "1 moyenne",
        protein: 0,
        calories: 95,
        category: "Fruits et légumes",
    },
    {
        key: "orange",
        name: "Orange",
        portionLabel: "1 moyenne",
        protein: 1,
        calories: 60,
        category: "Fruits et légumes",
    },
    {
        key: "tomate",
        name: "Tomate",
        portionLabel: "1 moyenne",
        protein: 1,
        calories: 25,
        category: "Fruits et légumes",
    },
    {
        key: "avocat",
        name: "Avocat",
        portionLabel: "½ avocat",
        protein: 1,
        calories: 120,
        category: "Fruits et légumes",
    },
    {
        key: "legumes-congeles",
        name: "Légumes congelés",
        portionLabel: "1 poignée",
        protein: 2,
        calories: 40,
        category: "Fruits et légumes",
    },
    {
        key: "salade",
        name: "Salade/épinards",
        portionLabel: "1 bol",
        protein: 1,
        calories: 15,
        category: "Fruits et légumes",
    },
    {
        key: "jus-orange",
        name: "Jus d'orange",
        portionLabel: "1 verre",
        protein: 1,
        calories: 110,
        category: "Fruits et légumes",
    },

    // ─── Lipides et extras ───
    {
        key: "beurre-arachide",
        name: "Beurre d'arachide",
        portionLabel: "1 c. à soupe pleine",
        protein: 4,
        calories: 95,
        category: "Lipides et extras",
    },
    {
        key: "huile",
        name: "Huile (cuisson/friture)",
        portionLabel: "1 c. à soupe",
        protein: 0,
        calories: 120,
        category: "Lipides et extras",
    },
    {
        key: "beurre",
        name: "Beurre",
        portionLabel: "1 noix (1 c. à s.)",
        protein: 0,
        calories: 100,
        category: "Lipides et extras",
    },
    {
        key: "granola",
        name: "Granola",
        portionLabel: "1 poignée",
        protein: 3,
        calories: 130,
        category: "Lipides et extras",
    },
    {
        key: "miel",
        name: "Miel",
        portionLabel: "1 c. à soupe",
        protein: 0,
        calories: 60,
        category: "Lipides et extras",
    },
    {
        key: "sauce-tomate",
        name: "Sauce tomate",
        portionLabel: "½ tasse",
        protein: 2,
        calories: 60,
        category: "Lipides et extras",
    },
    {
        key: "mayo",
        name: "Mayo",
        portionLabel: "1 c. à soupe",
        protein: 0,
        calories: 95,
        category: "Lipides et extras",
    },
    {
        key: "noix",
        name: "Noix/arachides",
        portionLabel: "1 poignée",
        protein: 6,
        calories: 170,
        category: "Lipides et extras",
    },
];

export interface Preset {
    key: string;
    label: string;
    items: { foodKey: string; portions: number }[];
}

export const PRESETS: Preset[] = [
    {
        key: "matin",
        label: "Repas du matin",
        items: [
            { foodKey: "oeuf", portions: 4 },
            { foodKey: "avoine", portions: 1 },
            { foodKey: "lait", portions: 2 },
            { foodKey: "banane", portions: 2 },
            { foodKey: "beurre-arachide", portions: 3 },
            { foodKey: "whey", portions: 1 },
        ],
    },
    {
        key: "soir",
        label: "Repas du soir",
        items: [
            { foodKey: "boeuf-hache", portions: 1 },
            { foodKey: "riz-cuit", portions: 3 },
            { foodKey: "oeuf", portions: 2 },
            { foodKey: "legumes-congeles", portions: 1 },
            { foodKey: "pain", portions: 1 },
            { foodKey: "beurre-arachide", portions: 1 },
            { foodKey: "lait", portions: 1 },
        ],
    },
];
