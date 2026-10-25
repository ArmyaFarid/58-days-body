// Programme « Fessiers, posture & bien-être » : une bande de résistance 10 kg,
// tapis et chaise optionnels. Entraînement modéré (15–25 reps, 3–4 reps en
// réserve, jamais à l'échec). Deux rythmes : phase 1 = 3 séances/semaine
// (semaines 1–6, lun/mer/ven), phase 2 = 2 séances/semaine (semaine 7+,
// lun/jeu), sans date de fin. La nutrition suit ses propres phases (jours 1–40
// puis 41+), indépendantes du rythme d'entraînement.

import type {
    Program,
    Session,
    Exercise,
    LexiconEntry,
    DayType,
    PhaseInfo,
    PhaseGoals,
    TrainingPhase,
    ScheduleContext,
} from "./types";

const SHORTEN = "Raccourcis la bande (prise plus basse ou plus loin de l'ancrage)";

const STYLE_NOTE =
    "Garde 3 à 4 reps en réserve à chaque série. Tempo contrôlé sans être lent, repos 60–90 s. Jamais jusqu'à l'échec.";

const EX = {
    pont2j: {
        key: "fpb-pont-2j",
        name: "Pont fessier deux jambes, bande autour des cuisses (pause 1 s en haut)",
        sets: "3",
        reps: "20–25",
        lexiconKey: "fpb-pont-2j",
        progression: `${SHORTEN}, puis passe au pont une jambe, puis pieds surélevés.`,
    },
    fentes: {
        key: "fpb-fentes-arriere",
        name: "Fentes arrière, grand pas",
        sets: "3",
        reps: "12–15/jambe",
        lexiconKey: "fpb-fentes-arriere",
        progression: "Tempo plus lent à la descente (3 s), puis pause 1 s en bas.",
    },
    squatBande: {
        key: "fpb-squat-bande",
        name: "Squats avec bande autour des cuisses",
        sets: "3",
        reps: "15–20",
        lexiconKey: "fpb-squat-bande",
        progression: `${SHORTEN}, puis tempo plus lent, puis squat bulgare.`,
    },
    abduction: {
        key: "fpb-abduction-couchee",
        name: "Abduction de hanche couchée sur le côté avec bande, jambe tendue",
        sets: "3",
        reps: "20/côté",
        lexiconKey: "fpb-abduction-couchee",
        progression: `${SHORTEN}, puis pause 1 s en haut.`,
    },
    fireHydrants: {
        key: "fpb-fire-hydrants",
        name: "Fire hydrants avec bande",
        sets: "2",
        reps: "15–20/côté",
        lexiconKey: "fpb-fire-hydrants",
        progression: `${SHORTEN}, puis pause 1 s en haut.`,
    },
    planche: {
        key: "fpb-planche",
        name: "Planche",
        sets: "2",
        reps: "20–40 s",
        time: true,
        lexiconKey: "fpb-planche",
        progression: "Tiens plus longtemps : +5 s quand 40 s passent facilement.",
    },
    pompesInclinees: {
        key: "fpb-pompes-inclinees",
        name: "Pompes inclinées (mains sur une chaise ou un comptoir)",
        sets: "3",
        reps: "10–15",
        lexiconKey: "fpb-pompes-inclinees",
        progression: "Appui plus bas (comptoir → chaise → marche), puis pompes au sol.",
    },
    ecarte: {
        key: "fpb-ecarte-bande",
        name: "Écarté au sol, bande sous le dos, bras semi-tendus",
        sets: "3",
        reps: "15–20",
        lexiconKey: "fpb-ecarte-bande",
        progression: `${SHORTEN}, puis tempo plus lent au retour.`,
    },
    tirage: {
        key: "fpb-tirage-assis",
        name: "Tirage assis à la bande (bande autour des pieds, tirer vers le ventre)",
        sets: "3",
        reps: "15–20",
        lexiconKey: "fpb-tirage-assis",
        progression: `${SHORTEN}, puis pause 1 s omoplates serrées.`,
    },
    facePull: {
        key: "fpb-face-pull",
        name: "Face pull à la bande (ancrée en hauteur, coudes hauts)",
        sets: "3",
        reps: "20",
        lexiconKey: "fpb-face-pull",
        progression: `${SHORTEN}, puis pause 1 s bras ouverts.`,
    },
    elevations: {
        key: "fpb-elevations-laterales",
        name: "Élévations latérales à la bande, un bras à la fois",
        sets: "2",
        reps: "15–20/bras",
        lexiconKey: "fpb-elevations-laterales",
        progression: `${SHORTEN}, puis tempo plus lent à la descente.`,
    },
    superman: {
        key: "fpb-superman",
        name: "Superman",
        sets: "2",
        reps: "15",
        lexiconKey: "fpb-superman",
        progression: "Tiens 2 s en haut au lieu d'une.",
    },
    ouverture: {
        key: "fpb-ouverture-poitrine",
        name: "Ouverture de poitrine contre un mur",
        sets: "1",
        reps: "30 s/côté",
        time: true,
        lexiconKey: "fpb-ouverture-poitrine",
    },
    bulgare: {
        key: "fpb-squat-bulgare",
        name: "Squat bulgare (pied arrière sur une chaise)",
        sets: "3",
        reps: "12–15/jambe",
        lexiconKey: "fpb-squat-bulgare",
        progression: "Tempo plus lent à la descente (3 s), puis pause 1 s en bas.",
    },
    pont1j: {
        key: "fpb-pont-1j",
        name: "Pont fessier une jambe",
        sets: "3",
        reps: "15/jambe",
        lexiconKey: "fpb-pont-1j",
        progression: "Pied d'appui surélevé (chaise, canapé), puis pause 2 s en haut.",
    },
    goodMorning: {
        key: "fpb-good-morning",
        name: "Good morning à la bande (debout dessus, bande sur les épaules)",
        sets: "3",
        reps: "15–20",
        lexiconKey: "fpb-good-morning",
        progression: `${SHORTEN}, puis pause 1 s en bas.`,
    },
    monsterWalk: {
        key: "fpb-monster-walk",
        name: "Pas latéraux avec bande (« monster walk »)",
        sets: "3",
        reps: "20 pas/côté",
        lexiconKey: "fpb-monster-walk",
        progression: `${SHORTEN} (autour des chevilles plutôt que des genoux), puis position plus basse.`,
    },
    curl: {
        key: "fpb-curl-bande",
        name: "Curl à la bande",
        sets: "2",
        reps: "15",
        lexiconKey: "fpb-curl-bande",
        progression: `${SHORTEN}, puis tempo plus lent à la descente.`,
    },
    birdDog: {
        key: "fpb-bird-dog",
        name: "Bird-dog",
        sets: "2",
        reps: "10/côté",
        lexiconKey: "fpb-bird-dog",
        progression: "Tiens 2–3 s bras et jambe tendus.",
    },
    plancheLaterale: {
        key: "fpb-planche-laterale",
        name: "Planche latérale",
        sets: "2",
        reps: "15–30 s/côté",
        time: true,
        lexiconKey: "fpb-planche-laterale",
        progression: "Genou au sol → pieds superposés, puis durée plus longue.",
    },
} satisfies Record<string, Exercise>;

