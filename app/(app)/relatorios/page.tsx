import type { Metadata } from "next";
import { connection } from "next/server";
import { MonthlyFlow } from "@/components/domain/monthly-flow";
import { StatCard } from "@/components/domain/stat-card";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { ChartIcon, CheckIcon, ClockIcon, ContractIcon } from "@/components/ui/icons";
import { getRelatorio, type LinhaProjecao, type PeriodoProjecao, type RecorteRelatorio } from "@/lib/dados";
import { formatBRL } from "@/lib/format";

export const metadata: Metadata = {
  title: "Relatórios · Caderno",
};

const RECORTES: readonly { valor: RecorteRelatorio; rotulo: string }[] = [
  { valor: "todos", rotulo: "Todos os contratos" },
  { valor: "abertos", rotulo: "Só os em aberto" },
];

const PERIODOS: readonly { valor: PeriodoProjecao; rotulo: string }[] = [
  { valor: "mes", rotulo: "Este mês" },
  { valor: "30", rotulo: "30 dias" },
  { valor: "90", rotulo: "90 dias" },
];

/** Uma linha da tabela de projeção — as duas do produto mais o total. */
type LinhaTabela = {
  chave: string;
  rotulo: string;
  parcelas: number;
  vencido: number;
  juros: number;
  aReceber: number;
  total?: boolean;
};

const COLUNAS: readonly DataTableColumn<LinhaTabela>[] = [
  {
    key: "tipo",
    header: "Produto",
    cell: (l) => <span className={l.total ? "font-semibold" : undefined}>{l.rotulo}</span>,
  },
  { key: "parcelas", header: "Parcelas", cell: (l) => l.parcelas },
  {
    key: "vencido",
    header: "Vencido",
    align: "right",
    cell: (l) =>
      l.vencido === 0 ? (
        <span className="text-mute">—</span>
      ) : (
        <span className="font-semibold text-negative-darkest">{formatBRL(l.vencido)}</span>
      ),
  },
  { key: "juros", header: "Juros previstos", align: "right", cell: (l) => formatBRL(l.juros) },
  {
    key: "aReceber",
    header: "A receber",
    align: "right",
    cell: (l) => <span className="font-semibold">{formatBRL(l.aReceber)}</span>,
  },
];

const ROTULO: Record<LinhaProjecao["tipo"], string> = { emprestimo: "Empréstimos", venda: "Vendas" };

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

function parsePeriodo(valor: string | undefined): PeriodoProjecao {
  return valor === "30" || valor === "90" ? valor : "mes";
}

function link({ recorte, periodo }: { recorte: RecorteRelatorio; periodo: PeriodoProjecao }): string {
  const busca = new URLSearchParams();
  if (recorte !== "todos") busca.set("recorte", recorte);
  if (periodo !== "mes") busca.set("periodo", periodo);

  const texto = busca.toString();
  return texto === "" ? "/relatorios" : `/relatorios?${texto}`;
}

export default async function RelatoriosPage({ searchParams }: PageProps<"/relatorios">) {
  await connection(); // o que já venceu muda a cada acesso
  const params = await searchParams;
  const recorte: RecorteRelatorio = primeiro(params.recorte) === "abertos" ? "abertos" : "todos";
  const periodo = parsePeriodo(primeiro(params.periodo));

  const { totais, projecao, fluxo } = await getRelatorio(recorte, periodo);

  const soma = projecao.reduce(
    (total, l) => ({
      parcelas: total.parcelas + l.parcelas,
      vencido: total.vencido + l.vencido,
      juros: total.juros + l.juros,
      aReceber: total.aReceber + l.aReceber,
    }),
    { parcelas: 0, vencido: 0, juros: 0, aReceber: 0 },
  );

  const linhas: readonly LinhaTabela[] = [
    ...projecao.map<LinhaTabela>((l) => ({
      chave: l.tipo,
      rotulo: ROTULO[l.tipo],
      parcelas: l.parcelas,
      vencido: l.vencido,
      juros: l.juros,
      aReceber: l.aReceber,
    })),
    { chave: "total", rotulo: "Total", ...soma, total: true },
  ];

  return (
    <>
      <PageHeader
        title="Relatórios"
        description={`${totais.contratos} ${totais.contratos === 1 ? "contrato" : "contratos"} · ${formatBRL(totais.lucro)} de lucro previsto`}
      />

      <FilterChips aria-label="O que entra na conta">
        {RECORTES.map((r) => (
          <FilterChip key={r.valor} href={link({ recorte: r.valor, periodo })} selected={recorte === r.valor}>
            {r.rotulo}
          </FilterChip>
        ))}
      </FilterChips>

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard rotulo="Emprestado" valor={totais.emprestado} icon={<ContractIcon />} />
        <StatCard rotulo="Recebido" valor={totais.recebido} icon={<CheckIcon />} />
        <StatCard rotulo="A receber" valor={totais.aReceber} icon={<ClockIcon />} />
        <StatCard
          rotulo="Lucro previsto"
          valor={totais.lucro}
          detalhe={`${formatBRL(totais.lucroRealizado)} já no bolso`}
          icon={<ChartIcon />}
        />
      </div>

      <Card flush>
        <div className="flex flex-col gap-3 px-5 pt-5 pb-4 md:px-6">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h2 className="text-display-xs">O que ainda entra</h2>
            <span className="text-body-sm text-mute">parcelas em aberto no período</span>
          </div>
          <FilterChips aria-label="Período da projeção" className="gap-1.5">
            {PERIODOS.map((p) => (
              <FilterChip
                key={p.valor}
                href={link({ recorte, periodo: p.valor })}
                selected={periodo === p.valor}
                on="canvas"
              >
                {p.rotulo}
              </FilterChip>
            ))}
          </FilterChips>
        </div>

        {soma.parcelas === 0 ? (
          <p className="border-t border-canvas-soft px-5 py-6 text-body-md text-body md:px-6">
            Nenhuma parcela vence nesse período.
          </p>
        ) : (
          <DataTable
            columns={COLUNAS}
            rows={linhas}
            rowKey={(l) => l.chave}
            caption="A receber por produto no período escolhido"
          />
        )}
      </Card>

      <Card flush>
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 px-5 pt-5 pb-4 md:px-6">
          <h2 className="text-display-xs">Entrou e saiu</h2>
          <span className="text-body-sm text-mute">últimos seis meses</span>
        </div>
        <div className="px-5 pb-6 md:px-6">
          <MonthlyFlow meses={fluxo} />
        </div>
      </Card>
    </>
  );
}
