import type { Exercise, LexiconEntry, ProgramId } from "./types";

/**
 * Mode « Internat » : entraînement sans mobilier utilisable (internat, caserne,
 * hôtel). Matériel : le sol, la bande, et au mieux le bord d'un lit pour
 * surélever les pieds. Aucun meuble ne porte le poids du corps.
 *
 * Chaque substitut a SA PROPRE clé (`int-<clé d'origine>`, `-sol` pour la
 * version sans lit) : la « dernière fois » et l'historique d'un substitut ne se
 * mélangent jamais avec ceux de l'original.
 */

/** État figé sur une séance (`workout_sessions.internat`). */
export interface InternatSessionState {
    on: boolean;
    hasBed: boolean;
    /** Clés d'origine revenues à l'original pour cette séance. */
    reverted: string[];
    /** Substitutions faites : clé d'origine → clé du substitut. */
    substitutions: Record<string, string>;
}

interface InternatSubstitute {
    /** Version avec lit ou rebord stable (ou unique version). */
    bed: Exercise;
    /** Version au sol, sans lit. Absente ⇒ même substitut. */
    floor?: Exercise;
    /** Garde le nombre de séries de la séance d'origine (ex. 2 séries en séance C). */
    keepSets?: boolean;
}

export const INTERNAT_ANCHOR_NOTE =
    "Sans porte ni barre, la bande s'ancre sous ton pied, en t'asseyant dessus, ou autour d'un pied de lit lourd. Tous les exercices de dos de ce mode se font assis au sol.";

// ─── Programme 58 jours ───

const TIRAGE_ASSIS: Omit<Exercise, "key"> = {
    name: "Tirage assis à la bande",
    sets: "4",
    reps: "15–20",
    band: "20–30 kg",
    notes: "Assis au sol, jambes tendues, bande autour des pieds, tire vers le ventre.",
    lexiconKey: "int-tirage-assis",
};

