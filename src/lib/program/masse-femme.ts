// Programme « Prise de masse — femme » : 3 séances/semaine (lun/mer/ven), tapis
// de yoga uniquement, accent fessiers. Deux phases : prise rapide (jours 1–40),
// puis progression normale (jour 41+), ouverte jusqu'au poids cible.

import type { Program, Session, LexiconEntry, DayType, PhaseInfo, PhaseGoals } from "./types";

const FEMME_SESSIONS: Record<string, Session> = {
    "femme-a": {
        dayType: "femme-a",
        title: "Séance A — Fessiers",
        focus: "Fessiers prioritaires",
        exercises: [
            {
                key: "femme-pont-fessier-2j",
                name: "Pont fessier deux jambes (pause 1 s en haut)",
                sets: "4",
                reps: "15–20",
                lexiconKey: "femme-pont-fessier-2j",
            },
            {
                key: "femme-fentes-arriere",
                name: "Fentes arrière, grand pas",
                sets: "3",
                reps: "10–12/jambe",
                lexiconKey: "femme-fentes-arriere",
            },
            {
                key: "femme-squat-tempo",
                name: "Squats au poids du corps (3 s à la descente)",
                sets: "3",
                reps: "15",
                lexiconKey: "femme-squat-tempo",
            },
            {
                key: "femme-fire-hydrants",
                name: "Fire hydrants (jambe pliée levée sur le côté)",
                sets: "3",
                reps: "15/côté",
                lexiconKey: "femme-fire-hydrants",
            },
            {
                key: "femme-donkey-kicks",
                name: "Donkey kicks (extension de hanche à quatre pattes)",
                sets: "2",
                reps: "15/jambe",
                lexiconKey: "femme-donkey-kicks",
            },
            {
                key: "femme-planche",
                name: "Planche",
                sets: "2",
                reps: "20–40 s",
                time: true,
                lexiconKey: "femme-planche",
            },
        ],
    },

    "femme-b": {
        dayType: "femme-b",
        title: "Séance B — Haut du corps",
        focus: "Haut du corps et posture",
        exercises: [
            {
                key: "femme-pompes-inclinees",
                name: "Pompes inclinées (mains sur une chaise/comptoir)",
                sets: "3",
                reps: "8–12",
                lexiconKey: "femme-pompes-inclinees",
            },
            {
                key: "femme-ecarte-bouteilles",
                name: "Écarté au sol avec deux bouteilles d'eau (tempo lent)",
                sets: "3",
                reps: "12–15",
                lexiconKey: "femme-ecarte-bouteilles",
            },
            {
                key: "femme-superman",
                name: "Superman (extensions dos au sol)",
                sets: "3",
                reps: "12–15",
                lexiconKey: "femme-superman",
            },
            {
                key: "femme-elevations-laterales",
                name: "Élévations latérales sans charge (tempo 3 s)",
                sets: "2",
                reps: "15–20",
                lexiconKey: "femme-elevations-laterales",
            },
            {
                key: "femme-dips-chaise",
                name: "Dips sur chaise, genoux pliés",
                sets: "2",
                reps: "8–12",
                lexiconKey: "femme-dips-chaise",
            },
            {
                key: "femme-crunch",
                name: "Crunch au sol",
                sets: "3",
                reps: "12–15",
                lexiconKey: "femme-crunch",
            },
            {
                key: "femme-ouverture-poitrine",
                name: "Ouverture de poitrine contre un mur",
                sets: "2",
                reps: "30 s/côté",
                time: true,
                lexiconKey: "femme-ouverture-poitrine",
            },
        ],
    },

    "femme-c": {
        dayType: "femme-c",
        title: "Séance C — Corps complet",
        focus: "Corps complet, fessiers dominants",
        exercises: [
            {
                key: "femme-squat-bulgare",
                name: "Squat bulgare (pied arrière sur une chaise)",
                sets: "3",
                reps: "10–12/jambe",
                lexiconKey: "femme-squat-bulgare",
            },
            {
                key: "femme-pont-fessier-1j",
                name: "Pont fessier une jambe",
                sets: "3",
                reps: "12–15/jambe",
                lexiconKey: "femme-pont-fessier-1j",
            },
            {
                key: "femme-hip-hinge",
                name: "Hip hinge / good morning au poids du corps (mains derrière la tête)",
                sets: "3",
                reps: "15",
                lexiconKey: "femme-hip-hinge",
            },
            {
                key: "femme-pompes-inclinees",
                name: "Pompes inclinées (mains sur une chaise/comptoir)",
                sets: "2",
                reps: "8–12",
                lexiconKey: "femme-pompes-inclinees",
            },
            {
                key: "femme-abduction-hanche",
                name: "Abduction de hanche allongée sur le côté (jambe tendue)",
                sets: "3",
                reps: "15–20/côté",
                lexiconKey: "femme-abduction-hanche",
            },
            {
                key: "femme-bird-dog",
                name: "Bird-dog",
                sets: "2",
                reps: "10/côté",
                lexiconKey: "femme-bird-dog",
            },
            {
                key: "femme-planche-laterale",
                name: "Planche latérale",
                sets: "2",
                reps: "15–30 s/côté",
                time: true,
                lexiconKey: "femme-planche-laterale",
            },
        ],
    },
};

