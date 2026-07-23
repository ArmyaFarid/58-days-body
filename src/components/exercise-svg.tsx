// Pictogrammes minimalistes (stick figures) pour les exercices du programme.
// Deux poses par exercice : Départ → Arrivée. Trait = currentColor (thème).

type Seg = [number, number, number, number];
type Head = [number, number, number];

interface Pose {
    head: Head;
    segments: Seg[];
}

interface Drawing {
    equip?: { segments: Seg[]; dashed?: boolean };
    a: Pose;
    b: Pose;
}

// Figure debout de base (réutilisée), centrée sur x=58.
const stand = (arms: Seg[]): Pose => ({
    head: [58, 24, 7],
    segments: [[58, 31, 58, 64], [58, 64, 49, 98], [58, 64, 67, 98], ...arms],
});

const DRAWINGS: Record<string, Drawing> = {
    "elevations-laterales": {
        a: stand([[58, 39, 55, 62], [58, 39, 61, 62]]),
        b: stand([[58, 39, 37, 39], [58, 39, 79, 39]]),
    },
    "curl-bande": {
        equip: {
            dashed: true,
            segments: [[49, 98, 55, 62], [67, 98, 61, 62]],
        },
        a: stand([[58, 40, 55, 62], [58, 40, 61, 62]]),
        b: stand([[58, 40, 55, 45], [58, 40, 61, 45]]),
    },
    tractions: {
        equip: { segments: [[18, 12, 98, 12]] },
        a: {
            head: [58, 48, 7],
            segments: [
                [50, 12, 56, 41],
                [66, 12, 60, 41],
                [58, 55, 58, 84],
                [58, 84, 50, 104],
                [58, 84, 66, 104],
            ],
        },
        b: {
            head: [58, 30, 6],
            segments: [
                [50, 12, 54, 26],
                [66, 12, 62, 26],
                [58, 36, 58, 64],
                [58, 64, 50, 86],
                [58, 64, 66, 86],
            ],
        },
    },
    "face-pull": {
        equip: {
            dashed: true,
            segments: [[58, 10, 50, 44], [58, 10, 66, 44]],
        },
        a: stand([[58, 40, 50, 44], [58, 40, 66, 44]]),
        b: stand([[58, 40, 47, 30], [58, 40, 69, 30]]),
    },
    "pike-push-ups": {
        a: {
            head: [50, 64, 5],
            segments: [
                [34, 96, 54, 60],
                [54, 60, 70, 42],
                [70, 42, 92, 96],
            ],
        },
        b: {
            head: [40, 84, 5],
            segments: [
                [30, 96, 46, 78],
                [46, 78, 70, 46],
                [70, 46, 92, 96],
            ],
        },
    },
    "rowing-inverse": {
        equip: { segments: [[40, 28, 78, 28]] },
        a: {
            head: [30, 74, 6],
            segments: [
                [37, 76, 96, 94],
                [96, 94, 104, 100],
                [50, 28, 44, 74],
                [62, 28, 46, 74],
            ],
        },
        b: {
            head: [34, 60, 6],
            segments: [
                [41, 62, 96, 92],
                [96, 92, 104, 98],
                [50, 28, 46, 46],
                [62, 28, 50, 48],
            ],
        },
    },
    "pompes-declinees": {
        equip: { segments: [[84, 88, 104, 88]] },
        a: {
            head: [22, 72, 6],
            segments: [
                [30, 74, 92, 90],
                [40, 76, 40, 96],
                [92, 90, 96, 88],
            ],
        },
        b: {
            head: [22, 86, 6],
            segments: [
                [30, 88, 92, 92],
                [40, 90, 46, 80],
                [46, 80, 40, 92],
                [92, 92, 96, 88],
            ],
        },
    },
    "dips-chaises": {
        equip: { segments: [[34, 50, 34, 98], [82, 50, 82, 98]] },
        a: {
            head: [58, 44, 6],
            segments: [
                [34, 52, 54, 50],
                [82, 52, 62, 50],
                [58, 50, 58, 74],
                [58, 74, 50, 90],
                [58, 74, 66, 90],
            ],
        },
        b: {
            head: [58, 56, 6],
            segments: [
                [34, 52, 44, 64],
                [44, 64, 54, 62],
                [82, 52, 72, 64],
                [72, 64, 62, 62],
                [58, 62, 58, 84],
                [58, 84, 50, 98],
                [58, 84, 66, 98],
            ],
        },
    },

    // ─── Poussée ───
    "pompes-standards": {
        a: {
            head: [22, 74, 6],
            segments: [[30, 76, 96, 90], [40, 78, 40, 96], [96, 90, 102, 96]],
        },
        b: {
            head: [22, 88, 6],
            segments: [[30, 90, 96, 92], [40, 92, 46, 82], [46, 82, 40, 94], [96, 92, 102, 96]],
        },
    },
    "pompes-diamant": {
        a: {
            head: [22, 74, 6],
            segments: [[30, 76, 96, 90], [50, 78, 46, 96], [96, 90, 102, 96]],
        },
        b: {
            head: [22, 88, 6],
            segments: [[30, 90, 96, 92], [50, 92, 54, 84], [54, 84, 46, 94], [96, 92, 102, 96]],
        },
    },
    "pompes-pseudo-planche": {
        a: {
            head: [28, 72, 6],
            segments: [[34, 74, 98, 92], [54, 76, 52, 96], [98, 92, 104, 98]],
        },
        b: {
            head: [28, 86, 6],
            segments: [[34, 88, 98, 94], [54, 90, 60, 82], [60, 82, 52, 94], [98, 94, 104, 98]],
        },
    },
    "developpe-epaules-bande": {
        equip: { dashed: true, segments: [[49, 98, 50, 36], [67, 98, 66, 36]] },
        a: stand([[58, 38, 48, 34], [58, 38, 68, 34]]),
        b: stand([[58, 38, 50, 14], [58, 38, 66, 14]]),
    },
    "upright-row": {
        equip: { dashed: true, segments: [[49, 98, 55, 62], [67, 98, 61, 62]] },
        a: stand([[58, 40, 55, 62], [58, 40, 61, 62]]),
        b: stand([[58, 40, 45, 44], [45, 44, 54, 48], [58, 40, 71, 44], [71, 44, 62, 48]]),
    },
    "extension-triceps-oh": {
        equip: { dashed: true, segments: [[58, 98, 58, 34]] },
        a: stand([[58, 38, 50, 22], [50, 22, 57, 34], [58, 38, 66, 22], [66, 22, 61, 34]]),
        b: stand([[58, 38, 50, 22], [50, 22, 52, 12], [58, 38, 66, 22], [66, 22, 64, 12]]),
    },
    shrugs: {
        equip: { dashed: true, segments: [[49, 98, 52, 63], [67, 98, 64, 63]] },
        a: stand([[58, 37, 52, 63], [58, 37, 64, 63]]),
        b: {
            head: [58, 24, 7],
            segments: [[58, 31, 58, 64], [58, 64, 49, 98], [58, 64, 67, 98], [58, 31, 52, 57], [58, 31, 64, 57]],
        },
    },

    // ─── Tirage ───
    "tractions-assistees": {
        equip: { segments: [[18, 12, 98, 12], [58, 12, 50, 104]] },
        a: {
            head: [58, 48, 7],
            segments: [
                [50, 12, 56, 41],
                [66, 12, 60, 41],
                [58, 55, 58, 84],
                [58, 84, 50, 104],
                [58, 84, 66, 104],
            ],
        },
        b: {
            head: [58, 30, 6],
            segments: [
                [50, 12, 54, 26],
                [66, 12, 62, 26],
                [58, 36, 58, 64],
                [58, 64, 50, 86],
                [58, 64, 66, 86],
            ],
        },
    },
    "tirage-bande-assis": {
        equip: { dashed: true, segments: [[96, 72, 96, 84]] },
        a: {
            head: [36, 44, 6],
            segments: [[38, 50, 38, 78], [38, 78, 96, 82], [42, 54, 92, 76]],
        },
        b: {
            head: [36, 44, 6],
            segments: [[38, 50, 38, 78], [38, 78, 96, 82], [42, 54, 64, 66], [64, 66, 44, 74]],
        },
    },
    "pull-over-bande": {
        equip: { dashed: true, segments: [[30, 12, 42, 16]] },
        a: stand([[58, 38, 42, 16], [58, 40, 44, 18]]),
        b: stand([[58, 38, 46, 64], [58, 40, 48, 66]]),
    },
    "elevations-buste-penche": {
        equip: { dashed: true, segments: [[52, 98, 45, 64]] },
        a: {
            head: [40, 40, 6],
            segments: [[45, 44, 64, 64], [64, 64, 56, 98], [64, 64, 72, 98], [45, 46, 42, 66], [47, 46, 52, 66]],
        },
        b: {
            head: [40, 40, 6],
            segments: [[45, 44, 64, 64], [64, 64, 56, 98], [64, 64, 72, 98], [45, 46, 28, 50], [47, 46, 64, 44]],
        },
    },

    // ─── Bras ───
    "curl-marteau": {
        equip: { dashed: true, segments: [[49, 98, 55, 62], [67, 98, 61, 62]] },
        a: stand([[58, 40, 55, 62], [58, 40, 61, 62]]),
        b: stand([[58, 40, 55, 45], [58, 40, 61, 45]]),
    },
    "curl-inverse": {
        equip: { dashed: true, segments: [[49, 98, 55, 62], [67, 98, 61, 62]] },
        a: stand([[58, 40, 55, 62], [58, 40, 61, 62]]),
        b: stand([[58, 40, 55, 45], [58, 40, 61, 45]]),
    },
    "curl-concentre": {
        equip: { dashed: true, segments: [[66, 98, 64, 60]] },
        a: {
            head: [44, 42, 6],
            segments: [[46, 48, 54, 72], [54, 72, 88, 74], [88, 74, 88, 98], [48, 50, 58, 70], [58, 70, 66, 86]],
        },
        b: {
            head: [44, 42, 6],
            segments: [[46, 48, 54, 72], [54, 72, 88, 74], [88, 74, 88, 98], [48, 50, 58, 70], [58, 70, 56, 54]],
        },
    },
    "dead-hang": {
        equip: { segments: [[18, 12, 98, 12]] },
        a: {
            head: [58, 32, 7],
            segments: [[52, 12, 56, 26], [66, 12, 60, 26], [58, 39, 58, 74], [58, 74, 50, 98], [58, 74, 66, 98]],
        },
        b: {
            head: [58, 34, 7],
            segments: [[52, 12, 56, 28], [66, 12, 60, 28], [58, 41, 58, 78], [58, 78, 52, 100], [58, 78, 64, 100]],
        },
    },

    // ─── Jambes et abdos ───
    "squat-bulgare": {
        equip: { segments: [[72, 72, 98, 72], [88, 72, 88, 98]] },
        a: {
            head: [46, 22, 7],
            segments: [[46, 29, 46, 58], [46, 58, 44, 98], [46, 58, 68, 70], [68, 70, 84, 72]],
        },
        b: {
            head: [40, 34, 7],
            segments: [[42, 41, 48, 66], [48, 66, 40, 82], [40, 82, 44, 98], [48, 66, 68, 72], [68, 72, 84, 72]],
        },
    },
    "pistol-squat": {
        a: {
            head: [52, 22, 7],
            segments: [[52, 29, 52, 60], [52, 60, 52, 98], [52, 60, 86, 58], [52, 34, 74, 42]],
        },
        b: {
            head: [44, 44, 7],
            segments: [[46, 51, 50, 74], [50, 74, 46, 98], [50, 74, 88, 64], [46, 54, 74, 54]],
        },
    },
    "good-morning": {
        equip: { dashed: true, segments: [[49, 98, 50, 36], [67, 98, 66, 36]] },
        a: {
            head: [58, 24, 7],
            segments: [[58, 31, 58, 60], [58, 60, 52, 98], [58, 60, 64, 98], [58, 36, 50, 38], [58, 36, 66, 38]],
        },
        b: {
            head: [34, 42, 6],
            segments: [[40, 44, 66, 60], [66, 60, 60, 98], [66, 60, 72, 98], [40, 44, 34, 50], [42, 44, 40, 52]],
        },
    },
    "nordic-curl": {
        equip: { segments: [[38, 96, 74, 96]] },
        a: {
            head: [52, 30, 7],
            segments: [[52, 37, 52, 88], [52, 88, 40, 94], [52, 88, 72, 94]],
        },
        b: {
            head: [30, 54, 7],
            segments: [[34, 58, 54, 86], [54, 86, 42, 94], [54, 86, 74, 94], [34, 58, 24, 74]],
        },
    },
    "pont-fessier-unilateral": {
        equip: { segments: [[24, 96, 92, 96]] },
        a: {
            // Hanches basses : dos au sol, une jambe pliée (pied à plat), l'autre tendue.
            head: [28, 86, 6],
            segments: [[33, 88, 58, 90], [58, 90, 66, 74], [66, 74, 66, 96], [58, 90, 86, 82], [33, 88, 44, 96]],
        },
        b: {
            // Hanches hautes : ligne épaules-hanches-genou, jambe libre levée.
            head: [28, 86, 6],
            segments: [[33, 88, 58, 72], [58, 72, 66, 74], [66, 74, 66, 96], [58, 72, 82, 56], [33, 88, 44, 96]],
        },
    },
    mollets: {
        equip: { segments: [[40, 88, 58, 88], [58, 88, 58, 104]] },
        a: {
            head: [58, 26, 7],
            segments: [[58, 33, 58, 66], [58, 66, 58, 96], [58, 66, 68, 80]],
        },
        b: {
            head: [58, 20, 7],
            segments: [[58, 27, 58, 60], [58, 60, 58, 88], [58, 60, 68, 74]],
        },
    },
    "releves-jambes": {
        equip: { segments: [[18, 12, 98, 12]] },
        a: {
            head: [58, 30, 7],
            segments: [[52, 12, 56, 24], [66, 12, 60, 24], [58, 37, 58, 66], [58, 66, 52, 98], [58, 66, 64, 98]],
        },
        b: {
            head: [58, 30, 7],
            segments: [[52, 12, 56, 24], [66, 12, 60, 24], [58, 37, 58, 60], [58, 60, 84, 58], [58, 60, 90, 62]],
        },
    },
    "crunch-bande": {
        equip: { dashed: true, segments: [[92, 96, 56, 42]] },
        a: {
            head: [52, 30, 7],
            segments: [[52, 37, 54, 74], [54, 74, 42, 74], [54, 74, 66, 74], [52, 42, 56, 40], [52, 44, 58, 42]],
        },
        b: {
            head: [42, 48, 7],
            segments: [[46, 54, 54, 74], [54, 74, 42, 74], [54, 74, 66, 74], [46, 54, 50, 44], [48, 54, 52, 46]],
        },
    },
};

