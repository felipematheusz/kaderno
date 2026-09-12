import { cn } from "@/lib/cn";

export type InstallmentStatus = "paga" | "proxima" | "atrasada" | "futura";

export type InstallmentBarProps = {
  parcelas: readonly InstallmentStatus[];
  size?: "md" | "sm";
  className?: string;
};

const statusClass: Record<InstallmentStatus, string> = {
  paga: "bg-ink-deep",
  proxima: "bg-primary-neutral",
  atrasada: "bg-negative",
  futura: "bg-canvas-soft",
};

const statusLabel: Record<InstallmentStatus, { uma: string; varias: string }> = {
  paga: { uma: "paga", varias: "pagas" },
  proxima: { uma: "próxima", varias: "próximas" },
  atrasada: { uma: "atrasada", varias: "atrasadas" },
  futura: { uma: "a vencer", varias: "a vencer" },
};

/** Sequência de parcelas do mesmo tipo: "as 30 primeiras, pagas". */
type Trecho = { status: InstallmentStatus; inicio: number; quantidade: number };

/**
 * Acima disso os segmentos ficariam mais finos que o espaço entre eles.
 * Contrato diário ou semanal passa fácil de 24 parcelas, mas quase sempre em poucos trechos.
 */
const MAX_TRECHOS = 24;

function agrupar(parcelas: readonly InstallmentStatus[]): Trecho[] {
  const trechos: Trecho[] = [];
  for (const [i, status] of parcelas.entries()) {
    const ultimo = trechos.at(-1);
    if (ultimo?.status === status) ultimo.quantidade++;
    else trechos.push({ status, inicio: i, quantidade: 1 });
  }
  return trechos;
}

/** Junta trechos vizinhos que ficaram com o mesmo tipo depois de uma fusão. */
function unirIguais(trechos: Trecho[]): Trecho[] {
  return trechos.reduce<Trecho[]>((acc, trecho) => {
    const ultimo = acc.at(-1);
    if (ultimo?.status === trecho.status) ultimo.quantidade += trecho.quantidade;
    else acc.push({ ...trecho });
    return acc;
  }, []);
}

/** Cor de um bloco: atrasada e próxima nunca somem; entre paga e a vencer, manda a maioria. */
function statusDoBloco(fatia: readonly InstallmentStatus[]): InstallmentStatus {
  if (fatia.includes("atrasada")) return "atrasada";
  if (fatia.includes("proxima")) return "proxima";
  const pagas = fatia.filter((s) => s === "paga").length;
  return pagas * 2 >= fatia.length ? "paga" : "futura";
}

/**
 * Pagamento muito salteado geraria trechos demais. Aí o contrato é dividido em blocos iguais e
 * cada bloco vira um segmento: a proporção do que foi pago continua certa e o atraso continua visível.
 */
function emBlocos(parcelas: readonly InstallmentStatus[], max: number): Trecho[] {
  const tamanho = Math.ceil(parcelas.length / max);
  const blocos: Trecho[] = [];

  for (let i = 0; i < parcelas.length; i += tamanho) {
    const fatia = parcelas.slice(i, i + tamanho);
    blocos.push({ status: statusDoBloco(fatia), inicio: i, quantidade: fatia.length });
  }

  return unirIguais(blocos);
}

/** Em bloco o segmento representa um pedaço misturado: o texto não pode afirmar o tipo de todas. */
const blocoLabel: Record<InstallmentStatus, string> = {
  paga: "a maioria paga",
  proxima: "tem a próxima",
  atrasada: "tem atrasada",
  futura: "a maioria a vencer",
};

function rotulo(trecho: Trecho, emBloco: boolean): string {
  const faixa = `parcelas ${trecho.inicio + 1} a ${trecho.inicio + trecho.quantidade}`;
  if (emBloco) return `${faixa}: ${blocoLabel[trecho.status]}`;

  const { uma, varias } = statusLabel[trecho.status];
  if (trecho.quantidade === 1) return `${trecho.inicio + 1}ª parcela: ${uma}`;
  return `${faixa}: ${varias}`;
}

/**
 * Parcelas como segmentos, não barra lisa de porcentagem: um segmento por sequência do mesmo tipo,
 * com a largura proporcional ao tanto de parcelas. Em contrato curto dá uma parcela por segmento;
 * em contrato de 72 parcelas vira o pago, a atrasada e o que falta, sem virar poeira na tela.
 */
export function InstallmentBar({ parcelas, size = "md", className }: InstallmentBarProps) {
  const pagas = parcelas.filter((p) => p === "paga").length;
  const sequencias = agrupar(parcelas);
  const emBloco = sequencias.length > MAX_TRECHOS;
  const trechos = emBloco ? emBlocos(parcelas, MAX_TRECHOS) : sequencias;

  return (
    <div
      role="img"
      aria-label={`${pagas} de ${parcelas.length} parcelas pagas`}
      className={cn(
        "flex",
        // Muitos trechos: o espaço entre eles encolhe para sobrar largura para os segmentos.
        trechos.length > 8 ? "gap-0.5" : "gap-1",
        size === "md" ? "h-2.5" : "h-2",
        className,
      )}
    >
      {trechos.map((trecho) => (
        <span
          key={trecho.inicio}
          title={rotulo(trecho, emBloco)}
          style={{ flexGrow: trecho.quantidade }}
          className={cn(
            "basis-0 rounded-pill",
            // Atraso e próxima parcela são um pedaço só no meio de muitas: precisam de piso maior.
            trecho.status === "atrasada" || trecho.status === "proxima" ? "min-w-2" : "min-w-1",
            statusClass[trecho.status],
          )}
        />
      ))}
    </div>
  );
}