const SUBS_58: Record<string, InternatSubstitute> = {
    "pompes-declinees": {
        bed: {
            key: "int-pompes-declinees",
            name: "Pompes déclinées (pieds sur le bord du lit)",
            sets: "4",
            reps: "8–15",
            notes: "Haut des pecs + delts antérieurs.",
            lexiconKey: "int-pompes-declinees-lit",
        },
        floor: {
            key: "int-pompes-declinees-sol",
            name: "Pompes pseudo-planche (mains vers les hanches)",
            sets: "4",
            reps: "6–12",
            notes: "Sans lit : l'inclinaison des épaules remplace les pieds surélevés.",
            lexiconKey: "int-pompes-pseudo-planche",
        },
    },
    "dips-chaises": {
        bed: {
            key: "int-dips-chaises",
            name: "Pompes diamant",
            sets: "3",
            reps: "max −2",
            notes: "Triceps sans chaise.",
            lexiconKey: "int-pompes-diamant",
        },
    },
    "tractions-pronation": { bed: { key: "int-tractions-pronation", ...TIRAGE_ASSIS } },
    "tractions-neutre-supination": { bed: { key: "int-tractions-neutre-supination", ...TIRAGE_ASSIS } },
    "rowing-inverse": {
        bed: {
            key: "int-rowing-inverse",
            name: "Rowing penché à la bande",
            sets: "4",
            reps: "12–15",
            band: "20 kg",
            notes: "Debout sur la bande, buste à 45°, coudes vers l'arrière.",
            lexiconKey: "int-rowing-penche",
        },
    },
    "rowing-inverse-pieds-sureleves": {
        bed: {
            key: "int-rowing-inverse-pieds-sureleves",
            name: "Rowing penché à la bande, bande raccourcie",
            sets: "4",
            reps: "12–15",
            band: "20 kg raccourcie",
            notes: "Prends la bande plus bas pour durcir.",
            lexiconKey: "int-rowing-penche",
        },
    },
    "face-pull": {
        bed: {
            key: "int-face-pull",
            name: "Face pull assis à la bande",
            sets: "3",
            reps: "15–20",
            band: "10 kg",
            notes: "Bande autour des pieds, tire vers le visage, coudes hauts.",
            lexiconKey: "int-face-pull-assis",
        },
    },
    "pull-over-bande": {
        bed: {
            key: "int-pull-over-bande",
            name: "Pull-over allongé au sol à la bande",
            sets: "3",
            reps: "12–15",
            band: "10–20 kg",
            notes: "Bande sous le haut du dos, bras semi-tendus des oreilles vers les hanches.",
            lexiconKey: "int-pull-over-sol",
        },
    },
    "dead-hang": {
        bed: {
            key: "int-dead-hang",
            name: "Tenue isométrique à la bande",
            sets: "3",
            reps: "30–60 s",
            time: true,
            notes: "Avant-bras + poigne : debout sur la bande, bras à demi fléchis, tiens la tension.",
            lexiconKey: "int-tenue-isometrique",
        },
    },
    "squat-bulgare": {
        bed: {
            key: "int-squat-bulgare",
            name: "Squat bulgare (pied arrière sur le bord du lit)",
            sets: "4",
            reps: "10–15/jambe",
            lexiconKey: "int-squat-bulgare-lit",
        },
        floor: {
            key: "int-squat-bulgare-sol",
            name: "Fentes arrière, grand pas",
            sets: "3",
            reps: "12–15/jambe",
            lexiconKey: "int-fentes-arriere",
        },
    },
    mollets: {
        bed: {
            key: "int-mollets",
            name: "Mollets au sol, une jambe (pause 2 s en haut)",
            sets: "3",
            reps: "20–25/jambe",
            lexiconKey: "int-mollets-sol",
        },
    },
    "releves-jambes": {
        bed: {
            key: "int-releves-jambes",
            name: "Crunch inversé au sol",
            sets: "3",
            reps: "12–15",
            lexiconKey: "int-crunch-inverse",
        },
    },
    "crunch-bande": {
        bed: {
            key: "int-crunch-bande",
            name: "Crunch au sol (tempo 3 s ou lesté)",
            sets: "3",
            reps: "15",
            lexiconKey: "int-crunch-sol",
        },
    },
    // Le circuit contient déjà un tirage assis : le rowing penché évite le doublon.
    "pump-tractions": {
        bed: {
            key: "int-pump-tractions",
            name: "Rowing penché à la bande",
            sets: "3 tours",
            reps: "12–15",
            lexiconKey: "int-rowing-penche-pump",
        },
    },
    "pump-crunch": {
        bed: {
            key: "int-pump-crunch",
            name: "Crunch au sol (tempo 3 s)",
            sets: "3 tours",
            reps: "15",
            lexiconKey: "int-crunch-sol",
        },
    },
};

// ─── Fessiers, posture & bien-être ───

const SUBS_FPB: Record<string, InternatSubstitute> = {
    "fpb-face-pull": {
        keepSets: true,
        bed: {
            key: "int-fpb-face-pull",
            name: "Face pull assis à la bande (bande autour des pieds)",
            sets: "3",
            reps: "20",
            lexiconKey: "int-fpb-face-pull-assis",
        },
    },
    "fpb-pompes-inclinees": {
        keepSets: true,
        bed: {
            key: "int-fpb-pompes-inclinees",
            name: "Pompes inclinées (mains sur le bord du lit)",
            sets: "3",
            reps: "10–15",
            lexiconKey: "int-fpb-pompes-lit",
        },
        floor: {
            key: "int-fpb-pompes-inclinees-sol",
            name: "Pompes sur les genoux",
            sets: "3",
            reps: "10–15",
            lexiconKey: "int-fpb-pompes-genoux",
        },
    },
    "fpb-squat-bulgare": {
        keepSets: true,
        bed: {
            key: "int-fpb-squat-bulgare",
            name: "Squat bulgare (pied arrière sur le bord du lit)",
            sets: "3",
            reps: "12–15/jambe",
            lexiconKey: "int-fpb-squat-bulgare-lit",
        },
        floor: {
            key: "int-fpb-squat-bulgare-sol",
            name: "Fentes arrière, grand pas",
            sets: "3",
            reps: "12–15/jambe",
            lexiconKey: "int-fpb-fentes-arriere",
        },
    },
    "fpb-ouverture-poitrine": {
        bed: {
            key: "int-fpb-ouverture-poitrine",
            name: "Étirement de poitrine debout, mains jointes derrière le dos",
            sets: "1",
            reps: "30 s",
            time: true,
            lexiconKey: "int-fpb-etirement-poitrine",
        },
    },
};

