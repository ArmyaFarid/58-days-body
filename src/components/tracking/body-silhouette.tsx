import type { MeasurementKey } from "@/lib/program";

export const MEASUREMENT_LABELS: Record<MeasurementKey, string> = {
    hips: "Hanches",
    shoulders: "Épaules",
    chest: "Poitrine",
    arm: "Bras fléchi",
    waist: "Taille",
    thigh: "Cuisse",
};

/** Position de la bande de mesure sur la silhouette (repère 200 × 400). */
export const ZONES: Record<MeasurementKey, { cx: number; cy: number; rx: number }> = {
    shoulders: { cx: 100, cy: 78, rx: 54 },
    chest: { cx: 100, cy: 106, rx: 44 },
    arm: { cx: 160, cy: 132, rx: 16 },
    waist: { cx: 100, cy: 180, rx: 40 },
    hips: { cx: 100, cy: 232, rx: 50 },
    thigh: { cx: 78, cy: 282, rx: 26 },
};

interface BodySilhouetteProps {
    zone: MeasurementKey;
    className?: string;
}

/** Silhouette de face, avec la zone à mesurer entourée. */
export function BodySilhouette({ zone, className }: BodySilhouetteProps) {
    const z = ZONES[zone];
    return (
        <svg viewBox="0 0 200 400" className={className} aria-hidden>
            <g className="fill-muted stroke-border" strokeWidth={2}>
                <circle cx="100" cy="34" r="22" />
                <rect x="91" y="52" width="18" height="16" rx="6" />
                <path d="M64 70 Q100 62 136 70 L150 82 Q146 120 138 150 Q132 178 134 196 Q146 222 146 246 L54 246 Q54 222 66 196 Q68 178 62 150 Q54 120 50 82 Z" />
                <path d="M50 82 Q36 90 34 120 L30 200 Q30 214 40 214 Q48 214 48 200 L56 128 Z" />
                <path d="M150 82 Q164 90 166 120 L170 200 Q170 214 160 214 Q152 214 152 200 L144 128 Z" />
                <path d="M54 246 L98 246 L94 300 L90 384 Q90 394 80 394 L70 394 Q62 394 62 384 L56 300 Z" />
                <path d="M146 246 L102 246 L106 300 L110 384 Q110 394 120 394 L130 394 Q138 394 138 384 L144 300 Z" />
            </g>
            <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={8} fill="none" className="stroke-brand" strokeWidth={5} />
        </svg>
    );
}