/** Même exercice, autre nombre de séries (la clé reste la même pour l'historique). */
function withSets(ex: Exercise, sets: string): Exercise {
    return { ...ex, sets };
}

const SESSIONS: Record<string, Session> = {
    "fpb-a": {
        dayType: "fpb-a",
        title: "Séance A — Fessiers",
        focus: "Extension + abduction de hanche · 25–30 min",
        styleNote: STYLE_NOTE,
        exercises: [EX.pont2j, EX.fentes, EX.squatBande, EX.abduction, EX.fireHydrants, EX.planche],
    },
    "fpb-b": {
        dayType: "fpb-b",
        title: "Séance B — Poitrine et posture",
        focus: "Pectoraux, dos et épaules · 25–30 min",
        styleNote: STYLE_NOTE,
        exercises: [
            EX.pompesInclinees,
            EX.ecarte,
            EX.tirage,
            EX.facePull,
            EX.elevations,
            EX.superman,
            EX.ouverture,
        ],
    },
    "fpb-c": {
        dayType: "fpb-c",
        title: "Séance C — Corps complet",
        focus: "Fessiers dominants · 25–30 min",
        styleNote: STYLE_NOTE,
        exercises: [
            EX.bulgare,
            EX.pont1j,
            EX.goodMorning,
            EX.monsterWalk,
            withSets(EX.pompesInclinees, "2"),
            EX.curl,
            EX.birdDog,
            EX.plancheLaterale,
        ],
    },
    "fpb-1": {
        dayType: "fpb-1",
        title: "Séance 1 — Fessiers + haut du corps",
        focus: "Fessiers dominants, poitrine et dos · 25–30 min",
        styleNote: STYLE_NOTE,
        exercises: [
            EX.pont2j,
            EX.squatBande,
            EX.abduction,
            EX.pompesInclinees,
            EX.tirage,
            withSets(EX.facePull, "2"),
            EX.planche,
        ],
    },
    "fpb-2": {
        dayType: "fpb-2",
        title: "Séance 2 — Corps entier",
        focus: "Fessiers, poitrine et posture · 25–30 min",
        styleNote: STYLE_NOTE,
        exercises: [
            EX.bulgare,
            EX.pont1j,
            EX.monsterWalk,
            EX.ecarte,
            EX.superman,
            EX.elevations,
            EX.birdDog,
            EX.ouverture,
        ],
    },
};