const BY_PROGRAM: Partial<Record<ProgramId, Record<string, InternatSubstitute>>> = {
    "programme-58": SUBS_58,
    "fessiers-posture": SUBS_FPB,
};

// ─── Lexique ───

function outro(original: string): string {
    return ` Substitut de ${original} — même muscle ciblé, charge un peu différente. Reprends l'original dès que tu retrouves ton matériel.`;
}

export const INTERNAT_LEXICON: Record<string, LexiconEntry> = {
    "int-pompes-declinees-lit": {
        name: "Pompes déclinées, pieds sur le lit",
        text:
            "Départ : mains au sol un peu plus larges que les épaules, pointes de pieds posées sur le bord du lit, corps gainé en ligne droite. Mouvement : descends la poitrine jusqu'à frôler le sol, coudes à 45° du corps, puis repousse. À sentir : le haut des pectoraux et l'avant des épaules. À éviter : un matelas trop mou qui fait glisser les pieds (cale-les sur le cadre), les hanches qui tombent." +
            outro("Pompes déclinées (pieds sur chaise)"),
        youtubeQuery: "pompes déclinées pieds surélevés",
    },
    "int-pompes-pseudo-planche": {
        name: "Pompes pseudo-planche",
        text:
            "Départ : position de pompe, mains au sol tournées vers l'extérieur et placées au niveau du bas des côtes, épaules penchées en avant au-delà des mains. Mouvement : descends en gardant cette inclinaison, coudes serrés le long du corps, puis repousse sans reculer les épaules. À sentir : l'avant des épaules et le haut des pectoraux. À éviter : laisser les épaules revenir au-dessus des mains, cambrer le bas du dos." +
            outro("Pompes déclinées (pieds sur chaise)"),
        youtubeQuery: "pseudo planche push up",
    },
    "int-pompes-diamant": {
        name: "Pompes diamant",
        text:
            "Départ : mains rapprochées sous la poitrine, pouces et index qui se touchent en losange, corps gainé. Mouvement : descends la poitrine vers les mains en gardant les coudes le long du corps, puis repousse jusqu'aux bras tendus. À sentir : l'arrière des bras (triceps). À éviter : écarter les coudes, laisser tomber les hanches. Trop dur ? Pose les genoux." +
            outro("Dips sur chaise"),
        youtubeQuery: "pompes diamant",
    },
    "int-tirage-assis": {
        name: "Tirage assis à la bande",
        text:
            "Départ : assis au sol, jambes tendues, la bande passée autour de la plante des pieds, une extrémité dans chaque main, buste droit. Mouvement : tire les mains vers le nombril en serrant les omoplates, coudes près du corps, tiens 1 s, puis relâche lentement. À sentir : le milieu et les côtés du dos (grand dorsal, rhomboïdes). À éviter : te pencher en arrière pour tricher, hausser les épaules. Raccourcis la bande pour garder 15–20 reps durs." +
            outro("Tractions"),
        youtubeQuery: "seated band row",
    },
    "int-rowing-penche": {
        name: "Rowing penché à la bande",
        text:
            "Départ : debout sur la bande, pieds à largeur de hanches, genoux légèrement fléchis, buste penché à 45° dos plat, une extrémité dans chaque main. Mouvement : tire les coudes vers l'arrière et vers les hanches, serre les omoplates 1 s, redescends en contrôle. À sentir : l'épaisseur du dos et l'arrière des épaules. À éviter : arrondir le dos, te redresser à chaque rep. Plus tu prends la bande bas, plus c'est dur." +
            outro("Rowing inversé"),
        youtubeQuery: "bent over row resistance band",
    },
    "int-rowing-penche-pump": {
        name: "Rowing penché à la bande",
        text:
            "Départ : debout sur la bande, genoux légèrement fléchis, buste penché à 45° dos plat. Mouvement : tire les coudes vers l'arrière, serre les omoplates, redescends en contrôle — rythme de circuit, sans bâcler l'amplitude. À sentir : le dos et l'arrière des épaules. À éviter : arrondir le dos, tirer avec les bras seulement. Dans ce circuit, il remplace les tractions parce que le tirage assis y est déjà." +
            outro("Tractions"),
        youtubeQuery: "bent over row resistance band",
    },
    "int-face-pull-assis": {
        name: "Face pull assis à la bande",
        text:
            "Départ : assis au sol, jambes tendues, bande autour des pieds, une extrémité dans chaque main, bras tendus devant. Mouvement : tire les mains vers ton visage en montant les coudes à hauteur d'épaules et en écartant les mains de chaque côté de la tête, tiens 1 s, relâche lentement. À sentir : l'arrière des épaules et le haut du dos. À éviter : coudes qui descendent (ça devient un rowing), buste qui part en arrière." +
            outro("Face pull (ancrage haut)"),
        youtubeQuery: "seated face pull resistance band",
    },
    "int-pull-over-sol": {
        name: "Pull-over allongé au sol à la bande",
        text:
            "Départ : allongé sur le dos, genoux pliés, la bande passée sous le haut du dos (au niveau des omoplates), une extrémité dans chaque main, bras semi-tendus au-dessus de la tête près des oreilles. Mouvement : ramène les mains en arc de cercle jusqu'aux hanches, bras toujours semi-tendus, puis reviens lentement. À sentir : le grand dorsal sur les côtés du dos. À éviter : plier les coudes (ça devient un triceps), cambrer le bas du dos." +
            outro("Pull-over à la bande (ancrage haut)"),
        youtubeQuery: "lying band pullover",
    },
    "int-tenue-isometrique": {
        name: "Tenue isométrique à la bande",
        text:
            "Départ : debout sur la bande, pieds à largeur de hanches, une extrémité dans chaque main, prise serrée. Mouvement : monte les mains jusqu'à ce que les bras soient à demi fléchis (coudes à 90°) et tiens la tension sans bouger 30 à 60 s, en serrant fort les poignées. À sentir : les avant-bras et la poigne, les biceps en appui. À éviter : relâcher la prise, hausser les épaules. Note la durée tenue." +
            outro("Dead hang"),
        youtubeQuery: "isometric hold resistance band grip",
    },
    "int-squat-bulgare-lit": {
        name: "Squat bulgare, pied arrière sur le lit",
        text:
            "Départ : dos au lit, un grand pas devant, le dessus du pied arrière posé sur le bord du cadre (pas au milieu du matelas). Mouvement : descends verticalement jusqu'à ce que la cuisse avant soit parallèle au sol, remonte en poussant dans le talon avant. À sentir : la cuisse et le fessier de la jambe avant. À éviter : un matelas trop mou qui déséquilibre, le genou avant qui rentre vers l'intérieur." +
            outro("Squat bulgare (pied arrière sur chaise)"),
        youtubeQuery: "squat bulgare",
    },
    "int-fentes-arriere": {
        name: "Fentes arrière, grand pas",
        text:
            "Départ : debout, pieds à largeur de hanches. Mouvement : fais un grand pas en arrière, descends jusqu'à ce que le genou arrière frôle le sol, puis remonte en poussant dans le talon de la jambe avant. Enchaîne toutes les reps d'une jambe avant de changer. À sentir : la cuisse et le fessier de la jambe avant. À éviter : un pas trop court, le genou avant qui dépasse loin devant les orteils ou rentre vers l'intérieur." +
            outro("Squat bulgare (pied arrière sur chaise)"),
        youtubeQuery: "fente arrière",
    },
    "int-mollets-sol": {
        name: "Mollets au sol, une jambe",
        text:
            "Départ : debout sur une jambe, l'autre pied replié derrière, une main contre le mur pour l'équilibre. Mouvement : monte le plus haut possible sur la pointe du pied, tiens 2 s en haut, redescends lentement jusqu'au talon au sol. À sentir : le mollet, surtout en haut. À éviter : rebondir, plier le genou pour s'aider. Sans marche, l'amplitude est plus courte : la pause de 2 s compense." +
            outro("Mollets sur une marche"),
        youtubeQuery: "single leg calf raise floor",
    },
    "int-crunch-inverse": {
        name: "Crunch inversé au sol",
        text:
            "Départ : allongé sur le dos, bras le long du corps, mains à plat, genoux pliés à 90° au-dessus des hanches. Mouvement : ramène les genoux vers la poitrine en décollant le bassin du sol en fin de mouvement, puis redescends lentement sans reposer les pieds. À sentir : le bas des abdominaux. À éviter : prendre de l'élan avec les jambes, pousser fort avec les mains." +
            outro("Relevés de jambes suspendu"),
        youtubeQuery: "reverse crunch",
    },
    "int-crunch-sol": {
        name: "Crunch au sol, tempo 3 s",
        text:
            "Départ : allongé sur le dos, genoux pliés, pieds au sol, mains croisées sur la poitrine — tu peux y tenir un sac ou un livre pour lester. Mouvement : enroule le haut du dos en décollant les omoplates, expire, tiens 1 s, redescends en 3 s. À sentir : le haut des abdominaux. À éviter : tirer sur la nuque, remonter jusqu'à s'asseoir." +
            outro("Crunch à la bande (ancrage bas)"),
        youtubeQuery: "crunch au sol",
    },

    // Fessiers, posture & bien-être
    "int-fpb-face-pull-assis": {
        name: "Face pull assis à la bande",
        text:
            "Départ : assise au sol, jambes tendues, bande autour des pieds, une extrémité dans chaque main, bras tendus devant. Mouvement : tire les mains vers ton visage en montant les coudes à hauteur d'épaules et en écartant les mains de chaque côté de la tête, tiens 1 s, relâche lentement. À sentir : l'arrière des épaules et le haut du dos, ce qui ouvre la posture. À éviter : coudes qui descendent, buste qui part en arrière." +
            outro("Face pull (ancrage haut)"),
        youtubeQuery: "seated face pull resistance band",
    },
    "int-fpb-pompes-lit": {
        name: "Pompes inclinées, mains sur le lit",
        text:
            "Départ : mains sur le bord du cadre du lit, un peu plus larges que les épaules, corps en ligne droite. Mouvement : descends la poitrine vers le bord du lit, coudes à environ 45° du corps, puis repousse. À sentir : les pectoraux et l'arrière des bras. À éviter : appuyer au milieu du matelas (instable), laisser tomber les hanches. Le lit est plus bas qu'un comptoir : c'est un peu plus dur." +
            outro("Pompes inclinées"),
        youtubeQuery: "incline push up",
    },
    "int-fpb-pompes-genoux": {
        name: "Pompes sur les genoux",
        text:
            "Départ : mains au sol un peu plus larges que les épaules, genoux posés au sol, corps en ligne droite des épaules aux genoux. Mouvement : descends la poitrine vers le sol, coudes à environ 45° du corps, puis repousse. À sentir : les pectoraux et l'arrière des bras. À éviter : fesses en l'air, hanches qui tombent. Un coussin sous les genoux aide." +
            outro("Pompes inclinées"),
        youtubeQuery: "pompes sur les genoux",
    },
    "int-fpb-squat-bulgare-lit": {
        name: "Squat bulgare, pied arrière sur le lit",
        text:
            "Départ : dos au lit, un grand pas devant, le dessus du pied arrière posé sur le bord du cadre. Mouvement : descends verticalement, buste légèrement penché vers l'avant, jusqu'à ce que la cuisse avant soit presque parallèle au sol, remonte en poussant dans le talon avant. À sentir : le fessier de la jambe avant. À éviter : un matelas trop mou qui déséquilibre, le genou avant qui rentre vers l'intérieur." +
            outro("Squat bulgare (pied arrière sur chaise)"),
        youtubeQuery: "squat bulgare fessiers",
    },
    "int-fpb-fentes-arriere": {
        name: "Fentes arrière, grand pas",
        text:
            "Départ : debout, pieds à largeur de hanches. Mouvement : fais un grand pas en arrière, descends jusqu'à ce que le genou arrière frôle le sol, buste légèrement penché vers l'avant, puis remonte en poussant dans le talon avant. Enchaîne toutes les reps d'une jambe. À sentir : le fessier de la jambe avant. À éviter : un pas trop court (ça charge les cuisses), le genou avant qui rentre vers l'intérieur." +
            outro("Squat bulgare (pied arrière sur chaise)"),
        youtubeQuery: "fente arrière fessiers",
    },
    "int-fpb-etirement-poitrine": {
        name: "Étirement de poitrine debout",
        text:
            "Départ : debout, pieds à largeur de hanches, bras tendus derrière le dos, mains jointes (doigts croisés). Mouvement : rapproche les omoplates, ouvre la poitrine vers l'avant et monte doucement les mains, tiens 30 s en respirant calmement. À sentir : l'étirement à l'avant des épaules et sur les pectoraux. À éviter : cambrer le bas du dos, hausser les épaules vers les oreilles." +
            outro("Ouverture de poitrine contre un mur"),
        youtubeQuery: "étirement pectoraux debout mains derrière le dos",
    },
};

