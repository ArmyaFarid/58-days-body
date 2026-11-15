interface DayRingProps {
    value: number;
    total: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function DayRing({ value, total }: DayRingProps) {
    const ratio = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
    return (
        <svg viewBox="0 0 120 120" className="size-[7.25rem] shrink-0" role="img" aria-label={`Jour ${value} sur ${total}`}>
            <circle cx="60" cy="60" r={RADIUS} fill="none" className="stroke-border" strokeWidth="12" />
            <circle
                cx="60"
                cy="60"
                r={RADIUS}
                fill="none"
                className="stroke-brand transition-[stroke-dasharray] duration-700 ease-out"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={`${ratio * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                transform="rotate(-90 60 60)"
            />
            <text x="60" y="58" textAnchor="middle" className="fill-foreground font-heading text-[34px] font-bold">
                {value}
            </text>
            <text x="60" y="80" textAnchor="middle" className="fill-muted-foreground text-[13px]">
                sur {total}
            </text>
        </svg>
    );
}
