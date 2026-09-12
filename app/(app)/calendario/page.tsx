import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { InstallmentActions } from "@/components/domain/installment-actions";
import { InstallmentRow } from "@/components/domain/installment-row";
import {
  MonthCalendar,
  MonthCalendarLegend,
  type DiaDoCalendario,
  type ValoresDoDia,
} from "@/components/domain/month-calendar";
import { StatCard } from "@/components/domain/stat-card";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icons";
import { getContratos, getParcelas, type Parcela } from "@/lib/dados";
import { verParcela } from "@/lib/emprestimos";
import { cobrancaDaParcela } from "@/lib/mensagens";
import {
  formatBRL,
  formatDayLong,
  formatLongDate,
  formatMonth,
  formatShortDate,
  isDia,
  isMes,
  isoDate,
  mesAtual,
  mesDe,
  somarAoMes,
} from "@/lib/format";

export const metadata: Metadata = {
  title: "Calendário · Caderno",
};

/** O que o calendário soma: o valor cheio da parcela ou só o juro que ela carrega. */
type Ver = "total" | "juros";

const VER: readonly { valor: Ver; rotulo: string }[] = [
  { valor: "total", rotulo: "Valor total" },
  { valor: "juros", rotulo: "Só os juros" },
];

const rotuloCartao: Record<Ver, { aVencer: string; vencidos: string; total: string }> = {
  total: { aVencer: "A vencer", vencidos: "Vencidos", total: "Total do mês" },
  juros: { aVencer: "Juros a vencer", vencidos: "Juros vencidos", total: "Juros do mês" },
};

const VAZIO: ValoresDoDia = { paga: 0, atrasada: 0, hoje: 0, futura: 0 };

const ORDEM = ["paga", "atrasada", "hoje", "futura"] as const;

function primeiro(valor: string | string[] | undefined): string | undefined {
  return Array.isArray(valor) ? valor[0] : valor;
}

/** Um parâmetro por vez: o dia manda no mês, e o modo de soma segue junto. */
function link({ mes, dia, ver }: { mes?: string; dia?: string; ver: Ver }): string {
  const busca = new URLSearchParams();
  if (dia) busca.set("dia", dia);
  else if (mes) busca.set("mes", mes);
  if (ver === "juros") busca.set("ver", "juros");

  const texto = busca.toString();
  return texto === "" ? "/calendario" : `/calendario?${texto}`;
}

