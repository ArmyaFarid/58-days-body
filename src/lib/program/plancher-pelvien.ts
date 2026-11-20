// Programme « Plancher pelvien — contrôle » : 84 jours, 3 blocs courts par
// jour (matin, après-midi, soir), sans matériel. Trois phases de 28 jours ;
// la position passe d'allongé (j1–14) à assis (j15–21) puis debout (j22+).
// Le module timing (échelle 1–10, journal privé) complète les exercices.

import type {
  DayType,
  Exercise,
  LexiconEntry,
  PhaseInfo,
  Program,
  Session,
} from "./types";
import { DEFAULT_CALORIE_GOAL, DEFAULT_PROTEIN_GOAL } from "@/lib/nutrition";

export const PELVIC_PROGRAM_ID = "plancher-pelvien";

/** Clés des 3 blocs quotidiens (lignes de set_logs, reps NULL). */
export const PELVIC_BLOCKS = [
  { key: "pp-bloc-matin", label: "Matin", short: "du matin" },
  { key: "pp-bloc-apres-midi", label: "Après-midi", short: "de l’après-midi" },
  { key: "pp-bloc-soir", label: "Soir", short: "du soir" },
] as const;

export const PELVIC_HOLD_KEY = "pp-tenue";

export type PelvicPosition = "allonge" | "assis" | "debout";

export const POSITION_LABELS: Record<PelvicPosition, string> = {
  allonge: "Allongé, genoux pliés",
  assis: "Assis",
  debout: "Debout",
};

export function pelvicPhase(dayNumber: number): 1 | 2 | 3 {
  if (dayNumber <= 28) return 1;
  if (dayNumber <= 56) return 2;
  return 3;
}

export function pelvicPosition(dayNumber: number): PelvicPosition {
  if (dayNumber <= 14) return "allonge";
  if (dayNumber <= 21) return "assis";
  return "debout";
}

/** Étape guidée d'un bloc. */
export type PelvicStep =
  | {
      kind: "cycle";
      key: string;
      name: string;
      reps: number;
      holdSec: number;
      relaxSec: number;
      summary: string;
    }
  | {
      kind: "hold";
      key: string;
      name: string;
      series: number;
      target: string;
      summary: string;
    }
  | { kind: "walk"; key: string; name: string; reps: number; summary: string };

const SLOW = { 1: [10, 5], 2: [12, 8], 3: [12, 10] } as const;
const FAST = { 1: 10, 2: 15, 3: 20 } as const;

/** Exercices d'un bloc, dans l'ordre, pour le jour donné. */
export function pelvicSteps(dayNumber: number): PelvicStep[] {
  const phase = pelvicPhase(dayNumber);
  const [slowReps, slowSec] = SLOW[phase];
  const steps: PelvicStep[] = [
    {
      kind: "cycle",
      key: "pp-lente",
      name: "Contraction lente",
      reps: slowReps,
      holdSec: slowSec,
      relaxSec: slowSec,
      summary: `${slowReps} × ${slowSec} s`,
    },
    {
      kind: "cycle",
      key: "pp-rapide",
      name: "Contraction rapide",
      reps: FAST[phase],
      holdSec: 1,
      relaxSec: 1,
      summary: `${FAST[phase]} impulsions`,
    },
  ];
  if (phase >= 2) {
    const series = phase === 2 ? 1 : 2;
    const target = phase === 2 ? "20–30 s" : "30–45 s";
    steps.push({
      kind: "hold",
      key: PELVIC_HOLD_KEY,
      name: "Tenue longue",
      series,
      target,
      summary: `${series} × max · ${target}`,
    });
  }
  if (phase === 3) {
    steps.push({
      kind: "walk",
      key: "pp-marche",
      name: "Contraction en mouvement",
      reps: 10,
      summary: "10 × 3–5 pas",
    });
  }
  return steps;
}