const FEMME_LEXICON: Record<string, LexiconEntry> = {
    "femme-pont-fessier-2j": {
        name: "Pont fessier deux jambes",
        text: "Allongée sur le dos, pieds à plat au sol proches des fesses, bras le long du corps. Pousse dans les talons et lève les hanches jusqu'à une ligne droite épaules-hanches-genoux, serre fort les fessiers et tiens 1 seconde en haut, puis redescends lentement sans t'écraser au sol. C'est l'exercice roi pour les fessiers sans matériel.",
    },
    "femme-fentes-arriere": {
        name: "Fentes arrière",
        text: "Debout, fais un grand pas vers l'arrière et descends le genou arrière vers le sol, buste droit, poids sur le talon avant. Remonte en poussant dans la jambe avant. Le grand pas cible davantage le fessier que la cuisse. Alterne les jambes.",
    },
    "femme-squat-tempo": {
        name: "Squat au poids du corps (tempo)",
        text: "Pieds largeur d'épaules, descends les fesses vers l'arrière comme pour t'asseoir, en comptant 3 secondes à la descente, jusqu'à cuisses parallèles au sol si possible. Remonte en poussant dans les talons. La descente lente augmente le temps sous tension.",
    },
    "femme-fire-hydrants": {
        name: "Fire hydrants",
        text: "À quatre pattes, dos plat, genou plié à 90°. Lève une jambe sur le côté sans bouger le buste, comme un chien près d'une borne. Monte jusqu'à sentir le fessier, redescends sans poser le genou. Garde le bassin stable.",
    },
    "femme-donkey-kicks": {
        name: "Donkey kicks",
        text: "À quatre pattes, genou plié à 90°, pousse la plante du pied vers le plafond en montant la cuisse, sans cambrer le bas du dos. Serre le fessier en haut, redescends lentement. Le mouvement vient de la hanche, pas du dos.",
    },
    "femme-planche": {
        name: "Planche",
        text: "Sur les avant-bras et la pointe des pieds, corps parfaitement droit des talons à la tête, abdos et fessiers serrés. Ne laisse pas les hanches tomber ni monter. Respire et tiens la position le temps prévu.",
    },
    "femme-pompes-inclinees": {
        name: "Pompes inclinées",
        text: "Mains sur une surface stable (chaise, comptoir, rebord), corps en ligne droite. Descends la poitrine vers l'appui en pliant les coudes, remonte en poussant. Plus l'appui est haut, plus c'est facile : baisse l'appui au fil des semaines pour progresser.",
    },
    "femme-ecarte-bouteilles": {
        name: "Écarté avec bouteilles",
        text: "Allongée sur le dos (au sol ou sur un tapis), une bouteille d'eau dans chaque main, bras semi-tendus au-dessus de la poitrine. Ouvre lentement les bras sur les côtés jusqu'à sentir l'étirement des pectoraux, puis referme en contrôlant. Tempo lent, léger : c'est la tension qui compte.",
    },
    "femme-superman": {
        name: "Superman",
        text: "Allongée sur le ventre, bras tendus devant. Lève en même temps les bras, la poitrine et les jambes du sol en contractant le bas du dos et les fessiers, tiens une seconde en haut, puis redescends lentement. Renforce toute la chaîne postérieure et la posture.",
    },
    "femme-elevations-laterales": {
        name: "Élévations latérales",
        text: "Debout, bras le long du corps. Monte les bras tendus sur les côtés jusqu'à l'horizontale en comptant 3 secondes, puis redescends en 3 secondes. Sans charge, c'est le tempo lent qui fait travailler les épaules. Ne balance pas.",
    },
    "femme-dips-chaise": {
        name: "Dips sur chaise",
        text: "Assise au bord d'une chaise, mains agrippées au rebord de part et d'autre des hanches, fesses devant la chaise, genoux pliés (version facile). Descends en pliant les coudes vers l'arrière, puis repousse-toi. Cible les triceps.",
    },
    "femme-crunch": {
        name: "Crunch au sol",
        text: "Allongée sur le dos, genoux pliés, mains derrière la tête sans tirer sur la nuque. Enroule le haut du dos vers le bassin en soufflant, décolle les omoplates, puis redescends lentement. Petit mouvement, gros travail des abdos.",
    },
    "femme-ouverture-poitrine": {
        name: "Ouverture de poitrine au mur",
        text: "Debout de profil près d'un mur, pose la paume et l'avant-bras contre le mur, coude à hauteur d'épaule, puis tourne doucement le buste dans le sens opposé jusqu'à sentir l'étirement de la poitrine et de l'épaule. Tiens sans forcer, respire. Étire un côté puis l'autre.",
    },
    "femme-squat-bulgare": {
        name: "Squat bulgare",
        text: "Debout dos à une chaise, pose le dessus d'un pied derrière toi sur l'assise. Descends sur la jambe avant jusqu'à ce que la cuisse soit presque horizontale, buste droit, puis remonte. Presque toute la charge est sur une jambe : excellent pour fessiers et cuisses sans poids.",
    },
    "femme-pont-fessier-1j": {
        name: "Pont fessier une jambe",
        text: "Comme le pont fessier, mais une jambe tendue en l'air : pousse dans le talon de la jambe au sol pour lever les hanches, serre le fessier en haut, redescends lentement. Deux fois plus de charge sur un seul fessier — plus dur, plus efficace.",
    },
    "femme-hip-hinge": {
        name: "Hip hinge / good morning",
        text: "Debout, mains derrière la tête, genoux légèrement fléchis. Penche le buste vers l'avant en poussant les fesses vers l'arrière, dos bien droit, jusqu'à sentir l'étirement de l'arrière des cuisses, puis redresse-toi en serrant les fessiers. Le dos reste plat tout le long.",
    },
    "femme-abduction-hanche": {
        name: "Abduction de hanche allongée",
        text: "Allongée sur le côté, jambes tendues alignées avec le corps. Lève lentement la jambe du dessus vers le plafond sans basculer le bassin, puis redescends en contrôlant. Cible le moyen fessier (galbe du côté de la hanche). Fais un côté puis l'autre.",
    },
    "femme-bird-dog": {
        name: "Bird-dog",
        text: "À quatre pattes, dos plat. Tends en même temps le bras droit devant et la jambe gauche derrière, à l'horizontale, sans cambrer, tiens une seconde, reviens, puis alterne. Gaine le tronc et améliore l'équilibre et la posture.",
    },
    "femme-planche-laterale": {
        name: "Planche latérale",
        text: "Sur un avant-bras, coude sous l'épaule, corps sur le côté en ligne droite, pieds superposés (ou genou au sol en version facile). Lève les hanches et tiens sans les laisser tomber. Renforce les obliques et la sangle latérale. Un côté puis l'autre.",
    },
};