function Figure({ pose }: { pose: Pose }) {
    return (
        <g fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx={pose.head[0]} cy={pose.head[1]} r={pose.head[2]} />
            {pose.segments.map((s, i) => (
                <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />
            ))}
        </g>
    );
}

function Panel({
    x,
    label,
    pose,
    equip,
}: {
    x: number;
    label: string;
    pose: Pose;
    equip?: Drawing["equip"];
}) {
    return (
        <g transform={`translate(${x},0)`}>
            {equip ? (
                <g
                    stroke="currentColor"
                    strokeWidth={1.6}
                    strokeLinecap="round"
                    opacity={0.5}
                    strokeDasharray={equip.dashed ? "3 3" : undefined}
                >
                    {equip.segments.map((s, i) => (
                        <line key={i} x1={s[0]} y1={s[1]} x2={s[2]} y2={s[3]} />
                    ))}
                </g>
            ) : null}
            <Figure pose={pose} />
            <text x={58} y={118} textAnchor="middle" fontSize={10} fill="currentColor" opacity={0.6}>
                {label}
            </text>
        </g>
    );
}

export function hasExerciseSvg(lexiconKey: string): boolean {
    return lexiconKey in DRAWINGS;
}

export function ExerciseSvg({ lexiconKey }: { lexiconKey: string }) {
    const drawing = DRAWINGS[lexiconKey];
    if (!drawing) return null;
    return (
        <svg viewBox="0 0 240 124" className="text-foreground w-full" role="img" aria-label="Illustration de l'exercice">
            <line x1={120} y1={12} x2={120} y2={104} stroke="currentColor" strokeWidth={0.5} opacity={0.2} />
            <Panel x={0} label="Départ" pose={drawing.a} equip={drawing.equip} />
            <Panel x={122} label="Arrivée" pose={drawing.b} equip={drawing.equip} />
        </svg>
    );
}