/** Durée estimée d'un bloc, en minutes (tenue longue ≈ 45 s, transitions comprises). */
export function blockMinutes(steps: PelvicStep[]): number {
  const seconds = steps.reduce((acc, s) => {
    if (s.kind === "cycle") return acc + s.reps * (s.holdSec + s.relaxSec) + 15;
    if (s.kind === "hold") return acc + s.series * 60;
    return acc + s.reps * 6 + 15;
  }, 0);
  return Math.max(3, Math.round(seconds / 60));
}

/** Semaines d'apprentissage du timing. */
export function timingStage(dayNumber: number): {
  label: string;
  short: string;
} {
  const week = Math.floor((Math.max(1, dayNumber) - 1) / 7) + 1;
  if (week <= 3)
    return {
      label: "Semaines 1-3 : observer les signaux",
      short: `semaine ${week} : observe sans agir`,
    };
  if (week <= 6)
    return {
      label: "Semaines 4-6 : premières interventions",
      short: `semaine ${week} : premières interventions`,
    };
  return {
    label: "Semaines 7-12 : interventions fiables",
    short: `semaine ${week} : interventions fiables`,
  };
}

export const TIMING_SIGNALS = [
  { key: "respiration", label: "Respiration rapide" },
  { key: "tension", label: "Cuisses / fessiers tendus" },
  { key: "testicules", label: "Testicules remontés" },
  { key: "chaleur", label: "Chaleur à la base" },
] as const;

export const TIMING_OUTCOMES = [
  { key: "none", label: "Pas tentée" },
  { key: "ok", label: "Réussie" },
  { key: "ko", label: "Ratée" },
] as const;

export type TimingOutcome = (typeof TIMING_OUTCOMES)[number]["key"];

export const BLOCKS_WARNING =
  "Plus de 3 blocs par jour ne donne pas de meilleurs résultats et peut créer une fatigue musculaire contre-productive.";

export const IDENTIFICATION_WARNING =
  "Si tu n'arrives pas à isoler les muscles après quelques jours, ne continue pas à l'aveugle : une séance chez un physiothérapeute en rééducation périnéale règle ça immédiatement avec un biofeedback.";

/** Consignes affichées pendant le minuteur guidé. */
export const STEP_CUES: Record<string, { contract: string; relax: string }> = {
  "pp-lente": {
    contract:
      "Expire et remonte vers l’intérieur, comme un ascenseur. Fessiers et cuisses souples.",
    relax: "Relâche complètement : la zone redescend, tout se détend.",
  },
  "pp-rapide": {
    contract: "Contracte vite et fort, comme un claquement.",
    relax: "Relâche aussitôt, complètement.",
  },
  "pp-marche": {
    contract: "Contracte pendant 3 à 5 pas, marche fluide.",
    relax: "Relâche pendant 3 à 5 pas.",
  },
};

const LEXICON: Record<string, LexiconEntry> = {
  "pp-lente": {
    name: "Contraction lente",
    text: "Inspire par le ventre. Pendant l'expiration, remonte le plancher pelvien vers l'intérieur et vers le haut, comme un ascenseur qui monte d'un étage. Tiens la durée prévue en respirant normalement, puis relâche complètement pendant la même durée. Erreurs : serrer les fessiers, bloquer la respiration, relâcher à moitié, pousser vers le bas.",
  },
  "pp-rapide": {
    name: "Contraction rapide",
    text: "Contracte le plus vite et le plus fort possible, comme un claquement, puis relâche immédiatement et complètement. Environ 1 s de contraction, 1 s de relâchement. Respire normalement. Mieux vaut 10 impulsions nettes que 20 approximatives.",
  },
  "pp-tenue": {
    name: "Tenue longue",
    text: "Debout. Contracte à environ 70 % de ton maximum et tiens aussi longtemps que possible en respirant normalement. Arrête quand la contraction faiblit ou que les fessiers prennent le relais. Note le temps : c'est le seul indicateur chiffré du programme.",
  },
  "pp-marche": {
    name: "Contraction en mouvement",
    text: "Marche à allure normale ou monte un escalier. Contracte pendant 3 à 5 pas en gardant une marche fluide, puis relâche pendant 3 à 5 pas. Répète 10 fois. Ne raidis pas la démarche et ne retiens pas ton souffle.",
  },
};

