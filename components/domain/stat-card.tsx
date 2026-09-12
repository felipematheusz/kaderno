import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { cn } from "@/lib/cn";

type StatTone =
  /** Branco. O padrão. */
  | "default"
  /** Branco com o valor em vermelho. Atraso. */
  | "negative";

export type StatCardProps = {
  /** O que o número é: "Emprestado", "A receber". */
  rotulo: string;
  valor: number;
  /** Linha abaixo do número: "1 parcela", "Tudo em dia". */
  detalhe?: string;
  icon?: ReactNode;
  tone?: StatTone;
  className?: string;
};

const toneClass: Record<StatTone, { rotulo: string; valor: string; detalhe: string }> = {
  default: { rotulo: "text-body", valor: "", detalhe: "text-mute" },
  negative: { rotulo: "text-body", valor: "text-negative-darkest", detalhe: "text-negative-darkest" },
};

/** Número em destaque num cartão: rótulo, valor e um detalhe curto. Use em linha, no topo da tela. */
export function StatCard({ rotulo, valor, detalhe, icon, tone = "default", className }: StatCardProps) {
  const s = toneClass[tone];

  return (
    <Card className={cn("flex flex-col gap-2 max-sm:p-4 sm:gap-2.5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn("text-body-sm", s.rotulo)}>{rotulo}</span>
        {icon && (
          <span aria-hidden className={cn("shrink-0", s.rotulo)}>
            {icon}
          </span>
        )}
      </div>
      <Money valor={valor} size="card" className={s.valor} />
      {detalhe && <span className={cn("text-caption", s.detalhe)}>{detalhe}</span>}
    </Card>
  );
}
