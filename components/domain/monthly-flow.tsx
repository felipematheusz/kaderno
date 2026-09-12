import { cn } from "@/lib/cn";
import { formatBRL, formatBRLCurto, formatMonth, formatMonthShort } from "@/lib/format";

export type MesDeFluxo = {
  /** "2026-09". */
  mes: string;
  entrada: number;
  saida: number;
};

export type MonthlyFlowProps = {
  /** Do mês mais antigo ao mais recente. */
  meses: readonly MesDeFluxo[];
  className?: string;
};

/** Fatia mínima para um mês pequeno não sumir do gráfico. */
const ALTURA_MINIMA = 2;

function Barra({ valor, teto, cor }: { valor: number; teto: number; cor: string }) {
  const largura = "w-3 sm:w-5";
  if (valor <= 0) return <span aria-hidden className={largura} />;

  return (
    <span
      aria-hidden
      className={cn(largura, "rounded-t-sm", cor)}
      style={{ height: `${Math.max((valor / teto) * 100, ALTURA_MINIMA)}%` }}
    />
  );
}

function Verbete({ cor, rotulo, valor }: { cor: string; rotulo: string; valor: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden className={cn("size-2.5 rounded-pill", cor)} />
      {rotulo}
      <strong className="font-semibold text-ink">{formatBRL(valor)}</strong>
    </span>
  );
}

/** Entrou × saiu mês a mês: duas barras por mês, com a legenda somando o período. */
export function MonthlyFlow({ meses, className }: MonthlyFlowProps) {
  const teto = Math.max(...meses.map((m) => Math.max(m.entrada, m.saida)), 0);
  const entrada = meses.reduce((soma, m) => soma + m.entrada, 0);
  const saida = meses.reduce((soma, m) => soma + m.saida, 0);

  if (teto === 0) {
    return <p className={cn("text-body-md text-body", className)}>Nada entrou nem saiu nesses meses.</p>;
  }

  return (
    <figure className={cn("flex flex-col gap-4", className)}>
      <figcaption className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-body-sm text-body">
        <Verbete cor="bg-ink-deep" rotulo="Entrou" valor={entrada} />
        <Verbete cor="bg-primary-neutral" rotulo="Saiu" valor={saida} />
        {/* A escala: sem ela a altura da barra não diz nada. */}
        <span className="text-caption text-mute sm:ml-auto">barra cheia = {formatBRLCurto(teto)}</span>
      </figcaption>

      <div className="flex flex-col gap-2">
        <ul className="grid grid-cols-6 items-end gap-1.5 border-b border-canvas-soft sm:gap-3">
          {meses.map((m) => (
            <li key={m.mes} className="flex h-36 items-end justify-center gap-1 sm:gap-2">
              <span className="sr-only">
                {formatMonth(m.mes)}: entrou {formatBRL(m.entrada)}, saiu {formatBRL(m.saida)}.
              </span>
              <Barra valor={m.entrada} teto={teto} cor="bg-ink-deep" />
              <Barra valor={m.saida} teto={teto} cor="bg-primary-neutral" />
            </li>
          ))}
        </ul>
        <div aria-hidden className="grid grid-cols-6 gap-1.5 text-center text-caption text-body sm:gap-3">
          {meses.map((m) => (
            <span key={m.mes}>{formatMonthShort(m.mes)}</span>
          ))}
        </div>
      </div>
    </figure>
  );
}
