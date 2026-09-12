import "server-only";

import { and, asc, eq, gt } from "drizzle-orm";
import * as z from "zod";
import { arredondar, vencimentoDe } from "@/lib/contrato";
import { contratos, parcelas, recebimentos } from "@/lib/db/schema";
import { formatBRL, formatShortDate } from "@/lib/format";
import { definirOperacao, falhar } from "./base";
import { canal, dia, dinheiro, forma, id, textoOpcional } from "./campos";

const rotuloCanal = {
  pix: "recebida via Pix",
  dinheiro: "recebida em dinheiro",
  transferencia: "recebida por transferência",
  cartao: "recebida no cartão",
} as const;

export const receberParcela = definirOperacao({
  nome: "receberParcela",
  descricao:
    "Dá baixa num pagamento da parcela e gera o comprovante. A forma diz o que o pagamento cobre: a parcela, só os juros, uma parte ou o contrato inteiro.",
  tipo: "gravacao",
  entrada: z.object({
    parcelaId: id("Essa parcela não existe mais. Volte e abra de novo.").describe("id da parcela"),
    valor: dinheiro("Diga quanto você recebeu.").describe("quanto entrou, em reais"),
    forma: forma.default("parcela"),
    canal: canal.default("pix"),
    data: dia("Escolha o dia do recebimento.").describe("dia em que o dinheiro entrou"),
  }),
  saida: z.object({ reciboId: z.uuid().describe("id do comprovante") }),
  async executar(tx, ctx, { parcelaId, valor, forma: tipo, canal: meio, data }) {
    const [parcela] = await tx
      .select()
      .from(parcelas)
      .where(and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.id, parcelaId)));
    if (!parcela) falhar("valor", "Essa parcela não existe mais. Volte e abra de novo.");
    if (parcela.pago) falhar("valor", "Essa parcela já foi paga.");

    const [contrato] = await tx
      .select({ frequencia: contratos.frequencia })
      .from(contratos)
      .where(and(eq(contratos.contaId, ctx.contaId), eq(contratos.id, parcela.contratoId)));

    const [recibo] = await tx
      .insert(recebimentos)
      .values({
        contaId: ctx.contaId,
        contratoId: parcela.contratoId,
        parcelaNumero: parcela.numero,
        valor,
        forma: tipo,
        canal: meio,
        data,
      })
      .returning({ id: recebimentos.id });

    const quitada = {
      pago: true,
      pagoEm: data,
      detalhe: rotuloCanal[meio],
      recebimentoId: recibo.id,
    };
    const daParcela = and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.id, parcela.id));

    if (tipo === "quitacao") {
      // Tudo o que falta entra de uma vez: cada parcela aberta fica paga pelo próprio valor.
      const abertas = await tx
        .select({ id: parcelas.id, valor: parcelas.valor })
        .from(parcelas)
        .where(
          and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.contratoId, parcela.contratoId), eq(parcelas.pago, false)),
        );
      for (const aberta of abertas) {
        await tx
          .update(parcelas)
          .set({ ...quitada, valorRecebido: aberta.valor })
          .where(and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.id, aberta.id)));
      }
    } else if (tipo === "juros") {
      // A dívida continua de pé: a parcela só anda para o próximo vencimento.
      await tx
        .update(parcelas)
        .set({
          vencimento: vencimentoDe(parcela.vencimento, 1, contrato.frequencia),
          observacao: `Só os juros em ${formatShortDate(data)}: ${formatBRL(valor)}`,
        })
        .where(daParcela);
    } else if (tipo === "parcial") {
      if (valor >= parcela.valor) {
        const sobra = arredondar(valor - parcela.valor);
        await tx
          .update(parcelas)
          .set({ ...quitada, valorRecebido: parcela.valor })
          .where(daParcela);

        const [proxima] = await tx
          .select({ id: parcelas.id, valor: parcelas.valor })
          .from(parcelas)
          .where(
            and(
              eq(parcelas.contaId, ctx.contaId),
              eq(parcelas.contratoId, parcela.contratoId),
              eq(parcelas.pago, false),
              gt(parcelas.numero, parcela.numero),
            ),
          )
          .orderBy(asc(parcelas.numero))
          .limit(1);
        if (proxima && sobra > 0) {
          await tx
            .update(parcelas)
            .set({ valor: arredondar(Math.max(proxima.valor - sobra, 0)) })
            .where(and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.id, proxima.id)));
        }
      } else {
        await tx
          .update(parcelas)
          .set({
            valor: arredondar(parcela.valor - valor),
            vencimento: vencimentoDe(parcela.vencimento, 1, contrato.frequencia),
            observacao: `Abatimento de ${formatBRL(valor)} em ${formatShortDate(data)}`,
          })
          .where(daParcela);
      }
    } else {
      await tx
        .update(parcelas)
        .set({ ...quitada, valorRecebido: valor })
        .where(daParcela);
    }

    return { reciboId: recibo.id };
  },
});

export const renegociarParcela = definirOperacao({
  nome: "renegociarParcela",
  descricao: "Muda o valor e o vencimento de uma parcela em aberto, com o combinado anotado.",
  tipo: "gravacao",
  entrada: z.object({
    parcelaId: id("Essa parcela não existe mais. Volte e abra de novo.").describe("id da parcela"),
    valor: dinheiro("Diga o novo valor da parcela.").describe("novo valor da parcela, em reais"),
    vencimento: dia("Escolha a nova data de vencimento."),
    observacao: textoOpcional().describe("o que foi combinado com o cliente"),
  }),
  saida: z.object({ parcelaId: z.uuid(), contratoId: z.uuid() }),
  async executar(tx, ctx, { parcelaId, valor, vencimento, observacao }) {
    const [atual] = await tx
      .select({ pago: parcelas.pago })
      .from(parcelas)
      .where(and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.id, parcelaId)));
    if (!atual) falhar("valor", "Essa parcela não existe mais. Volte e abra de novo.");
    if (atual.pago) falhar("valor", "Essa parcela já foi paga. Não dá para renegociar.");

    const [atualizada] = await tx
      .update(parcelas)
      .set({ valor: arredondar(valor), vencimento, observacao: observacao ?? null, renegociada: true })
      .where(and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.id, parcelaId)))
      .returning({ parcelaId: parcelas.id, contratoId: parcelas.contratoId });
    return atualizada;
  },
});
