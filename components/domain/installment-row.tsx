import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";

export type InstallmentRowStatus = "atrasada" | "hoje" | "paga" | "futura";

export type InstallmentRowProps = {
  status: InstallmentRowStatus;
  /** Coluna da esquerda: "07/09", "hoje", "amanhã". Fora quando a tela já diz o dia. */
  prazo?: string;
  cliente: string;
  /** Número do contrato: "#0039". */
  contrato: string;
  parcela: { numero: number; total: number };
  tipo?: "emprestimo" | "venda";
  /** Complemento no fim da linha: "4 dias atrasada", "recebida via Pix". */
  detalhe?: string;
  valor: number;
  /** Botões (Cobrar + Pagar, ou Lembrar). Na parcela paga, o selo Pago toma o lugar. */
  actions?: ReactNode;
  className?: string;
};

const estilo: Record<InstallmentRowStatus, { prazo: string; nome: string; meta: string; valor: string }> = {
  atrasada: { prazo: "font-semibold text-negative-darkest", nome: "", meta: "text-body", valor: "" },
  hoje: { prazo: "font-semibold text-warning-content", nome: "", meta: "text-body", valor: "" },
  paga: { prazo: "text-mute", nome: "text-body", meta: "text-mute", valor: "text-mute line-through" },
  futura: { prazo: "text-mute", nome: "text-body", meta: "text-mute", valor: "text-body" },
};

/** Linha de parcela: prazo, nome e contrato, valor e ações. Use dentro de `<ul>` em `<Card flush>`. */
export function InstallmentRow({
  status,
  prazo,
  cliente,
  contrato,
  parcela,
  tipo = "emprestimo",
  detalhe,
  valor,
  actions,
  className,
}: InstallmentRowProps) {
  const s = estilo[status];
  const meta = [contrato, tipo === "venda" ? "venda" : null, `parcela ${parcela.numero} de ${parcela.total}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3.5 gap-y-3 border-t border-canvas-soft px-5 py-3 md:px-6",
        className,
      )}
    >
      {prazo && <span className={cn("w-16 shrink-0 text-body-sm", s.prazo)}>{prazo}</span>}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn("truncate text-body-md font-semibold", s.nome)}>{cliente}</span>
        <span className={cn("text-body-sm", s.meta)}>
          {meta}
          {detalhe && (
            <>
              {" · "}
              <span className={status === "atrasada" ? "text-negative-darkest" : undefined}>{detalhe}</span>
            </>
          )}
        </span>
      </div>
      <span className={cn("text-body-md font-semibold whitespace-nowrap", s.valor)}>{formatBRL(valor)}</span>
      {/* Largura mínima fixa no desktop: mantém os valores alinhados em coluna entre as linhas. */}
      <div className="flex basis-full justify-end gap-1.5 sm:min-w-37.5 sm:basis-auto">
        {status === "paga" ? (
          <Badge tone="positive">
            <CheckIcon size={14} />
            Pago
          </Badge>
        ) : (
          actions
        )}
      </div>
    </li>
  );
}