// ─── Application ───

export function internatSubstitutes(programId: string): Record<string, InternatSubstitute> {
    return BY_PROGRAM[programId as ProgramId] ?? {};
}

/** Le programme a des substituts dans au moins une de ces séances. */
export function hasInternatSubstitutes(programId: string, exercises: Exercise[]): boolean {
    const subs = internatSubstitutes(programId);
    return exercises.some((ex) => subs[ex.key] != null);
}

/** Toutes les entrées (pour les libellés d'historique). */
export function allInternatSubstitutes(): { originalKey: string; exercises: Exercise[] }[] {
    return Object.values(BY_PROGRAM).flatMap((subs) =>
        Object.entries(subs ?? {}).map(([originalKey, s]) => ({
            originalKey,
            exercises: s.floor ? [s.bed, s.floor] : [s.bed],
        })),
    );
}

export interface InternatSlot {
    /** Exercice affiché (substitut, ou original si revenu / sans substitut). */
    exercise: Exercise;
    /** Original remplaçable, avec le substitut qui lui correspond (null : rien à remplacer). */
    swap: { original: Exercise; substitute: Exercise; replaced: boolean } | null;
}

/** Exercices d'une séance selon l'état Internat. */
export function applyInternat(
    programId: string,
    exercises: Exercise[],
    state: InternatSessionState,
): InternatSlot[] {
    const subs = internatSubstitutes(programId);
    return exercises.map((ex) => {
        const sub = subs[ex.key];
        if (!state.on || !sub) return { exercise: ex, swap: null };
        const picked = !state.hasBed && sub.floor ? sub.floor : sub.bed;
        const substitute = sub.keepSets ? { ...picked, sets: ex.sets } : picked;
        const replaced = !state.reverted.includes(ex.key);
        return { exercise: replaced ? substitute : ex, swap: { original: ex, substitute, replaced } };
    });
}

/** Clé d'origine → clé du substitut, pour les exercices effectivement remplacés. */
export function substitutionsOf(slots: InternatSlot[]): Record<string, string> {
    const out: Record<string, string> = {};
    for (const s of slots) {
        if (s.swap?.replaced) out[s.swap.original.key] = s.swap.substitute.key;
    }
    return out;
}

/**
 * État effectif d'une séance. Une séance figée garde son état ; sinon, elle
 * suit le réglage global à partir d'aujourd'hui, et le mode normal avant.
 */
export function effectiveInternat(
    stored: InternatSessionState | null,
    date: string,
    today: string,
    user: { mode: boolean; hasBed: boolean },
): InternatSessionState {
    if (stored) return stored;
    return { on: user.mode && date >= today, hasBed: user.hasBed, reverted: [], substitutions: {} };
}
