import type { LexiconEntry } from "./types";

/**
 * Lexique complet, tiré de programme-final-58-jours.md.
 * Chaque exercice pointe vers une entrée via son `lexiconKey`.
 */
export const LEXICON: Record<string, LexiconEntry> = {
    // ─── Poussée ───
    "pompes-standards": {
        name: "Pompes standards",
        text: "Les pompes classiques. Corps droit comme une planche, mains sous les épaules, descends la poitrine jusqu'à frôler le sol, remonte.",
    },
    "pompes-declinees": {
        name: "Pompes déclinées",
        text: "Des pompes avec les pieds posés sur une chaise. Le corps penché vers le bas met plus de poids sur les mains et cible le haut des pectoraux et les épaules.",
    },
    "pompes-diamant": {
        name: "Pompes diamant",
        text: "Pompes avec les mains rapprochées sous la poitrine, pouces et index qui se touchent en forme de losange. Ça déplace l'effort vers les triceps (l'arrière du bras).",
    },
    "pompes-pseudo-planche": {
        name: "Pompes pseudo-planche",
        text: "Pompes normales, mais les mains sont placées plus bas, vers la taille, et tu penches les épaules vers l'avant au-dessus des mains. Très dur pour l'avant des épaules.",
    },
    "dips-chaises": {
        name: "Dips entre deux chaises",
        text: "Place deux chaises solides dos à dos, écartées de la largeur de tes épaules. Une main sur chaque dossier, pieds dans le vide ou posés devant, descends en pliant les coudes jusqu'à ce que tes bras fassent 90°, remonte. Penche légèrement le buste en avant pour les pecs.",
    },
    "pike-push-ups": {
        name: "Pike push-ups",
        text: "Des pompes en position de « V inversé » : pieds au sol, fesses le plus haut possible, le corps forme un triangle. Tu descends la tête vers le sol entre tes mains, puis tu pousses. C'est ta version maison du développé militaire — ça construit les épaules.",
    },
    "developpe-epaules-bande": {
        name: "Développé épaules à la bande",
        text: "Tiens-toi debout sur le milieu de la bande, attrape les deux extrémités à hauteur d'épaules, et pousse les mains au-dessus de la tête jusqu'aux bras tendus.",
    },
    "elevations-laterales": {
        name: "Élévations latérales à la bande",
        text: "Debout, un pied sur la bande, l'autre extrémité dans la main du même côté, bras le long du corps. Lève le bras sur le côté jusqu'à l'horizontale (comme un oiseau qui ouvre une aile), redescends lentement. C'est TON exercice de largeur d'épaules.",
    },
    "upright-row": {
        name: "Upright row à la bande (tirage vertical coudes hauts)",
        text: "Debout sur la bande, mains devant les cuisses. Tire les mains vers le haut le long du corps jusqu'à hauteur de poitrine, coudes qui montent plus haut que les mains, comme si tu remontais une fermeture éclair.",
    },
    "extension-triceps-oh": {
        name: "Extension triceps au-dessus de la tête",
        text: "Bande coincée sous un pied ou ancrée en bas de la porte, derrière toi. Attrape-la à deux mains derrière la tête, coudes pointés vers le plafond, et tends les bras vers le haut sans bouger les coudes. Tu sens l'arrière du bras s'étirer puis se contracter.",
    },
    shrugs: {
        name: "Shrugs à la bande (haussements d'épaules)",
        text: "Debout sur la bande, bras tendus le long du corps, tu hausses simplement les épaules vers les oreilles le plus haut possible, tu tiens 1 s, tu redescends. Cible les trapèzes (entre le cou et les épaules).",
    },

    // ─── Tirage ───
    tractions: {
        name: "Tractions",
        text: "Suspendu à la barre, paumes vers l'avant (pronation), mains un peu plus larges que les épaules. Tire-toi vers le haut jusqu'à ce que ton menton dépasse la barre, redescends en contrôlant. Prise supination = paumes vers toi (plus facile, plus de biceps); prise neutre = paumes face à face si ta barre le permet.",
    },
    "tractions-assistees": {
        name: "Tractions assistées à la bande",
        text: "Accroche la bande à la barre, mets un genou ou un pied dans la boucle : elle te pousse vers le haut et rend la traction plus facile. Plus la bande est forte (30 kg), plus l'aide est grande — tu progresseras vers des bandes plus légères, puis sans bande.",
    },
    "rowing-inverse": {
        name: "Rowing inversé sous la table",
        text: "Allonge-toi sous une table solide, attrape le rebord, corps droit des talons aux épaules, et tire ta poitrine vers la table en serrant les omoplates. C'est une traction à l'horizontale. Pieds surélevés sur une chaise = plus dur.",
    },
    "tirage-bande-assis": {
        name: "Tirage à la bande assis",
        text: "Assis au sol jambes tendues, bande passée autour de tes pieds, une extrémité dans chaque main. Tire les mains vers ton ventre en tirant les coudes vers l'arrière et en serrant les omoplates, reviens lentement.",
    },
    "face-pull": {
        name: "Face pull à la bande",
        text: "Bande ancrée en hauteur (haut de la porte ou barre de traction). Attrape les deux extrémités et tire-les vers ton visage en écartant les mains de chaque côté de ta tête, coudes hauts. Ça renforce l'arrière des épaules et protège tes articulations — pas spectaculaire, mais indispensable.",
    },
    "pull-over-bande": {
        name: "Pull-over à la bande",
        text: "Bande ancrée en hauteur, dos à quelques pas, bras tendus devant-haut qui tiennent la bande. Sans plier les coudes, ramène les bras tendus vers tes hanches en contractant le dos, puis laisse remonter lentement. Tu sens l'étirement sous les aisselles : c'est le grand dorsal.",
    },
    "elevations-buste-penche": {
        name: "Élévations buste penché (deltoïde postérieur)",
        text: "Penche le buste vers l'avant à ~45°, un pied sur la bande, extrémités en mains, et lève les bras sur les côtés comme des ailes. Cible l'arrière de l'épaule.",
    },

    // ─── Bras ───
    "curl-bande": {
        name: "Curl à la bande",
        text: "Debout sur la bande, extrémités en mains, paumes vers l'avant, coudes collés au corps. Plie les coudes pour monter les mains vers les épaules, redescends lentement. C'est la flexion de biceps classique.",
    },
    "curl-marteau": {
        name: "Curl marteau",
        text: "Même chose que le curl, mais paumes face à face (comme si tu tenais un marteau). Travaille le biceps et l'avant-bras.",
    },
    "curl-inverse": {
        name: "Curl inversé",
        text: "Même chose que le curl, mais paumes vers le bas. Cible surtout les avant-bras.",
    },
    "curl-concentre": {
        name: "Curl concentré",
        text: "Assis ou penché, coude appuyé contre l'intérieur de ta cuisse, bande sous le pied. Un bras à la fois, monte lentement. Isolation maximale du biceps.",
    },
    "dead-hang": {
        name: "Dead hang (suspension)",
        text: "Suspends-toi simplement à la barre, bras tendus, et tiens le plus longtemps possible. Brûle les avant-bras et renforce la poigne.",
    },

    // ─── Jambes et abdos ───
    "squat-bulgare": {
        name: "Squat bulgare",
        text: "Debout dos à une chaise, pose le dessus d'un pied derrière toi sur la chaise. Descends sur la jambe avant jusqu'à ce que la cuisse soit à peu près horizontale, remonte. Toute la charge est sur une jambe : très efficace sans poids.",
    },
    "pistol-squat": {
        name: "Pistol squat (progression)",
        text: "Un squat sur une seule jambe, l'autre tendue devant. Très dur — au début, tiens le cadre de porte avec une main pour t'aider et descends seulement à moitié. Tu gagneras de la profondeur avec les semaines.",
    },
    "good-morning": {
        name: "Good morning à la bande",
        text: "Debout sur la bande, passe-la derrière ta nuque/sur tes épaules. Jambes presque tendues, penche le buste vers l'avant en poussant les fesses vers l'arrière, dos droit, jusqu'à sentir l'étirement derrière les cuisses, puis redresse-toi. Cible l'arrière des cuisses et les fessiers.",
    },
    "nordic-curl": {
        name: "Nordic curl assisté",
        text: "À genoux, chevilles coincées sous le divan, corps droit des genoux à la tête. Laisse-toi tomber vers l'avant le plus lentement possible en freinant avec l'arrière des cuisses, amortis avec les mains, repousse-toi pour revenir. Brutal mais très efficace pour les ischio-jambiers.",
    },
    "pont-fessier-unilateral": {
        name: "Pont fessier à une jambe",
        text: "Allongé sur le dos, plie une jambe avec le pied bien à plat au sol, talon à environ 30 cm des fesses. Tends l'autre jambe en l'air, bras le long du corps. Pousse dans ton talon (pas la pointe) et lève les hanches jusqu'à former une ligne droite épaules-hanches-genou. Serre le fessier fort en haut, tiens 1 seconde, puis redescends lentement (2-3 s) sans poser complètement les fesses au sol. Où le sentir : fessier et arrière de la cuisse de la jambe au sol ; pour cibler davantage l'arrière de la cuisse, éloigne le pied des fesses. Erreurs à éviter : cambrer le bas du dos pour monter plus haut (garde les abdos serrés) · pousser sur la pointe du pied · s'écraser au sol entre les reps. Progression : pied surélevé sur une chaise, puis objet lourd (sac de livres) posé sur les hanches.",
    },
    mollets: {
        name: "Mollets une jambe sur une marche",
        text: "L'avant du pied sur le bord d'une marche, talon dans le vide, sur une jambe. Descends le talon le plus bas possible, monte sur la pointe le plus haut possible.",
    },
    "releves-jambes": {
        name: "Relevés de jambes suspendu",
        text: "Suspendu à la barre de traction, monte les genoux vers la poitrine (version facile) ou les jambes tendues à l'horizontale (version dure), redescends sans te balancer. Abdos du bas.",
    },
    "crunch-bande": {
        name: "Crunch à la bande",
        text: "À genoux, bande ancrée en bas de la porte derrière toi, extrémités tenues contre ta poitrine ou derrière la tête. Enroule le buste vers l'avant en contractant les abdos, comme si tu voulais rapprocher tes côtes de ton bassin, remonte lentement. La bande ajoute de la résistance : les abdos grossissent comme n'importe quel muscle.",
    },
};

export function youtubeSearchUrl(name: string): string {
    return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " tutorial")}`;
}
