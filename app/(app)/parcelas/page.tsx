import type { Metadata } from "next";
import { connection } from "next/server";
import { InstallmentActions } from "@/components/domain/installment-actions";
import { InstallmentRow } from "@/components/domain/installment-row";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { ReceiptIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { getParcelas, type Parcela } from "@/lib/dados";
import { verParcela } from "@/lib/emprestimos";
import { cobrancaDaParcela } from "@/lib/mensagens";
import { formatBRL } from "@/lib/format";
import { lerPagina, paginar } from "@/lib/paginacao";

export const metadata: Metadata = {
  title: "Parcelas · Caderno",
};

type Filtro = "a-receber" | "atrasadas" | "hoje" | "pagas" | "todas";

const FILTROS: readonly { valor: Filtro; rotulo: string }[] = [
  { valor: "a-receber", rotulo: "A receber" },
  { valor: "atrasadas", rotulo: "Atrasadas" },
  { valor: "hoje", rotulo: "Hoje" },
  { valor: "pagas", rotulo: "Pagas" },
  { valor: "todas", rotulo: "Todas" },
];

function parseFiltro(valor: string | string[] | undefined): Filtro {
  return FILTROS.some((f) => f.valor === valor) ? (valor as Filtro) : "a-receber";
}

function cabe(parcela: Parcela, filtro: Filtro, agora: Date): boolean {
  if (filtro === "todas") return true;
  const { status } = verParcela(parcela, agora);
  if (filtro === "pagas") return status === "paga";
  if (filtro === "atrasadas") return status === "atrasada";
  if (filtro === "hoje") return status === "hoje";
  return status !== "paga";
}

/** Mantém o filtro ao trocar de página. */
function link(filtro: Filtro, pagina = 1): string {
  const params = new URLSearchParams();
  if (filtro !== "a-receber") params.set("filtro", filtro);
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query === "" ? "/parcelas" : `/parcelas?${query}`;
}

export default async function ParcelasPage({ searchParams }: PageProps<"/parcelas">) {
  await connection(); // o que está atrasado, vencendo hoje ou a vencer muda a cada acesso
  const agora = new Date();
  const { filtro: bruto, pagina } = await searchParams;
  const filtro = parseFiltro(bruto);

  const parcelas = await getParcelas();
  const lista = parcelas.filter((p) => cabe(p, filtro, agora));
  // Agenda vai do mais próximo ao mais distante; no que já foi pago, o mais recente primeiro.
  const ordenada = filtro === "pagas" ? [...lista].reverse() : lista;
  const { itens, paginacao } = paginar(ordenada, lerPagina(pagina));

  const aReceber = parcelas.filter((p) => !p.pago);
  const total = aReceber.reduce((soma, p) => soma + p.valor, 0);

  return (
    <>
      <PageHeader
        title="Parcelas"
        description={`${aReceber.length} a receber · ${formatBRL(total)}`}
      />

      <FilterChips aria-label="Prazo e situação">
        {FILTROS.map((f) => (
          <FilterChip
            key={f.valor}
            href={link(f.valor)}
            selected={filtro === f.valor}
            count={parcelas.filter((p) => cabe(p, f.valor, agora)).length}
          >
            {f.rotulo}
          </FilterChip>
        ))}
      </FilterChips>

      {ordenada.length === 0 ? (
        <EmptyState
          icon={<ReceiptIcon size={24} />}
          title="Nenhuma parcela por aqui"
          description="Troque o filtro ou crie um contrato para a agenda começar a encher."
        />
      ) : (
        <>
          <Card flush>
            <ul>
              {itens.map((p) => {
                const { status, prazo, detalhe } = verParcela(p, agora);
                return (
                  <InstallmentRow
                    key={p.id}
                    className="first:border-t-0"
                    status={status}
                    prazo={prazo}
                    cliente={p.cliente}
                    contrato={p.contrato}
                    parcela={p.parcela}
                    tipo={p.tipo}
                    detalhe={detalhe}
                    valor={p.valor}
                    actions={
                      <InstallmentActions
                        status={status}
                        parcelaId={p.id}
                        cliente={p.cliente}
                        mensagem={cobrancaDaParcela(p, agora)}
                      />
                    }
                  />
                );
              })}
            </ul>
          </Card>
          <Pagination {...paginacao} href={(p) => link(filtro, p)} rotulo="parcelas" />
        </>
      )}
    </>
  );
}
