// Illustrations au trait du programme plancher pelvien (charte : trait
// constant, une seule couleur d'accent pour la zone active et le mouvement,
// aucun texte). Remplaçables : une variante = un dessin.

export type PelvicFigureVariant = "allonge" | "assis" | "debout" | "marche";

interface PelvicFigureProps {
  variant: PelvicFigureVariant;
  /** Zone et flèche en couleur d'accent (contraction) ; sinon en gris (relâche). */
  active?: boolean;
  className?: string;
}

const LABELS: Record<PelvicFigureVariant, string> = {
  allonge: "Allongé sur le dos, genoux pliés, plancher pelvien qui remonte",
  assis: "Assis au bord d'une chaise, plancher pelvien qui remonte",
  debout: "Debout, genoux déverrouillés, plancher pelvien qui remonte",
  marche: "En marchant, plancher pelvien contracté pendant quelques pas",
};

function Arrow({ x, y }: { x: number; y: number }) {
  return (
    <path
      d={`M${x} ${y} V${y - 16} M${x - 6} ${y - 10} L${x} ${y - 16} L${x + 6} ${y - 10}`}
    />
  );
}

export function PelvicFigure({
  variant,
  active = true,
  className,
}: PelvicFigureProps) {
  const accent = active ? "text-brand" : "text-muted-foreground";
  return (
    <svg
      viewBox="0 0 230 110"
      role="img"
      aria-label={LABELS[variant]}
      className={className}
    >
      <line
        x1="10"
        y1={variant === "allonge" ? 92 : 102}
        x2="220"
        y2={variant === "allonge" ? 92 : 102}
        className="stroke-border"
        strokeWidth="2"
      />
      <g
        className="text-foreground"
        fill="none"
        stroke="currentColor"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {variant === "allonge" ? (
          <>
            <circle cx="30" cy="78" r="11" fill="currentColor" stroke="none" />
            <path d="M42 84 L112 84" />
            <path d="M112 84 L148 46 L176 90" />
            <path d="M60 86 L100 88" />
          </>
        ) : variant === "assis" ? (
          <>
            <g className="text-muted-foreground" strokeWidth="3">
              <path d="M100 70 H146 M146 70 V24 M104 70 V102 M142 70 V102" />
            </g>
            <circle cx="120" cy="16" r="9" fill="currentColor" stroke="none" />
            <path d="M120 27 L122 64" />
            <path d="M122 64 L88 66 L88 98 L76 98" />
            <path d="M120 34 L108 56" />
          </>
        ) : variant === "debout" ? (
          <>
            <circle cx="115" cy="12" r="9" fill="currentColor" stroke="none" />
            <path d="M115 23 L115 60" />
            <path d="M115 60 L109 80 L111 100 M115 60 L121 80 L119 100" />
            <path d="M115 30 L109 56" />
          </>
        ) : (
          <>
            <circle cx="113" cy="12" r="9" fill="currentColor" stroke="none" />
            <path d="M113 23 L111 60" />
            <path d="M111 60 L126 80 L133 100 M111 60 L101 80 L89 98" />
            <path d="M113 30 L123 50 M113 30 L102 50" />
          </>
        )}
      </g>
      <g
        className={accent}
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {variant === "allonge" ? (
          <>
            <ellipse cx="112" cy="84" rx="10" ry="6" />
            <Arrow x={112} y={72} />
          </>
        ) : variant === "assis" ? (
          <>
            <ellipse cx="121" cy="66" rx="9" ry="5" />
            <Arrow x={104} y={60} />
          </>
        ) : variant === "debout" ? (
          <>
            <ellipse cx="115" cy="62" rx="9" ry="5" />
            <Arrow x={132} y={66} />
          </>
        ) : (
          <>
            <ellipse cx="111" cy="62" rx="9" ry="5" />
            <g fill="currentColor" stroke="none">
              <ellipse cx="66" cy="104" rx="5" ry="2.5" />
              <ellipse cx="48" cy="100" rx="5" ry="2.5" />
              <ellipse cx="30" cy="104" rx="5" ry="2.5" />
            </g>
          </>
        )}
      </g>
    </svg>
  );
}
