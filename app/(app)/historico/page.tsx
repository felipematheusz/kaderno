import type { Metadata } from "next";
import { connection } from "next/server";
import { TimelineRow, type TipoEvento } from "@/components/domain/timeline-row";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { ClockIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { getHistorico, type Evento } from "@/lib/dados";
import { formatBRL, formatMonth, mesDe } from "@/lib/format";
import { lerPagina, paginar } from "@/lib/paginacao";

export const metadata: Metadata = {
  title: "Histórico · Caderno",
};

type Filtro = "tudo" | TipoEvento;

const FILTROS: readonly { valor: Filtro; rotulo: string }[] = [
  { valor: "tudo", rotulo: "Tudo" },
  { valor: "pagamento", rotulo: "Entradas" },
  { valor: "contrato", rotulo: "Saídas" },
  { valor: "cliente", rotulo: "Clientes" },
];

function parseFiltro(valor: string | string[] | undefined): Filtro {
  return FILTROS.some((f) => f.valor === valor) ? (valor as Filtro) : "tudo";
}

function cabe(evento: Evento, filtro: Filtro): boolean {
  return filtro === "tudo" || evento.tipo === filtro;
}

/** Mantém o filtro ao trocar de página. */
function link(filtro: Filtro, pagina = 1): string {
  const params = new URLSearchParams();
  if (filtro !== "tudo") params.set("filtro", filtro);
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query === "" ? "/historico" : `/historico?${query}`;
}

type Saldo = { entrada: number; saida: number };

/** Os eventos de um mês na página aberta. */
type Grupo = { mes: string; eventos: Evento[] };

function agrupar(eventos: readonly Evento[]): Grupo[] {
  const grupos: Grupo[] = [];

  for (const evento of eventos) {
    const mes = mesDe(evento.data);
    let grupo = grupos.at(-1);
    if (grupo?.mes !== mes) {
      grupo = { mes, eventos: [] };
      grupos.push(grupo);
    }
    grupo.eventos.push(evento);
  }

  return grupos;
}

/** O saldo de cada mês conta a lista inteira: a página mostra parte, o título não mente. */
function saldoPorMes(eventos: readonly Evento[]): Map<string, Saldo> {
  const saldos = new Map<string, Saldo>();

  for (const evento of eventos) {
    const mes = mesDe(evento.data);
    const saldo = saldos.get(mes) ?? { entrada: 0, saida: 0 };
    if (evento.tipo === "pagamento") saldo.entrada += evento.valor ?? 0;
    if (evento.tipo === "contrato") saldo.saida += evento.valor ?? 0;
    saldos.set(mes, saldo);
  }

  return saldos;
}

/** "+ R$ 1.200 · − R$ 800" — só o que o filtro deixou aparecer. */
function resumoDoMes(saldo: Saldo | undefined): string {
  if (!saldo) return "";
  return [saldo.entrada > 0 ? `+ ${formatBRL(saldo.entrada)}` : null, saldo.saida > 0 ? `− ${formatBRL(saldo.saida)}` : null]
    .filter(Boolean)
    .join(" · ");
}

export default async function HistoricoPage({ searchParams }: PageProps<"/historico">) {
  await connection(); // a conta muda a cada baixa e a cada contrato novo
  const { filtro: bruto, pagina } = await searchParams;
  const filtro = parseFiltro(bruto);

  const eventos = await getHistorico();
  const lista = eventos.filter((e) => cabe(e, filtro));
  const { itens, paginacao } = paginar(lista, lerPagina(pagina));
  const grupos = agrupar(itens);
  const saldos = saldoPorMes(lista);

  const entrada = eventos.reduce((soma, e) => soma + (e.tipo === "pagamento" ? (e.valor ?? 0) : 0), 0);
  const saida = eventos.reduce((soma, e) => soma + (e.tipo === "contrato" ? (e.valor ?? 0) : 0), 0);

  return (
    <>
      <PageHeader
        title="Histórico"
        description={
          eventos.length === 0
            ? "Nada aconteceu na conta ainda."
            : `${formatBRL(entrada)} entraram e ${formatBRL(saida)} saíram desde o começo.`
        }
      />

      <FilterChips aria-label="O que mostrar no histórico">
        {FILTROS.map((f) => (
          <FilterChip
            key={f.valor}
            href={link(f.valor)}
            selected={filtro === f.valor}
            count={eventos.filter((e) => cabe(e, f.valor)).length}
          >
            {f.rotulo}
          </FilterChip>
        ))}
      </FilterChips>

      {grupos.length === 0 ? (
        <EmptyState
          icon={<ClockIcon />}
          title="Nada por aqui"
          description="Cadastros, contratos e pagamentos aparecem nesta linha do tempo, do mais recente para o mais antigo."
        />
      ) : (
        <>
          {/* Um cartão por mês: o mês vira título de seção e o saldo dele fica na mesma linha. */}
          {grupos.map((grupo) => (
            <section key={grupo.mes} className="flex flex-col gap-2.5">
              <h2 className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-body-sm text-body">
                <span className="font-semibold text-ink">{formatMonth(grupo.mes)}</span>
                <span>{resumoDoMes(saldos.get(grupo.mes))}</span>
              </h2>
              <Card flush>
                <ul>
                  {grupo.eventos.map((evento) => (
                    <TimelineRow
                      key={evento.id}
                      tipo={evento.tipo}
                      data={evento.data}
                      titulo={evento.titulo}
                      detalhe={evento.detalhe}
                      valor={evento.valor}
                      href={evento.href}
                    />
                  ))}
                </ul>
              </Card>
            </section>
          ))}
          <Pagination {...paginacao} href={(p) => link(filtro, p)} rotulo="eventos" />
        </>
      )}
    </>
  );
}
