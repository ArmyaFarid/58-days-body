interface DumbbellIconProps {
    className?: string;
    strokeWidth?: number;
}

/** Haltère horizontale (celle des maquettes ; celle de lucide est en diagonale). */
export function DumbbellIcon({ className, strokeWidth = 2 }: DumbbellIconProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={className}
        >
            <path d="M6.5 6.5v11M17.5 6.5v11M3 9.5v5M21 9.5v5M6.5 12h11" />
        </svg>
    );
}
