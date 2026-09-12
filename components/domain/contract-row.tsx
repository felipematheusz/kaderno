import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import type { InstallmentStatus } from "@/components/ui/installment-bar";
import { cn } from "@/lib/cn";
import { situacaoContrato } from "@/lib/emprestimos";
import { formatBRL } from "@/lib/format";

const grade =
  "grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,0.45fr)_minmax(0,1fr)_minmax(0,0.85fr)] md:px-6";

export type ContractRowProps = {
  cliente: string;
  /** Na venda: "Notebook Dell". */
  produto?: string;
  /** "#0042". */
  numero: string;
  tipo?: "emprestimo" | "venda";
  valor: number;
  parcelas: readonly InstallmentStatus[];
  /** Texto do selo quando há atraso: "4 dias atrasada". Sem isso sai "Em dia" ou "Quitado". */
  alerta?: string;
  href?: string;
  className?: string;
};

/** Cabeçalho sálvia das colunas (some no celular). Use antes das ContractRows. */
export function ContractListHeader() {
  return (
    <div aria-hidden className={cn(grade, "hidden bg-canvas-soft py-2.5 text-caption text-body md:grid")}>
      <span>Cliente</span>
      <span>Parcelas</span>
      <span>Situação</span>
      <span className="text-right">Valor</span>
    </div>
  );
}

/** Contrato em lista: nome, metadados, andamento das parcelas e valor. Use dentro de `<ul>`. */
export function ContractRow({
  cliente,
  produto,
  numero,
  tipo = "emprestimo",
  valor,
  parcelas,
  alerta,
  href,
  className,
}: ContractRowProps) {
  const pagas = parcelas.filter((p) => p === "paga").length;
  // A fração já diz quantas foram pagas; a linha de baixo fica só com o número do contrato.
  const meta = [numero, tipo === "venda" ? "venda" : null].filter(Boolean).join(" · ");
  const situacao = situacaoContrato(parcelas);

  const conteudo = (
    <>
      <span className="flex min-w-0 flex-col gap-0.5">
        <span className="truncate text-body-sm font-semibold">
          {cliente}
          {produto && <span className="font-normal text-mute"> · {produto}</span>}
        </span>
        <span className="text-caption text-mute">{meta}</span>
      </span>
      {/* No celular as duas colunas do meio descem para uma linha só, embaixo do nome. */}
      <span className="order-last text-display-xs md:order-none">
        {pagas}
        <span className="text-body-sm font-semibold text-mute">/{parcelas.length}</span>
      </span>
      <span className="order-last flex justify-end md:order-none md:justify-start">
        {situacao === "atrasado" ? (
          <Badge tone="negative" size="sm">
            {alerta ?? "Atrasado"}
          </Badge>
        ) : situacao === "quitado" ? (
          <Badge tone="ink" size="sm">
            Quitado
          </Badge>
        ) : (
          <Badge tone="positive" size="sm">
            Em dia
          </Badge>
        )}
      </span>
      <span className="text-right text-body-sm font-semibold whitespace-nowrap">{formatBRL(valor)}</span>
    </>
  );

  const classe = cn(grade, "items-center border-b border-canvas-soft py-3", className);

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