const LEXICON: Record<string, LexiconEntry> = {
    "fpb-pont-2j": {
        name: "Pont fessier deux jambes avec bande",
        text: "Départ : allongée sur le dos, genoux pliés, pieds à plat à largeur de hanches, bande autour des cuisses juste au-dessus des genoux. Mouvement : pousse dans les talons pour monter les hanches jusqu'à l'alignement épaules-hanches-genoux, écarte légèrement les genoux contre la bande, serre les fessiers 1 s en haut, redescends en contrôle. À sentir : les fessiers, pas le bas du dos. À éviter : cambrer en haut, laisser les genoux se refermer.",
        youtubeQuery: "pont fessier bande élastique",
    },
    "fpb-fentes-arriere": {
        name: "Fentes arrière, grand pas",
        text: "Départ : debout, pieds à largeur de hanches. Mouvement : fais un grand pas en arrière, descends jusqu'à ce que le genou arrière frôle le sol, buste légèrement penché vers l'avant, puis remonte en poussant dans le talon de la jambe avant. À sentir : le fessier de la jambe avant. À éviter : un pas trop court (ça charge les cuisses), le genou avant qui rentre vers l'intérieur.",
        youtubeQuery: "fente arrière fessiers",
    },
    "fpb-squat-bande": {
        name: "Squat avec bande autour des cuisses",
        text: "Départ : debout, pieds un peu plus larges que les hanches, bande juste au-dessus des genoux. Mouvement : pousse les fesses en arrière et descends comme pour t'asseoir, en écartant les genoux contre la bande, puis remonte en serrant les fessiers. À sentir : fessiers et côté des hanches. À éviter : genoux qui se rapprochent, talons qui décollent, dos arrondi.",
        youtubeQuery: "squat bande élastique genoux fessiers",
    },
    "fpb-abduction-couchee": {
        name: "Abduction de hanche couchée avec bande",
        text: "Départ : allongée sur le côté, jambes tendues dans l'alignement du corps, bande autour des cuisses ou des chevilles. Mouvement : monte la jambe du dessus d'environ 40 cm, légèrement vers l'arrière, sans tourner le pied vers le plafond, puis redescends lentement. À sentir : le haut et le côté du fessier (moyen fessier). À éviter : rouler le bassin vers l'arrière, monter trop haut en compensant avec le dos.",
        youtubeQuery: "abduction hanche allongée bande moyen fessier",
    },
    "fpb-fire-hydrants": {
        name: "Fire hydrants avec bande",
        text: "Départ : à quatre pattes, mains sous les épaules, genoux sous les hanches, bande autour des cuisses. Mouvement : lève un genou sur le côté, jambe pliée, jusqu'à hauteur de hanche, tiens une seconde, redescends. À sentir : le côté et le haut du fessier. À éviter : pencher le buste du côté opposé, cambrer le dos.",
        youtubeQuery: "fire hydrant bande élastique",
    },
    "fpb-planche": {
        name: "Planche",
        text: "Départ : sur les avant-bras, coudes sous les épaules, jambes tendues sur la pointe des pieds. Mouvement : tiens le corps en ligne droite des épaules aux talons en serrant abdos et fessiers, respire normalement. À sentir : la sangle abdominale. À éviter : fesses trop hautes, bas du dos qui s'affaisse, apnée.",
        youtubeQuery: "planche gainage débutant",
    },
    "fpb-pompes-inclinees": {
        name: "Pompes inclinées",
        text: "Départ : mains sur une chaise stable ou un comptoir, un peu plus larges que les épaules, corps en ligne droite. Mouvement : descends la poitrine vers l'appui en gardant les coudes à environ 45° du corps, puis repousse. À sentir : les pectoraux et l'arrière des bras. À éviter : les hanches qui tombent, les coudes écartés à 90°. Plus l'appui est bas, plus c'est dur.",
        youtubeQuery: "pompes inclinées débutant",
    },
    "fpb-ecarte-bande": {
        name: "Écarté au sol à la bande",
        text: "Départ : allongée sur le dos, bande passée sous le haut du dos, une extrémité dans chaque main, bras ouverts sur les côtés, coudes légèrement fléchis. Mouvement : referme les bras au-dessus de la poitrine comme pour serrer un gros ballon, puis rouvre lentement. À sentir : les pectoraux. À éviter : plier les coudes au point de pousser, laisser la bande tirer les bras d'un coup.",
        youtubeQuery: "écarté pectoraux bande élastique au sol",
    },
    "fpb-tirage-assis": {
        name: "Tirage assis à la bande",
        text: "Départ : assise au sol, jambes tendues, bande passée autour des pieds, une extrémité dans chaque main, dos droit. Mouvement : tire les mains vers le ventre en ramenant les coudes près du corps et en serrant les omoplates, puis relâche en contrôle. À sentir : le milieu du dos. À éviter : arrondir le dos, tirer avec les épaules vers les oreilles.",
        youtubeQuery: "tirage assis bande élastique",
    },
    "fpb-face-pull": {
        name: "Face pull à la bande",
        text: "Départ : bande ancrée en hauteur (porte, poignée), une extrémité dans chaque main, bras tendus devant. Mouvement : tire vers le visage en montant les coudes à hauteur d'épaules et en ouvrant les mains vers l'extérieur, comme pour montrer tes biceps, puis reviens. À sentir : l'arrière des épaules et le haut du dos. À éviter : coudes bas, buste qui recule pour aider.",
        youtubeQuery: "face pull bande élastique",
    },
    "fpb-elevations-laterales": {
        name: "Élévations latérales à la bande",
        text: "Départ : debout sur une extrémité de la bande, l'autre dans la main du même côté, bras le long du corps. Mouvement : monte le bras sur le côté, coude légèrement fléchi, jusqu'à hauteur d'épaule, puis redescends lentement. Fais un bras, puis l'autre. À sentir : le côté de l'épaule. À éviter : hausser l'épaule, balancer le buste.",
        youtubeQuery: "élévation latérale bande élastique un bras",
    },
    "fpb-superman": {
        name: "Superman",
        text: "Départ : allongée sur le ventre, bras tendus devant, front vers le sol. Mouvement : décolle en même temps bras, poitrine et jambes de quelques centimètres, tiens une seconde, redescends doucement. À sentir : le bas du dos et les fessiers. À éviter : relever la tête (regarde le sol), monter trop haut en forçant.",
        youtubeQuery: "exercice superman dos",
    },
    "fpb-ouverture-poitrine": {
        name: "Ouverture de poitrine contre un mur",
        text: "Départ : debout de profil près d'un mur, avant-bras posé contre le mur, coude à hauteur d'épaule. Mouvement : tourne doucement le buste dans le sens opposé jusqu'à sentir l'étirement, tiens 30 s en respirant, puis change de côté. À sentir : l'avant de la poitrine et de l'épaule. À éviter : forcer jusqu'à la douleur, hausser l'épaule.",
        youtubeQuery: "étirement pectoraux contre un mur",
    },
    "fpb-squat-bulgare": {
        name: "Squat bulgare",
        text: "Départ : dos à une chaise, le dessus d'un pied posé sur l'assise, pied avant assez loin devant. Mouvement : descends sur la jambe avant jusqu'à ce que la cuisse soit presque horizontale, buste légèrement penché, puis remonte en poussant dans le talon. À sentir : le fessier et la cuisse de la jambe avant. À éviter : le genou avant qui rentre, un pied avant trop proche de la chaise.",
        youtubeQuery: "squat bulgare fessiers débutant",
    },
    "fpb-pont-1j": {
        name: "Pont fessier une jambe",
        text: "Départ : comme le pont fessier, mais une jambe tendue en l'air ou genou ramené vers la poitrine. Mouvement : pousse dans le talon au sol pour monter les hanches, serre le fessier en haut, redescends lentement. À sentir : le fessier de la jambe d'appui. À éviter : le bassin qui penche d'un côté, pousser avec les orteils.",
        youtubeQuery: "pont fessier une jambe",
    },
    "fpb-good-morning": {
        name: "Good morning à la bande",
        text: "Départ : debout sur la bande, pieds à largeur de hanches, la boucle passée derrière la nuque sur le haut du dos, genoux légèrement fléchis. Mouvement : penche le buste vers l'avant en poussant les fesses en arrière, dos bien plat, jusqu'à sentir l'étirement derrière les cuisses, puis redresse-toi en serrant les fessiers. À sentir : arrière des cuisses et fessiers. À éviter : arrondir le dos, plier les genoux comme un squat.",
        youtubeQuery: "good morning bande élastique",
    },
    "fpb-monster-walk": {
        name: "Pas latéraux avec bande (monster walk)",
        text: "Départ : bande autour des cuisses ou des chevilles, pieds écartés, genoux fléchis en demi-squat. Mouvement : fais de petits pas sur le côté sans jamais laisser la bande se détendre, 20 pas d'un côté puis 20 de l'autre. À sentir : le côté des fessiers, ça brûle vite. À éviter : se redresser, laisser les pieds se rejoindre.",
        youtubeQuery: "monster walk bande élastique",
    },
    "fpb-curl-bande": {
        name: "Curl à la bande",
        text: "Départ : debout sur la bande, une extrémité dans chaque main, bras le long du corps, paumes vers l'avant. Mouvement : plie les coudes pour monter les mains vers les épaules, coudes collés au corps, puis redescends en contrôle. À sentir : le devant des bras. À éviter : balancer le buste, avancer les coudes.",
        youtubeQuery: "curl biceps bande élastique",
    },
    "fpb-bird-dog": {
        name: "Bird-dog",
        text: "Départ : à quatre pattes, dos plat, mains sous les épaules, genoux sous les hanches. Mouvement : tends en même temps le bras droit devant et la jambe gauche derrière, à l'horizontale, tiens une seconde, reviens, puis alterne. À sentir : le tronc et le bas du dos qui stabilisent. À éviter : cambrer, faire pivoter le bassin.",
        youtubeQuery: "bird dog exercice gainage",
    },
    "fpb-planche-laterale": {
        name: "Planche latérale",
        text: "Départ : sur un avant-bras, coude sous l'épaule, corps de côté, genoux au sol (facile) ou pieds superposés. Mouvement : monte les hanches pour aligner le corps et tiens, puis change de côté. À sentir : le côté de la taille. À éviter : les hanches qui tombent ou reculent.",
        youtubeQuery: "planche latérale débutant",
    },
};

