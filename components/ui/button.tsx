import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

type ButtonVariant =
  /** Verde Wise. Uma por tela: a ação principal. */
  | "primary"
  /** Sálvia, sem borda. Ações de apoio (Cobrar, Renegociar). */
  | "secondary"
  /** Branco com contorno tinta. Alternativa neutra à principal. */
  | "tertiary"
  /** Contorno claro, para usar dentro de cartão invertido. */
  | "inverse"
  /** Destrutiva (Excluir). Sempre com confirmação. */
  | "danger"
  /** Sem fundo. Ícone de fechar, limpar busca: ação sem peso visual. */
  | "ghost";

type ButtonSize = "md" | "sm" | "icon" | "icon-sm";

export type ButtonProps = ComponentPropsWithRef<"button"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-primary text-ink hover:bg-primary-active",
  secondary: "bg-canvas-soft text-ink hover:bg-primary-pale",
  tertiary: "bg-canvas text-ink border border-ink hover:bg-canvas-soft",
  inverse: "bg-transparent text-canvas border border-canvas-soft hover:bg-primary/15",
  danger: "bg-canvas text-negative-darkest border border-negative hover:bg-negative-bg hover:text-canvas",
  ghost: "bg-transparent text-ink hover:bg-canvas-soft",
};

const sizeClass: Record<ButtonSize, string> = {
  md: "h-12 px-6 text-button",
  sm: "h-10 px-4 text-body-sm font-semibold",
  icon: "size-12",
  "icon-sm": "size-10",
};

/** Classes do botão, para aplicar o mesmo visual em `<Link>` (ex.: "Ver planos"). */
export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: { variant?: ButtonVariant; size?: ButtonSize; className?: string } = {}): string {
  return cn(
    "inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-semibold whitespace-nowrap transition-colors",
    "disabled:pointer-events-none disabled:opacity-40",
    variantClass[variant],
    sizeClass[size],
    className,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonProps) {
  return <button type={type} className={buttonClass({ variant, size, className })} {...props} />;
}
