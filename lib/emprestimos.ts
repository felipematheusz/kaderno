import type { InstallmentRowStatus } from "@/components/domain/installment-row";
import type { InstallmentStatus } from "@/components/ui/installment-bar";
import { diasAte, normalizeSearch, onlyDigits, prazoCurto } from "./format";

/*
 * Regras do produto que as telas e os componentes compartilham: como se lê a situação
 * de um contrato e como uma parcela aparece no dia de hoje.
 */

export type SituacaoContrato = "em-dia" | "atrasado" | "quitado";

/** Situação pela fita de parcelas: atraso manda; depois, tudo pago é quitado. */
export function situacaoContrato(parcelas: readonly InstallmentStatus[]): SituacaoContrato {
  if (parcelas.includes("atrasada")) return "atrasado";
  return parcelas.every((p) => p === "paga") ? "quitado" : "em-dia";
}

/** "1 dia atrasada", "4 dias atrasada". */
export function atrasoLabel(dias: number): string {
  return `${dias} ${dias === 1 ? "dia" : "dias"} atrasada`;
}

export type ParcelaNoTempo = {
  /** Dia do vencimento em ISO: "2026-09-07". */
  vencimento: string;
  pago: boolean;
  /** Complemento fixo da linha, quando existe: "recebida via Pix". */
  detalhe?: string;
};

export type ParcelaHoje = {
  status: InstallmentRowStatus;
  prazo: string;
  detalhe?: string;
};

/** Como a parcela aparece agora: situação, prazo e o complemento da linha. */
export function verParcela(parcela: ParcelaNoTempo, agora: Date): ParcelaHoje {
  const dias = diasAte(parcela.vencimento, agora);
  const status: InstallmentRowStatus = parcela.pago
    ? "paga"
    : dias < 0
      ? "atrasada"
      : dias === 0
        ? "hoje"
        : "futura";

  return {
    status,
    prazo: prazoCurto(parcela.vencimento, agora),
    detalhe: status === "atrasada" ? atrasoLabel(-dias) : parcela.detalhe,
  };
}

/** Busca de cliente: nome sem acento ou CPF a partir de 3 dígitos. */
export function clienteCombina(cliente: { nome: string; cpf?: string }, busca: string): boolean {
  const termo = normalizeSearch(busca);
  if (termo === "") return true;
  if (normalizeSearch(cliente.nome).includes(termo)) return true;

  const digitos = onlyDigits(busca);
  return digitos.length >= 3 && cliente.cpf !== undefined && onlyDigits(cliente.cpf).includes(digitos);
}
