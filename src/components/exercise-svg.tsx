// Pictogrammes minimalistes (stick figures) pour les 8 exercices clés.
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