const VARIANTS: Record<string, string[]> = Object.fromEntries(
    Object.values(EX).map((ex) => [ex.key, ["Bande raccourcie", "Tempo lent"]]),
);
VARIANTS["fpb-pont-2j"] = ["Bande raccourcie", "Tempo lent", "Une jambe", "Pieds surélevés"];
VARIANTS["fpb-pont-1j"] = ["Pied surélevé", "Tempo lent"];
VARIANTS["fpb-pompes-inclinees"] = ["Appui plus bas", "Au sol", "Tempo lent"];
VARIANTS["fpb-squat-bande"] = ["Bande raccourcie", "Tempo lent"];
VARIANTS["fpb-fentes-arriere"] = ["Tempo lent"];
VARIANTS["fpb-squat-bulgare"] = ["Tempo lent"];
VARIANTS["fpb-planche"] = ["Durée plus longue"];
VARIANTS["fpb-planche-laterale"] = ["Pieds superposés", "Durée plus longue"];
VARIANTS["fpb-superman"] = ["Tempo lent"];
VARIANTS["fpb-bird-dog"] = ["Tempo lent"];
delete VARIANTS["fpb-ouverture-poitrine"];

const NUTRITION_PHASE_1: PhaseInfo = {
    key: "fpb-prise",
    label: "Prise de masse progressive (jours 1–40)",
    shortLabel: "Prise progressive",
    description: "Léger surplus : 2 200 kcal, 100 g de protéines, ~70 g de lipides.",
};