function toExercise(step: PelvicStep): Exercise {
  if (step.kind === "cycle") {
    return {
      key: step.key,
      name: step.name,
      sets: String(step.reps),
      reps:
        step.holdSec === 1
          ? "impulsions"
          : `${step.holdSec} s tenue / ${step.relaxSec} s relâche`,
      lexiconKey: step.key,
    };
  }
  if (step.kind === "hold") {
    return {
      key: step.key,
      name: step.name,
      sets: String(step.series),
      reps: `max (${step.target})`,
      time: true,
      lexiconKey: step.key,
    };
  }
  return {
    key: step.key,
    name: step.name,
    sets: String(step.reps),
    reps: "3–5 pas",
    lexiconKey: step.key,
  };
}

const PHASE_DAY: Record<string, number> = { "pp-1": 1, "pp-2": 29, "pp-3": 57 };

const SESSIONS: Record<string, Session> = Object.fromEntries(
  Object.entries(PHASE_DAY).map(([dayType, day], i) => [
    dayType,
    {
      dayType: dayType as DayType,
      title: "Blocs du jour",
      focus: `Phase ${i + 1} · 3 blocs`,
      exercises: pelvicSteps(day).map(toExercise),
    },
  ]),
);

const PHASES: Record<1 | 2 | 3, PhaseInfo> = {
  1: {
    key: "pp-phase-1",
    label: "Phase 1 — Apprentissage (jours 1–28)",
    shortLabel: "Phase 1",
    description:
      "Contractions lentes et rapides, allongé puis assis puis debout.",
  },
  2: {
    key: "pp-phase-2",
    label: "Phase 2 — Endurance (jours 29–56)",
    shortLabel: "Phase 2",
    description:
      "Tenues plus longues et arrivée de la tenue longue chronométrée.",
  },
  3: {
    key: "pp-phase-3",
    label: "Phase 3 — Transfert (jours 57–84)",
    shortLabel: "Phase 3",
    description: "Deux tenues longues par bloc et contraction en mouvement.",
  },
};

