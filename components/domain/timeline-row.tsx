import Link from "next/link";
import type { ReactNode } from "react";
import { CheckIcon, ContractIcon, UsersIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { formatBRL, formatShortDate } from "@/lib/format";

export type TipoEvento =
  /** Dinheiro que entrou. */
  | "pagamento"
  /** Contrato aberto: dinheiro que saiu. */
  | "contrato"
  /** Cliente cadastrado. */
  | "cliente";

export type TimelineRowProps = {
  tipo: TipoEvento;
  /** Dia do evento em ISO: "2026-09-07". */
  data: string;
  /** Nome de quem está no evento. */
  titulo: string;
  /** A linha de baixo: "#0042 · parcela 2 de 3 · Pix". */
  detalhe: string;
  /** Sem valor no cadastro de cliente. */
  valor?: number;
  href?: string;
  className?: string;
};

const estilo: Record<TipoEvento, { icone: ReactNode; marca: string; sinal: string; leitura: string; valor: string }> = {
  pagamento: {
    icone: <CheckIcon size={16} />,
    marca: "bg-primary-pale text-positive-deep",
    sinal: "+",
    leitura: "entrou",
    valor: "font-semibold text-ink",
  },
  contrato: {
    icone: <ContractIcon size={16} />,
    marca: "bg-canvas-soft text-ink",
    sinal: "−",
    leitura: "saiu",
    valor: "text-body",
  },
  cliente: {
    icone: <UsersIcon size={16} />,
    marca: "bg-canvas-soft text-ink",
    sinal: "",
    leitura: "",
    valor: "text-body",
  },
};

/** Linha do histórico: dia, o que aconteceu e o valor. Use dentro de `<ul>` em `<Card flush>`. */
export function TimelineRow({ tipo, data, titulo, detalhe, valor, href, className }: TimelineRowProps) {
  const s = estilo[tipo];

  const conteudo = (
    <>
      <span className="w-11 shrink-0 text-body-sm text-mute">{formatShortDate(data)}</span>
      <span aria-hidden className={cn("grid size-9 shrink-0 place-items-center rounded-pill", s.marca)}>
        {s.icone}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-body-md font-semibold">{titulo}</span>
        <span className="truncate text-body-sm text-body">{detalhe}</span>
      </span>
      {valor !== undefined && (
        <span className={cn("text-body-md whitespace-nowrap", s.valor)}>
          <span aria-hidden>{s.sinal} </span>
          <span className="sr-only">{s.leitura} </span>
          {formatBRL(valor)}
        </span>
      )}
    </>
  );

  const classe = cn(
    "flex items-center gap-3 border-b border-canvas-soft px-5 py-3 md:gap-3.5 md:px-6",
    className,
  );

  return (
    <li className="last:[&>*]:border-b-0">
      {href ? (
        <Link href={href} className={cn(classe, "transition-colors hover:bg-canvas-soft")}>
          {conteudo}
        </Link>
      ) : (
        <div className={classe}>{conteudo}</div>
      )}
    </li>
  );
}
