import type { Metadata } from "next";
import Link from "next/link";
import { ContractListHeader, ContractRow } from "@/components/domain/contract-row";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { ContractIcon, PlusIcon } from "@/components/ui/icons";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Pagination } from "@/components/ui/pagination";
import { getContratos, type Contrato } from "@/lib/dados";
import { situacaoContrato, type SituacaoContrato } from "@/lib/emprestimos";
import { formatBRL } from "@/lib/format";
import { lerPagina, paginar } from "@/lib/paginacao";

type Filtro = SituacaoContrato | "todos";

const FILTROS: readonly { valor: Filtro; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos" },
  { valor: "em-dia", rotulo: "Em dia" },
  { valor: "atrasado", rotulo: "Atrasados" },
  { valor: "quitado", rotulo: "Quitados" },
];

function parseFiltro(valor: string | string[] | undefined): Filtro {
  return FILTROS.some((f) => f.valor === valor) ? (valor as Filtro) : "todos";
}

/** Mantém a aba escolhida ao trocar de filtro (e o filtro ao trocar de página). */
function link(vendas: boolean, filtro: Filtro, pagina = 1): string {
  const params = new URLSearchParams();
  if (vendas) params.set("modo", "venda");
  if (filtro !== "todos") params.set("situacao", filtro);
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query === "" ? "/contratos" : `/contratos?${query}`;
}

export async function generateMetadata({ searchParams }: PageProps<"/contratos">): Promise<Metadata> {
  const { modo } = await searchParams;
  return { title: modo === "venda" ? "Vendas · Caderno" : "Contratos · Caderno" };
}

export default async function ContratosPage({ searchParams }: PageProps<"/contratos">) {
  const { modo, situacao, pagina } = await searchParams;
  const vendas = modo === "venda";
  const filtro = parseFiltro(situacao);

  const contratos = await getContratos();
  const daAba = contratos.filter((c) => (c.tipo === "venda") === vendas);
  const lista = filtro === "todos" ? daAba : daAba.filter((c) => situacaoContrato(c.parcelas) === filtro);
  const { itens, paginacao } = paginar(lista, lerPagina(pagina));

  const aReceber = daAba.reduce((soma, c) => soma + c.aReceber, 0);
  const quantos = (f: Filtro): number =>
    f === "todos" ? daAba.length : daAba.filter((c) => situacaoContrato(c.parcelas) === f).length;

  const titulo = vendas ? "Vendas" : "Contratos";
  const vazio = filtro === "todos";

  return (
    <>
      <PageHeader
        title={titulo}
        description={`${daAba.length} no total · ${formatBRL(aReceber)} a receber`}
        actions={
          <Link href={vendas ? "/contratos/novo?tipo=venda" : "/contratos/novo"} className={buttonClass()}>
            <PlusIcon size={18} />
            {vendas ? "Nova venda" : "Novo contrato"}
          </Link>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <NavTabs
          aria-label="Tipo de contrato"
          items={[
            { href: link(false, filtro), label: "Contratos", active: !vendas },
            { href: link(true, filtro), label: "Vendas", active: vendas },
          ]}
        />
        <FilterChips aria-label="Situação">
          {FILTROS.map((f) => (
            <FilterChip key={f.valor} href={link(vendas, f.valor)} selected={filtro === f.valor} count={quantos(f.valor)}>
              {f.rotulo}
            </FilterChip>
          ))}
        </FilterChips>
      </div>

      {lista.length === 0 ? (
        <EmptyState
          icon={<ContractIcon size={24} />}
          title={vazio ? (vendas ? "Nenhuma venda ainda" : "Nenhum contrato ainda") : "Nada com essa situação"}
          description={
            vazio
              ? `Crie ${vendas ? "a primeira venda parcelada" : "o primeiro contrato"} para acompanhar as parcelas por aqui.`
              : "Troque o filtro para ver os outros."
          }
          action={
            vazio ? (
              <Link
                href={vendas ? "/contratos/novo?tipo=venda" : "/contratos/novo"}
                className={buttonClass({ variant: "tertiary" })}
              >
                {vendas ? "Nova venda" : "Novo contrato"}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          <Card flush>
            <ContractListHeader />
            <ul>
              {itens.map((c: Contrato) => (
                <ContractRow
                  key={c.id}
                  cliente={c.cliente}
                  produto={c.produto}
                  numero={c.numero}
                  tipo={c.tipo}
                  valor={c.valor}
                  parcelas={c.parcelas}
                  alerta={c.alerta}
                  href={`/contratos/${c.id}`}
                />
              ))}
            </ul>
          </Card>
          <Pagination
            {...paginacao}
            href={(p) => link(vendas, filtro, p)}
            rotulo={vendas ? "vendas" : "contratos"}
          />
        </>
      )}
    </>
  );
}