const PHASE_1: PhaseInfo = {
    key: "prise-rapide",
    label: "Phase 1 (prise rapide)",
    shortLabel: "Phase 1",
    description: "Prise de masse accélérée : surplus calorique marqué, on construit du volume.",
};

const PHASE_2: PhaseInfo = {
    key: "progression-normale",
    label: "Phase 2 (progression normale)",
    shortLabel: "Phase 2",
    description: "Progression normale : calories réduites, on continue jusqu'au poids cible.",
};

const NUTRITION: Record<string, PhaseGoals> = {
    "prise-rapide": { protein: 100, calories: 2200, fat: 70 },
    "progression-normale": { protein: 100, calories: 1950, fat: 60 },
};

// 0 = dimanche … 6 = samedi. Lun/Mer/Ven = séances A/B/C, sinon repos.
const WEEKDAY_TO_DAYTYPE: Record<number, DayType> = {
    0: "repos",
    1: "femme-a",
    2: "repos",
    3: "femme-b",
    4: "repos",
    5: "femme-c",
    6: "repos",
};

export const MASSE_FEMME: Program = {
    id: "masse-femme",
    label: "Prise de masse — femme",
    length: null,
    hasReferencePage: true,
    sessions: FEMME_SESSIONS,
    lexicon: FEMME_LEXICON,
    features: {
        photos: false,
        creatine: false,
        intensification: false,
        trackFat: true,
        targetWeight: true,
        measurementsPrimary: true,
        nutritionFirst: true,
        sessionHabit: true,
    },
    habitFields: ["kcal3000", "protein140", "sleepBefore23"],
    habitLabels: {
        kcal3000: { label: "Calories atteintes", short: "Calories" },
        protein140: { label: "Protéines atteintes", short: "Protéines" },
        sleepBefore23: { label: "~8 h de sommeil", short: "Sommeil" },
    },
    dayTypeForWeekday(weekday) {
        return WEEKDAY_TO_DAYTYPE[weekday] ?? "repos";
    },
    isTrainingDay(dayType) {
        return dayType !== "repos";
    },
    getPhase(dayNumber) {
        if (dayNumber < 1) return null;
        return dayNumber <= 40 ? PHASE_1 : PHASE_2;
    },
    nutritionForPhase(phaseKey) {
        return NUTRITION[phaseKey ?? "prise-rapide"] ?? NUTRITION["prise-rapide"];
    },
    nutritionPhase2Key: "progression-normale",
    trend: {
        targetText:
            "Vise +0,25 à 0,4 kg/semaine. Le tour de hanches et de cuisse comptent plus que la balance.",
        highGain: 0.5,
        lowGain: 0.15,
        lowGainTwoWeeks: true,
        deficitText: "Prise > 0,5 kg/sem → retire ~150 kcal/jour.",
        surplusText: "Prise < 0,15 kg/sem depuis 2 semaines → ajoute ~200 kcal/jour.",
    },
};