export const PLANCHER_PELVIEN: Program = {
  id: PELVIC_PROGRAM_ID,
  label: "Plancher pelvien — contrôle",
  shortLabel: "Plancher pelvien",
  inCatalog: true,
  equipment: [],
  equipmentOptional: [],
  objective:
    "3 blocs de 3 à 5 minutes par jour pour renforcer le plancher pelvien et apprendre le timing.",
  summary: [
    {
      title: "Identifier les muscles",
      items: [
        "À faire avant de commencer. Le plancher pelvien est un hamac de muscles entre le pubis et le coccyx. Le périnée, entre les testicules et l'anus, est l'endroit où poser la main pour vérifier.",
        "Méthode A — retenue d'urine : interromps le jet une seule fois, uniquement pour identifier. La répéter peut perturber la vessie ; ce n'est pas un exercice.",
        "Méthode B — retenue de gaz : contracte comme pour retenir un gaz sans serrer les fesses. Tu sens un resserrement autour de l'anus et une légère remontée.",
        "Méthode C — main sur le périnée : debout, main à plat sur le périnée, contracte. Tu dois sentir une remontée nette de 1 à 2 cm. Fessiers, cuisses et ventre ne bougent pas, rien ne pousse vers le bas.",
        "Test de validation, 4 oui avant de commencer : je sens une remontée sous ma main · mes fessiers restent souples · mes cuisses restent souples · je respire normalement.",
        IDENTIFICATION_WARNING,
      ],
    },
    {
      title: "Les exercices",
      items: [
        "Contraction lente — force et endurance : 10 × 5 s (phase 1), 12 × 8 s (phase 2), 12 × 10 s (phase 3). Le relâchement dure aussi longtemps que la contraction.",
        "Contraction rapide — vitesse de recrutement : 10, 15 puis 20 impulsions d'environ 1 s, relâchement complet entre chaque.",
        "Tenue longue — dès la phase 2, debout, à 70 % : 1 × max (objectif 20–30 s) puis 2 × max (30–45 s). Note ton temps : il doit gagner quelques secondes par semaine.",
        "Contraction en mouvement — phase 3 : en marchant, contracte 3 à 5 pas, relâche 3 à 5 pas, 10 fois.",
        "Si tu ne tiens pas encore la durée de ta phase à la fin de celle-ci, reste une semaine de plus : c'est un rythme normal.",
      ],
    },
    {
      title: "Positions",
      items: [
        "Jours 1 à 14 — allongé sur le dos, genoux pliés, pieds à plat, bas du dos neutre. La gravité aide.",
        "Jours 15 à 21 — assis au bord d'une chaise, pieds à plat, dos droit, poids sur les deux ischions. Faisable discrètement partout.",
        "Jours 22 à 84 — debout, pieds à largeur de hanches, genoux déverrouillés, bassin neutre, épaules relâchées.",
      ],
    },
    {
      title: "Échelle d'excitation",
      items: [
        "1-4 : confortable, aucun risque · 5-6 : montée, encore contrôlable · 7-8 : zone d'intervention, c'est ici qu'on agit · 9 : point de non-retour imminent, trop tard · 10 : éjaculation.",
        "L'enjeu : reconnaître le passage en zone 7-8 avant d'y être.",
        "Signaux : respiration qui s'accélère et devient thoracique · cuisses et fessiers qui se tendent · testicules qui remontent · chaleur ou pression à la base du pénis. Ils arrivent dans un ordre assez stable.",
      ],
    },
    {
      title: "Intervenir en zone 7-8",
      items: [
        "1. Contracte le plancher pelvien fermement, 5 à 10 secondes.",
        "2. Ralentis ou arrête le mouvement ; change de rythme ou de position.",
        "3. Détends volontairement fessiers et cuisses.",
        "4. Reprends une fois redescendu vers 5-6.",
        "Ce qui fait échouer : agir trop tard (en 9), contracter mollement, continuer le mouvement pendant la contraction, paniquer.",
        "Semaines 1-3 : observer seulement · semaines 4-6 : premières interventions, souvent ratées · semaines 7-12 : interventions fiables.",
      ],
    },
    {
      title: "Attentes réalistes",
      items: [
        "Les premiers effets apparaissent entre les semaines 4 et 8, le plein effet vers la semaine 12. La sensation de contrôle progresse avant la durée — c'est le premier signal que ça fonctionne.",
        "Les études disponibles portent sur de petits groupes et la durée y est souvent auto-estimée : c'est l'approche non médicamenteuse la mieux documentée, mais ce n'est pas une garantie.",
        "Si rien ne change après 12 semaines faites sérieusement, un urologue ou un sexologue est l'interlocuteur. C'est le trouble sexuel masculin le plus fréquent, et les approches combinées donnent souvent les meilleurs résultats.",
      ],
    },
  ],
  length: 84,
  hasReferencePage: true,
  sessions: SESSIONS,
  lexicon: LEXICON,
  features: {
    photos: false,
    creatine: false,
    intensification: false,
    trackFat: false,
    targetWeight: false,
    measurementsPrimary: false,
    nutritionFirst: false,
    sessionHabit: false,
    variants: false,
    dailyBlocks: true,
  },
  habitFields: [],
  dayTypeForWeekday(_weekday, ctx) {
    const day = ctx?.dayNumber ?? 1;
    return `pp-${pelvicPhase(day)}` as DayType;
  },
  isTrainingDay(dayType) {
    return dayType !== "repos";
  },
  getPhase(dayNumber) {
    if (dayNumber < 1) return null;
    return PHASES[pelvicPhase(dayNumber)];
  },
  nutritionForPhase() {
    return { protein: DEFAULT_PROTEIN_GOAL, calories: DEFAULT_CALORIE_GOAL };
  },
  trend: {
    targetText: "",
    highGain: Infinity,
    lowGain: -Infinity,
    lowGainTwoWeeks: false,
    deficitText: "",
    surplusText: "",
  },
};
