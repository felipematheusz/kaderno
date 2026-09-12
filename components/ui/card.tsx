import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type CardVariant =
  /** Branco sobre sálvia. O padrão. */
  | "default"
  /** Sálvia, para cartão dentro de área branca. */
  | "sage"
  /** Verde-pálido, momento positivo (recebido no mês). */
  | "pale"
  /** Verde-floresta com texto verde Wise. Um destaque por tela (A receber, próximo vencimento). */
  | "inverse"
  /** Branco com contorno tinta. Onde se digita (simulador, formulário principal). */
  | "outlined";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: CardVariant;
  /** Sem recuo interno, para listas e tabelas que encostam na borda. */
  flush?: boolean;
};

const variantClass: Record<CardVariant, string> = {
  default: "bg-canvas text-ink",
  sage: "bg-canvas-soft text-ink",
  pale: "bg-primary-pale text-ink",
  inverse: "bg-ink-deep text-primary",
  outlined: "bg-canvas text-ink border border-ink",
};

export function Card({ variant = "default", flush = false, className, ...props }: CardProps) {
  return (
    <div
      className={cn("rounded-xl", !flush && "p-6", flush && "overflow-hidden", variantClass[variant], className)}
      {...props}
    />
  );
}
