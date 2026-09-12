import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

type AvatarSize = "sm" | "md" | "lg";

export type ClientAvatarProps = {
  nome: string;
  /** Score de crédito. Sem score, sem anel. */
  score?: number;
  /** Teto da escala do score. */
  max?: number;
  size?: AvatarSize;
  className?: string;
};

const sizeClass: Record<AvatarSize, { caixa: string; texto: string }> = {
  sm: { caixa: "size-10", texto: "text-caption" },
  md: { caixa: "size-12", texto: "text-body-sm" },
  lg: { caixa: "size-18", texto: "text-body-lg" },
};

/** Iniciais do cliente com anel verde que enche conforme o score. */
export function ClientAvatar({ nome, score, max = 100, size = "md", className }: ClientAvatarProps) {
  const s = sizeClass[size];
  const temScore = score !== undefined;
  const pct = temScore ? Math.min(Math.max(score / max, 0), 1) * 100 : 0;

  return (
    <span
      role="img"
      aria-label={temScore ? `${nome}, score ${score} de ${max}` : nome}
      className={cn("relative inline-grid shrink-0 place-items-center rounded-pill", s.caixa, temScore && "p-1", className)}
    >
      {temScore && (
        <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden focusable={false}>
          <circle cx="50" cy="50" r="46" fill="none" strokeWidth="8" className="stroke-canvas-soft" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray={`${pct} 100`}
            className="stroke-positive"
          />
        </svg>
      )}
      <span
        aria-hidden
        className={cn("grid size-full place-items-center rounded-pill bg-canvas-soft font-semibold text-ink", s.texto)}
      >
        {initials(nome)}
      </span>
    </span>
  );
}
