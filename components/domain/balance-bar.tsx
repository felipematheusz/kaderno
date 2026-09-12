import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";

export type BalanceBarProps = {
  recebido: number;
  aVencer: number;
  atrasado: number;
  className?: string;
};

type Segmento = { chave: string; rotulo: string; valor: number; cor: string };

/** Barra proporcional do dinheiro emprestado: recebido, a vencer e atrasado, com legenda. */
export function BalanceBar({ recebido, aVencer, atrasado, className }: BalanceBarProps) {
  const segmentos: Segmento[] = [
    { chave: "recebido", rotulo: "Recebido", valor: recebido, cor: "bg-ink-deep" },
    { chave: "a-vencer", rotulo: "A vencer", valor: aVencer, cor: "bg-primary-neutral" },
    { chave: "atrasado", rotulo: "Atrasado", valor: atrasado, cor: "bg-negative" },
  ];
  const total = recebido + aVencer + atrasado;

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {/* A legenda já traz os números; a barra é só visual. */}
      <div aria-hidden className="flex h-3 gap-0.75">
        {total === 0 ? (
          <span className="flex-1 rounded-pill bg-canvas-soft" />
        ) : (
          segmentos
            .filter((s) => s.valor > 0)
            .map((s) => (
              <span
                key={s.chave}
                className={cn("min-w-2 rounded-pill", s.cor)}
                style={{ width: `${(s.valor / total) * 100}%` }}
              />
            ))
        )}
      </div>
      <ul className="flex flex-wrap gap-x-5 gap-y-1 text-body-sm text-body">
        {segmentos.map((s) => (
          <li key={s.chave} className="inline-flex items-center gap-1.5">
            <span aria-hidden className={cn("size-2.5 rounded-pill", s.cor)} />
            {s.rotulo}
            <strong className="font-semibold text-ink">{formatBRL(s.valor)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