const NUTRITION_PHASE_2: PhaseInfo = {
    key: "fpb-maintien",
    label: "Maintien et progression douce (jour 41+)",
    shortLabel: "Maintien",
    description: "1 950 kcal, 100 g de protéines, jusqu'au poids cible.",
};

const NUTRITION: Record<string, PhaseGoals> = {
    "fpb-prise": { protein: 100, calories: 2200, fat: 70 },
    "fpb-maintien": { protein: 100, calories: 1950 },
};

/** Dernier jour de la phase 1 d'entraînement (fin de la semaine 6). */
const TRAINING_PHASE_1_LAST_DAY = 42;

const TRAINING_PHASE_1: TrainingPhase = {
    key: "fpb-rythme-3",
    label: "Phase 1 (3 séances/sem)",
    shortLabel: "Phase 1",
    perWeek: 3,
};

const TRAINING_PHASE_2: TrainingPhase = {
    key: "fpb-rythme-2",
    label: "Phase 2 (2 séances/sem)",
    shortLabel: "Phase 2",
    perWeek: 2,
};

// 0 = dimanche … 6 = samedi.
const PHASE_1_DAYS: Record<number, DayType> = { 1: "fpb-a", 3: "fpb-b", 5: "fpb-c" };
const PHASE_2_DAYS: Record<number, DayType> = { 1: "fpb-1", 4: "fpb-2" };

