import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Card } from "./card";

export type EmptyStateProps = {
  /** Diz o que falta, como gente: "Nenhum cliente ainda". */
  title: string;
  /** O que fazer a seguir. */
  description?: string;
  icon?: ReactNode;
  /** Normalmente o botão que resolve ("Cadastrar cliente"). */
  action?: ReactNode;
  className?: string;
};

/** Lista vazia: cartão sálvia com recuo de 48px, centralizado. */
export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <Card variant="sage" flush className={cn("flex flex-col items-center gap-4 px-6 py-12 text-center md:p-12", className)}>
      {icon && <span className="grid size-14 place-items-center rounded-pill bg-canvas text-ink">{icon}</span>}
      <div className="flex max-w-sm flex-col gap-2">
        <h2 className="text-display-xs">{title}</h2>
        {description && <p className="text-body-md text-body">{description}</p>}
      </div>
      {action}
    </Card>
  );
}
