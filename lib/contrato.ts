import { somarDias, somarMeses } from "./format";

/*
 * A conta do contrato: quanto fica cada parcela, quanto entra no total e quando cada uma vence.
 * Uma função só para a tela de criação (prévia ao vivo) e para a hora de gravar, para os dois
 * nunca discordarem.
 */

export type Frequencia = "diaria" | "semanal" | "quinzenal" | "mensal";

export const FREQUENCIAS: readonly { value: Frequencia; label: string }[] = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
];

export const rotuloFrequencia: Record<Frequencia, string> = {
  diaria: "diária",
  semanal: "semanal",
  quinzenal: "quinzenal",
  mensal: "mensal",
};

/** Onde o juro informado incide. */
export type JurosSobre =
  /** A taxa vale para cada parcela: 10% ao mês em 3x mensais é 30% no fim. */
  | "parcela"
  /** A taxa vale uma vez só, sobre o total. */
  | "total";

export type Montagem = {
  /** Valor emprestado, ou o preço da venda. */
  principal: number;
  /** Juros em % ao mês. Zero é contrato de valor fixo, sem juros. */
  taxa: number;
  jurosSobre: JurosSobre;
  parcelas: number;
  /** Venda: parte paga na hora, que sai do parcelamento. */
  entrada?: number;
  /** Venda: quanto o produto custou para você. Não aparece para o cliente. */
  custo?: number;
};

export type Simulacao = {
  /** Total a receber, já com juros e sem a entrada. */
  total: number;
  valorParcela: number;
  /** Só os juros do contrato inteiro. */
  juros: number;
  /** O que sobra para você no fim: juros e, na venda, a diferença do custo. */
  lucro: number;
};

/** 42 → "#0042". O banco guarda o número; a tela e as mensagens mostram assim. */
export function rotuloNumeroContrato(numero: number): string {
  return `#${String(numero).padStart(4, "0")}`;
}

/** "#0042", "0042" ou "42" → 42. Referência que uma pessoa (ou a IA) escreveria. */
export function lerNumeroContrato(referencia: string): number | undefined {
  const digitos = referencia.trim().replace(/^#/, "");
  if (!/^\d{1,9}$/.test(digitos)) return undefined;
  return Number(digitos);
}

/** Centavos redondos: dinheiro não pode acumular sobra de ponto flutuante. */
export function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}

/**
 * Juros simples: a taxa multiplica pelo número de parcelas quando é "por parcela",
 * e entra uma vez só quando é "sobre o total".
 */
export function simular({ principal, taxa, jurosSobre, parcelas, entrada = 0, custo }: Montagem): Simulacao {
  const base = Math.max(principal - entrada, 0);
  const vezes = jurosSobre === "parcela" ? Math.max(parcelas, 1) : 1;
  const juros = arredondar((base * taxa * vezes) / 100);
  const total = arredondar(base + juros);
  const quantas = Math.max(parcelas, 1);

  return {
    total,
    valorParcela: arredondar(total / quantas),
    juros,
    lucro: custo === undefined ? juros : arredondar(total + entrada - custo),
  };
}

/** O vencimento da parcela `indice` (0 é a primeira) a partir da data da primeira. */
export function vencimentoDe(primeiro: string, indice: number, frequencia: Frequencia): string {
  if (frequencia === "mensal") return somarMeses(primeiro, indice);
  const passo = frequencia === "diaria" ? 1 : frequencia === "semanal" ? 7 : 15;
  return somarDias(primeiro, indice * passo);
}

export type ParcelaGerada = { numero: number; vencimento: string; valor: number };

/**
 * As parcelas do contrato. A última absorve a sobra do arredondamento, para a soma
 * das parcelas bater com o total na casa do centavo.
 */
export function gerarParcelas(montagem: Montagem, primeiroVencimento: string, frequencia: Frequencia): ParcelaGerada[] {
  const { total, valorParcela } = simular(montagem);
  const quantas = Math.max(montagem.parcelas, 1);

  return Array.from({ length: quantas }, (_, i) => ({
    numero: i + 1,
    vencimento: vencimentoDe(primeiroVencimento, i, frequencia),
    valor: i === quantas - 1 ? arredondar(total - valorParcela * (quantas - 1)) : valorParcela,
  }));
}
