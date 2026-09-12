import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type BadgeTone =
  /** Em dia, pago. Verde-pálido com texto verde-profundo — nunca verde Wise. */
  | "positive"
  /** Vence hoje. */
  | "warning"
  /** Atrasado. Vinho com texto branco, não vermelho claro. */
  | "negative"
  /** A vencer, sem destaque. */
  | "neutral"
  /** Quitado, encerrado. */
  | "ink"
  /** Verde-floresta com texto verde claro. Contador na barra lateral. */
  | "deep"
  /** Renegociada, seleção suave. */
  | "soft";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: "md" | "sm";
};

const toneClass: Record<BadgeTone, string> = {
  positive: "bg-primary-pale text-positive-deep",
  warning: "bg-warning text-warning-content",
  negative: "bg-negative-bg text-canvas",
  neutral: "bg-canvas-soft text-ink",
  ink: "bg-ink text-canvas",
  deep: "bg-ink-deep text-primary",
  soft: "bg-primary-neutral text-ink",
};

export function Badge({ tone = "neutral", size = "md", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill font-semibold whitespace-nowrap",
        size === "md" ? "h-7 px-3 text-body-sm" : "h-6 px-2.5 text-caption",
        toneClass[tone],
        className,
      )}
      {...props}
    />
  );
}