function trainingPhase(ctx: ScheduleContext): TrainingPhase | null {
    if (ctx.dayNumber < 1) return null;
    return ctx.holdPhase1 || ctx.dayNumber <= TRAINING_PHASE_1_LAST_DAY
        ? TRAINING_PHASE_1
        : TRAINING_PHASE_2;
}

export const FESSIERS_POSTURE: Program = {
    id: "fessiers-posture",
    label: "Fessiers, posture & bien-être",
    shortLabel: "Fessiers & posture",
    inCatalog: true,
    equipment: ["Bande de résistance 10 kg"],
    equipmentOptional: ["Tapis de yoga", "Chaise"],
    objective:
        "Forme et galbe des fessiers, posture et pectoraux, bien-être et régularité dans la durée. Entraînement modéré, jamais proche de l'échec.",
    nutritionNote:
        "Rester en léger surplus est ce qui préserve l'aspect souple et plein. Un déficit calorique durcit et aplatit — on ne coupe pas les calories dans ce programme.",
    trackingNote:
        "Le tour de hanches et de cuisse racontent mieux ta progression que la balance. Autre bon repère : réessaye un vêtement ajusté toutes les 2 semaines.",
    measurementFields: ["hips", "thigh", "waist", "chest", "arm"],
    variants: VARIANTS,
    summary: [
        {
            title: "Principe de construction",
            items: [
                "Chaque séance combine de l'extension de hanche (pont, fentes, squats — volume général du fessier) et de l'abduction de hanche (abduction couchée, fire hydrants, pas latéraux — haut du fessier et moyen fessier, qui donnent le galbe arrondi).",
                "C'est la combinaison des deux qui façonne la forme.",
            ],
        },
        {
            title: "Style d'entraînement",
            items: [
                "Reps élevées (15–25), 3 à 4 répétitions en réserve à chaque série.",
                "Tempo contrôlé sans être lent, repos 60–90 s.",
                "Aucune série jusqu'à l'échec, aucune technique d'intensification.",
                "Séances de 25–30 minutes, agréables et reproductibles semaine après semaine.",
            ],
        },
        {
            title: "Rythme",
            items: [
                "Phase 1 — installation du rythme (semaines 1 à 6) : 3 séances par semaine, lundi, mercredi, vendredi. On ancre l'habitude et on apprend les mouvements.",
                "Phase 2 — maintien (semaine 7 et au-delà) : 2 séances corps entier par semaine, lundi et jeudi, sans date de fin.",
                "Tu peux garder ou retrouver 3 séances par semaine depuis les réglages.",
            ],
        },
        {
            title: "Nutrition",
            items: [
                "Jours 1–40 — prise de masse progressive : 2 200 kcal, 100 g de protéines, ~70 g de lipides.",
                "Jour 41 et + — maintien et progression douce : 1 950 kcal, 100 g de protéines, jusqu'au poids cible.",
                "Moyenne hebdo < +0,15 kg sur 2 semaines → +200 kcal. Au-dessus de +0,5 kg/sem → −150 kcal.",
            ],
        },
        {
            title: "Progression — douce et optionnelle",
            items: [
                "Quand le haut de la fourchette passe confortablement sur toutes les séries, tu peux passer au cran suivant. Sans obligation ni calendrier.",
                "Une seule bande : on progresse d'abord en la raccourcissant (prise plus basse, position plus éloignée de l'ancrage).",
                "Pont deux jambes → une jambe → pieds surélevés.",
                "Pompes inclinées → appui plus bas → au sol.",
                "Squat → tempo plus lent → bulgare.",
                "Planche → durée plus longue.",
            ],
        },
    ],
    length: null,
    hasReferencePage: true,
    sessions: SESSIONS,
    lexicon: LEXICON,
    features: {
        photos: false,
        creatine: false,
        intensification: false,
        trackFat: true,
        targetWeight: true,
        measurementsPrimary: true,
        nutritionFirst: true,
        sessionHabit: true,
        variants: true,
        creatineOptional: true,
        weeklyStreak: true,
    },
    habitFields: ["kcal3000", "protein140", "sleepBefore23"],
    habitLabels: {
        creatine: { label: "Créatine", short: "Créatine" },
        kcal3000: { label: "Calories atteintes", short: "Calories" },
        protein140: { label: "Protéines atteintes", short: "Protéines" },
        sleepBefore23: { label: "~8 h de sommeil", short: "Sommeil" },
    },
    dayTypeForWeekday(weekday, ctx) {
        const phase = ctx ? trainingPhase(ctx) : TRAINING_PHASE_1;
        const days = phase?.perWeek === 2 ? PHASE_2_DAYS : PHASE_1_DAYS;
        return days[weekday] ?? "repos";
    },
    trainingPhase,
    isTrainingDay(dayType) {
        return dayType !== "repos";
    },
    getPhase(dayNumber) {
        if (dayNumber < 1) return null;
        return dayNumber <= 40 ? NUTRITION_PHASE_1 : NUTRITION_PHASE_2;
    },
    nutritionForPhase(phaseKey) {
        return NUTRITION[phaseKey ?? "fpb-prise"] ?? NUTRITION["fpb-prise"];
    },
    nutritionPhase2Key: "fpb-maintien",
    trend: {
        targetText:
            "Vise une prise lente et régulière. Le tour de hanches et de cuisse comptent plus que la balance.",
        highGain: 0.5,
        lowGain: 0.15,
        lowGainTwoWeeks: true,
        deficitText: "Prise > 0,5 kg/sem → retire ~150 kcal/jour.",
        surplusText: "Prise < 0,15 kg/sem depuis 2 semaines → ajoute ~200 kcal/jour.",
    },
};
