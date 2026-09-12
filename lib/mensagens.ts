import type { Contrato, Parcela, Recibo } from "./dados";
import { rotuloFrequencia } from "./contrato";
import { atrasoLabel } from "./emprestimos";
import { diasAte, formatBRL, formatShortDate, onlyDigits } from "./format";
import { fillTemplate } from "./template";

/*
 * Os textos prontos de cobrança. Ficam aqui, longe das telas, porque um dia viram
 * os modelos editáveis de /ajustes/mensagens.
 */

export type Modelo = "lembrete" | "hoje" | "atraso" | "agradecimento" | "contrato";

export const MODELOS: Record<Modelo, string> = {
  lembrete: "Oi, {nome}! Passando para lembrar que a parcela {parcela} do contrato {contrato}, de {valor}, vence {vencimento}. Qualquer coisa, é só me chamar.",
  hoje: "Oi, {nome}! A parcela {parcela} do contrato {contrato}, de {valor}, vence hoje. Quando puder pagar, me manda o comprovante.",
  atraso: "Oi, {nome}! A parcela {parcela} do contrato {contrato}, de {valor}, venceu em {vencimento} e está {atraso}. Consegue acertar hoje?",
  agradecimento: "Recebido, {nome}! Obrigado pelo pagamento de {valor} da parcela {parcela}. Já dei baixa aqui no contrato {contrato}.",
  contrato: "Oi, {nome}! Segue o resumo do contrato {contrato}: {total} em {parcelas}x de {valorParcela}, {frequencia}, primeira em {vencimento}. Qualquer dúvida, me chama.",
};

export type Mensagem = {
  template: string;
  valores: Readonly<Record<string, string>>;
  telefone?: string;
};

/** O texto certo para o momento da parcela: atraso, vence hoje ou lembrete. */
export function cobrancaDaParcela(parcela: Parcela, agora: Date): Mensagem {
  const dias = diasAte(parcela.vencimento, agora);
  const modelo: Modelo = parcela.pago ? "agradecimento" : dias < 0 ? "atraso" : dias === 0 ? "hoje" : "lembrete";

  return {
    template: MODELOS[modelo],
    valores: {
      nome: parcela.cliente.split(" ")[0],
      valor: formatBRL(parcela.valor),
      parcela: `${parcela.parcela.numero} de ${parcela.parcela.total}`,
      contrato: parcela.contrato,
      vencimento: dias === 1 ? "amanhã" : formatShortDate(parcela.vencimento),
      atraso: dias < 0 ? atrasoLabel(-dias) : "em dia",
    },
    telefone: parcela.telefone,
  };
}

/** Resumo do contrato para mandar ao cliente na hora que ele é fechado. */
export function resumoDoContrato(contrato: Contrato, primeiraParcela: number): Mensagem {
  return {
    template: MODELOS.contrato,
    valores: {
      nome: contrato.cliente.split(" ")[0],
      contrato: contrato.numero,
      total: formatBRL(contrato.valor),
      parcelas: String(contrato.totalParcelas),
      valorParcela: formatBRL(primeiraParcela),
      frequencia: rotuloFrequencia[contrato.frequencia],
      vencimento: formatShortDate(contrato.primeiroVencimento),
    },
    telefone: contrato.telefone,
  };
}

/** Aviso de que o pagamento entrou, para mandar logo depois da baixa. */
export function avisoDeRecebimento(recibo: Recibo, telefone?: string): Mensagem {
  return {
    template: MODELOS.agradecimento,
    valores: {
      nome: recibo.cliente.split(" ")[0],
      valor: formatBRL(recibo.valor),
      parcela: `${recibo.parcela.numero} de ${recibo.parcela.total}`,
      contrato: recibo.numeroContrato,
    },
    telefone,
  };
}

/** O texto já montado, do jeito que vai para o WhatsApp ou para a área de transferência. */
export function textoDaMensagem({ template, valores }: Mensagem): string {
  return fillTemplate(template, valores);
}

/**
 * Link do WhatsApp com a mensagem pronta. Sem telefone não dá para abrir a conversa certa,
 * então a tela oferece só o copiar.
 */
export function linkWhatsApp(mensagem: Mensagem): string | undefined {
  const digitos = onlyDigits(mensagem.telefone ?? "");
  if (digitos.length < 10) return undefined;
  const numero = digitos.length <= 11 ? `55${digitos}` : digitos;
  return `https://wa.me/${numero}?text=${encodeURIComponent(textoDaMensagem(mensagem))}`;
}
