import { cn } from "@/lib/cn";
import { splitBRL } from "@/lib/format";

type MoneySize = "xl" | "lg" | "md" | "card";

export type MoneyProps = {
  valor: number;
  size?: MoneySize;
  className?: string;
};

/**
 * Valor em destaque: "R$" pequeno e apagado, inteiro em peso 900, centavos em 600.
 * Para listas e tabelas use `formatBRL` em texto normal.
 */
const sizes: Record<MoneySize, { inteiro: string; moeda: string; centavos: string }> = {
  xl: { inteiro: "text-display-xl", moeda: "text-body-md", centavos: "text-body-lg" },
  lg: { inteiro: "text-display-lg", moeda: "text-body-md", centavos: "text-body-lg" },
  md: { inteiro: "text-display-md", moeda: "text-body-sm", centavos: "text-body-md" },
  /** Cartão de número: 24 no celular (cabem dois por linha), 40 a partir de 640px. */
  card: {
    inteiro: "text-display-xs sm:text-display-md",
    moeda: "text-caption sm:text-body-sm",
    centavos: "text-body-sm sm:text-body-md",
  },
};

export function Money({ valor, size = "lg", className }: MoneyProps) {
  const { inteiro, centavos } = splitBRL(valor);
  const s = sizes[size];

  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className={cn(s.moeda, "font-semibold opacity-60")}>R$</span>
      <span className={s.inteiro}>{inteiro}</span>
      <span className={cn(s.centavos, "font-semibold opacity-75")}>,{centavos}</span>
    </span>
  );
}