function plural(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? "parcela" : "parcelas"}`;
}

export default async function CalendarioPage({ searchParams }: PageProps<"/calendario">) {
  await connection(); // o que está atrasado e o que vence hoje muda a cada acesso
  const agora = new Date();
  const hoje = isoDate(agora);
  const mesDeHoje = mesAtual(agora);

  const params = await searchParams;
  const diaBruto = primeiro(params.dia);
  const mesBruto = primeiro(params.mes);
  const ver: Ver = primeiro(params.ver) === "juros" ? "juros" : "total";

  const diaEscolhido = diaBruto !== undefined && isDia(diaBruto) ? diaBruto : undefined;
  const mes = diaEscolhido ? mesDe(diaEscolhido) : mesBruto !== undefined && isMes(mesBruto) ? mesBruto : mesDeHoje;
  // Sem dia na URL: o mês corrente abre em hoje; os outros, no dia 1º.
  const dia = diaEscolhido ?? (mes === mesDeHoje ? hoje : `${mes}-01`);

  const [parcelas, contratos] = await Promise.all([getParcelas(), getContratos()]);
  const jurosPorParcela = new Map(
    contratos.map((c) => [c.id, c.totalParcelas === 0 ? 0 : c.juros / c.totalParcelas]),
  );

  /** Quanto essa parcela vale na leitura escolhida. */
  function peso(parcela: Parcela): number {
    if (ver === "juros") return jurosPorParcela.get(parcela.contratoId) ?? 0;
    return parcela.pago ? (parcela.valorRecebido ?? parcela.valor) : parcela.valor;
  }

  const doMes = parcelas.filter((p) => mesDe(p.vencimento) === mes);

  // Um balde por dia: a fita da célula e o valor saem daqui.
  const porDia = new Map<string, DiaDoCalendario>();
  for (const parcela of doMes) {
    const { status } = verParcela(parcela, agora);
    const atual = porDia.get(parcela.vencimento) ?? { data: parcela.vencimento, valores: { ...VAZIO }, parcelas: 0 };
    atual.valores[status] += peso(parcela);
    atual.parcelas += 1;
    porDia.set(parcela.vencimento, atual);
  }

  const totalMes = { ...VAZIO };
  for (const balde of porDia.values()) {
    for (const status of ORDEM) totalMes[status] += balde.valores[status];
  }

  const abertas = doMes.filter((p) => !p.pago);
  const vencidas = abertas.filter((p) => verParcela(p, agora).status === "atrasada");

  const aVencer = totalMes.hoje + totalMes.futura;
  const recebido = totalMes.paga;
  const total = aVencer + totalMes.atrasada + recebido;

  const doDia = doMes.filter((p) => p.vencimento === dia);
  const totalDoDia = doDia.reduce((soma, p) => soma + (p.pago ? (p.valorRecebido ?? p.valor) : p.valor), 0);
  const proximo = parcelas.find((p) => !p.pago && p.vencimento > dia)?.vencimento;

  const rotulos = rotuloCartao[ver];

  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(agora)}
        title="Calendário"
        description={
          doMes.length === 0
            ? `Nenhum vencimento em ${formatMonth(mes).toLowerCase()}.`
            : `${plural(doMes.length)} em ${formatMonth(mes).toLowerCase()} · ${formatBRL(total)}`
        }
      />

      <FilterChips aria-label="O que o calendário soma">
        {VER.map((opcao) => (
          <FilterChip
            key={opcao.valor}
            href={link({ dia, ver: opcao.valor })}
            selected={ver === opcao.valor}
          >
            {opcao.rotulo}
          </FilterChip>
        ))}
      </FilterChips>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          rotulo={rotulos.aVencer}
          valor={aVencer}
          detalhe={
            abertas.length - vencidas.length === 0
              ? "Nada a receber no mês"
              : plural(abertas.length - vencidas.length)
          }
        />
        <StatCard
          rotulo={rotulos.vencidos}
          valor={totalMes.atrasada}
          detalhe={vencidas.length === 0 ? "Tudo em dia" : plural(vencidas.length)}
          tone={totalMes.atrasada > 0 ? "negative" : "default"}
        />
        <StatCard
          rotulo={rotulos.total}
          valor={total}
          detalhe={`${formatBRL(recebido)} já recebidos`}
          className="max-sm:col-span-2"
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <Card flush>
          <div className="flex items-center justify-between gap-3 px-4 pt-5 pb-2 sm:px-5">
            <h2 className="text-display-xs">{formatMonth(mes)}</h2>
            <div className="flex items-center gap-1.5">
              {mes !== mesDeHoje && (
                <Link href={link({ ver })} className={buttonClass({ variant: "secondary", size: "sm" })}>
                  Hoje
                </Link>
              )}
              <Link
                href={link({ mes: somarAoMes(mes, -1), ver })}
                aria-label={`Mês anterior: ${formatMonth(somarAoMes(mes, -1))}`}
                className={buttonClass({ variant: "ghost", size: "icon-sm" })}
              >
                <ChevronLeftIcon />
              </Link>
              <Link
                href={link({ mes: somarAoMes(mes, 1), ver })}
                aria-label={`Próximo mês: ${formatMonth(somarAoMes(mes, 1))}`}
                className={buttonClass({ variant: "ghost", size: "icon-sm" })}
              >
                <ChevronRightIcon />
              </Link>
            </div>
          </div>

          <div className="px-2 sm:px-3">
            <MonthCalendar
              mes={mes}
              dias={[...porDia.values()]}
              selecionado={dia}
              hoje={hoje}
              href={(escolhido) => link({ dia: escolhido, ver })}
              medida={ver === "juros" ? "de juros" : "a receber"}
            />
          </div>

          <MonthCalendarLegend className="px-4 pt-3 pb-5 sm:px-5" />
        </Card>

        <Card flush className="xl:sticky xl:top-8">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 pt-5 pb-3 md:px-6">
            <h2 className="text-display-xs">{dia === hoje ? "Hoje" : formatDayLong(dia)}</h2>
            {doDia.length > 0 && (
              <span className="text-body-sm text-mute">{`${plural(doDia.length)} · ${formatBRL(totalDoDia)}`}</span>
            )}
          </div>

          {doDia.length === 0 ? (
            <p className="border-t border-canvas-soft px-5 py-6 text-body-md text-body md:px-6">
              Nada vence nesse dia.
              {proximo && (
                <>
                  {" "}
                  O próximo vencimento é{" "}
                  <Link href={link({ dia: proximo, ver })} className="font-semibold underline underline-offset-4">
                    {formatShortDate(proximo)}
                  </Link>
                  .
                </>
              )}
            </p>
          ) : (
            <ul>
              {doDia.map((p) => {
                // Sem a coluna de prazo: o título do cartão já diz de que dia é a lista.
                const { status, detalhe } = verParcela(p, agora);
                return (
                  <InstallmentRow
                    key={p.id}
                    status={status}
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
          )}
        </Card>
      </div>
    </>
  );
}
