import Link from "next/link";
import { cn } from "@/lib/cn";
import { DIAS_DA_SEMANA, diaDoMes, formatBRLCurto, formatDayLong, gradeDoMes, mesDe } from "@/lib/format";
import type { InstallmentRowStatus } from "./installment-row";

/** Quanto o dia tem em cada situação. É a mesma leitura da linha de parcela. */
export type ValoresDoDia = Record<InstallmentRowStatus, number>;

export type DiaDoCalendario = {
  /** Dia em ISO: "2026-09-12". */
  data: string;
  valores: ValoresDoDia;
  /** Quantas parcelas caem no dia. */
  parcelas: number;
};

export type MonthCalendarProps = {
  /** Mês desenhado: "2026-09". */
  mes: string;
  dias: readonly DiaDoCalendario[];
  /** Dia escolhido, em ISO. */
  selecionado: string;
  /** Hoje, em ISO. */
  hoje: string;
  /** Para onde vai o clique em cada dia. */
  href: (dia: string) => string;
  /** O que está somado na célula, para o leitor de tela: "a receber" ou "de juros". */
  medida?: string;
  className?: string;
};

/** Ordem das fatias na fita do dia: o que já entrou primeiro, o que falta depois. */
const ORDEM: readonly InstallmentRowStatus[] = ["paga", "atrasada", "hoje", "futura"];

const fitaClass: Record<InstallmentRowStatus, string> = {
  paga: "bg-ink-deep",
  atrasada: "bg-negative",
  hoje: "bg-warning",
  futura: "bg-mute",
};

/** Cor do valor da célula, pela situação que manda no dia. */
const valorClass: Record<InstallmentRowStatus, string> = {
  paga: "text-mute",
  atrasada: "text-negative-darkest",
  hoje: "text-warning-content",
  futura: "text-ink",
};

const rotulo: Record<InstallmentRowStatus, string> = {
  paga: "recebido",
  atrasada: "atrasado",
  hoje: "vence hoje",
  futura: "a vencer",
};

/** Atraso manda, depois o que vence hoje; entre pago e a vencer, quem tiver valor. */
function situacaoDoDia(valores: ValoresDoDia): InstallmentRowStatus {
  if (valores.atrasada > 0) return "atrasada";
  if (valores.hoje > 0) return "hoje";
  if (valores.futura > 0) return "futura";
  return "paga";
}

function somar(valores: ValoresDoDia): number {
  return ORDEM.reduce((soma, status) => soma + valores[status], 0);
}

/** A fita do dia: uma fatia por situação, com a largura proporcional ao valor. */
function Fita({ valores, selecionado }: { valores: ValoresDoDia; selecionado: boolean }) {
  return (
    <div aria-hidden className="flex h-1.5 gap-0.5">
      {ORDEM.filter((status) => valores[status] > 0).map((status) => (
        <span
          key={status}
          style={{ flexGrow: valores[status] }}
          className={cn(
            "min-w-1.5 basis-0 rounded-pill",
            // O verde-floresta do recebido some no fundo do dia escolhido: ali ele vira verde claro.
            selecionado && status === "paga" ? "bg-primary" : fitaClass[status],
          )}
        />
      ))}
    </div>
  );
}

function Celula({
  dia,
  selecionado,
  ehHoje,
  href,
  medida,
}: {
  dia: DiaDoCalendario;
  selecionado: boolean;
  ehHoje: boolean;
  href: string;
  medida: string;
}) {
  const total = somar(dia.valores);
  const situacao = situacaoDoDia(dia.valores);
  const temMovimento = dia.parcelas > 0;

  const descricao = temMovimento
    ? `${dia.parcelas} ${dia.parcelas === 1 ? "parcela" : "parcelas"}, ${formatBRLCurto(total)} ${medida}`
    : "nada a receber";

  return (
    <Link
      href={href}
      aria-label={`${formatDayLong(dia.data)}: ${descricao}`}
      aria-current={selecionado ? "date" : undefined}
      className={cn(
        "flex h-full min-h-15 flex-col gap-1.5 rounded-lg p-1.5 transition-colors sm:min-h-22 sm:p-2.5",
        selecionado
          ? "bg-ink-deep text-primary"
          : cn(temMovimento ? "bg-canvas-soft" : "bg-canvas", "hover:bg-primary-pale"),
      )}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-pill text-body-sm font-semibold",
          ehHoje && (selecionado ? "bg-primary text-ink-deep" : "bg-ink-deep text-primary"),
          !ehHoje && !selecionado && !temMovimento && "text-mute",
        )}
      >
        {diaDoMes(dia.data)}
      </span>

      {temMovimento && (
        <div className="mt-auto flex flex-col gap-1">
          <Fita valores={dia.valores} selecionado={selecionado} />
          <span
            className={cn(
              "hidden truncate text-caption font-semibold sm:block",
              // No dia escolhido o valor fica neutro: o verde ali sugeriria "recebido".
              selecionado ? "text-canvas" : valorClass[situacao],
            )}
          >
            {formatBRLCurto(total)}
          </span>
        </div>
      )}
    </Link>
  );
}

/**
 * A grade do mês: cada dia com movimento vira um bloco sálvia com a fita das situações
 * e o valor do dia. Clicar troca o dia aberto na lateral; o valor de cada fatia vem
 * pronto de fora (total do dia ou só os juros).
 */
export function MonthCalendar({
  mes,
  dias,
  selecionado,
  hoje,
  href,
  medida = "a receber",
  className,
}: MonthCalendarProps) {
  const porDia = new Map(dias.map((dia) => [dia.data, dia]));
  const grade = gradeDoMes(mes);
  const semanas = Array.from({ length: grade.length / 7 }, (_, i) => grade.slice(i * 7, i * 7 + 7));

  return (
    <table className={cn("w-full table-fixed border-separate border-spacing-1", className)}>
      <thead>
        <tr>
          {DIAS_DA_SEMANA.map((dia) => (
            <th key={dia.curto} scope="col" className="pb-1 text-caption font-semibold text-mute">
              <span aria-hidden>{dia.curto}</span>
              <span className="sr-only">{dia.longo}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {semanas.map((semana) => (
          <tr key={semana[0]}>
            {semana.map((data) =>
              mesDe(data) === mes ? (
                <td key={data} className="p-0 align-top">
                  <Celula
                    dia={porDia.get(data) ?? { data, valores: { paga: 0, atrasada: 0, hoje: 0, futura: 0 }, parcelas: 0 }}
                    selecionado={data === selecionado}
                    ehHoje={data === hoje}
                    href={href(data)}
                    medida={medida}
                  />
                </td>
              ) : (
                <td key={data} />
              ),
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Legenda das cores da fita. Fica embaixo da grade, em uma linha só. */
export function MonthCalendarLegend({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4 gap-y-1.5 text-caption text-mute", className)}>
      {ORDEM.map((status) => (
        <li key={status} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("size-2 rounded-pill", fitaClass[status])} />
          {rotulo[status]}
        </li>
      ))}
    </ul>
  );
}
