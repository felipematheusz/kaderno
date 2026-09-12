import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type PageHeaderProps = {
  title: string;
  /** Linha acima do título: a data ("Sexta, 11 de setembro de 2026") ou um contexto. */
  eyebrow?: ReactNode;
  /** Linha abaixo do título, como está o dia: "2 parcelas vencem hoje". */
  description?: ReactNode;
  /** Ações da tela. No máximo um botão verde. */
  actions?: ReactNode;
  className?: string;
};

/** Cabeçalho de tela: linha pequena + título em 900 + ações à direita (embaixo no celular). */
export function PageHeader({ title, eyebrow, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}>
      <div className="flex min-w-0 flex-col gap-2.5">
        {eyebrow && <p className="text-body-sm text-body">{eyebrow}</p>}
        <h1 className="text-display-md md:text-display-lg">{title}</h1>
        {description && <p className="text-body-lg text-body">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </header>
  );
}
