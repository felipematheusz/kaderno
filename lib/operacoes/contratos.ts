import "server-only";

import { and, asc, eq, sql } from "drizzle-orm";
import * as z from "zod";
import { arredondar, gerarParcelas, rotuloNumeroContrato, simular, vencimentoDe } from "@/lib/contrato";
import type { Tx } from "@/lib/db/conexao";
import { clientes, contas, contratos, parcelas } from "@/lib/db/schema";
import { definirOperacao, falhar, type Contexto } from "./base";
import { canal, dia, dinheiro, frequencia, id, jurosSobre, textoOpcional, tipoContrato } from "./campos";

const ERRO_PARCELAS = "De 1 a 360 parcelas.";
const ERRO_TAXA = "A taxa vai de 0 a 100%.";

const montagem = z.object({
  principal: dinheiro("Diga quanto foi emprestado.").describe("valor emprestado ou preço da venda, em reais"),
  taxa: z
    .number({ error: ERRO_TAXA })
    .min(0, { error: ERRO_TAXA })
    .max(100, { error: ERRO_TAXA })
    .describe("juros em % ao mês; 0 para valor fixo sem juros"),
  jurosSobre: jurosSobre.default("total"),
  parcelas: z
    .int({ error: ERRO_PARCELAS })
    .min(1, { error: ERRO_PARCELAS })
    .max(360, { error: ERRO_PARCELAS })
    .describe("quantidade de parcelas"),
  entrada: z.number().min(0).optional().describe("venda: parte paga na hora, fora do parcelamento"),
  custo: z.number().min(0).optional().describe("venda: quanto o produto custou para o dono; só entra no lucro"),
});

const repasse = z
  .object({ data: dia("Escolha o dia em que o dinheiro foi enviado."), canal })
  .describe("registro de quando e como o dinheiro foi enviado ao cliente; nada é transferido de verdade");

const camposContrato = montagem.extend({
  clienteId: id("Escolha o cliente do contrato.").describe("id do cliente; use buscarClientes para achar pelo nome"),
  tipo: tipoContrato.default("emprestimo"),
  produto: textoOpcional().describe("venda: o que foi vendido"),
  frequencia: frequencia.default("mensal"),
  primeiroVencimento: dia("Escolha a data da primeira parcela.").describe("vencimento da primeira parcela"),
  jurosEmAtraso: z.boolean().default(false).describe("se cobra 1% ao dia depois do vencimento (só fica registrado)"),
  observacao: textoOpcional(),
  repasse: repasse.optional(),
});

function vendaPrecisaDeProduto(dados: { tipo: "emprestimo" | "venda"; produto?: string }, ctx: z.RefinementCtx) {
  if (dados.tipo === "venda" && dados.produto === undefined) {
    ctx.addIssue({ code: "custom", path: ["produto"], message: "Diga o que foi vendido." });
  }
}

const contratoGravado = z.object({ id: z.uuid(), numero: z.string().describe('número para mostrar: "#0042"') });

export const simularContrato = definirOperacao({
  nome: "simularContrato",
  descricao: "Calcula parcela, total, juros e lucro de um contrato sem gravar nada. Use antes de criar para mostrar o resumo.",
  tipo: "leitura",
  entrada: montagem.extend({
    primeiroVencimento: dia("Escolha a data da primeira parcela.").optional(),
    frequencia: frequencia.default("mensal"),
  }),
  saida: z.object({
    total: z.number(),
    valorParcela: z.number(),
    juros: z.number(),
    lucro: z.number(),
    parcelas: z
      .array(z.object({ numero: z.int(), vencimento: z.string(), valor: z.number() }))
      .describe("vazio quando não informa o primeiro vencimento"),
  }),
  async executar(_tx, _ctx, dados) {
    const conta = simular(dados);
    const lista = dados.primeiroVencimento ? gerarParcelas(dados, dados.primeiroVencimento, dados.frequencia) : [];
    return { ...conta, parcelas: lista };
  },
});

async function garantirCliente(tx: Tx, ctx: Contexto, clienteId: string) {
  const [cliente] = await tx
    .select({ id: clientes.id })
    .from(clientes)
    .where(and(eq(clientes.contaId, ctx.contaId), eq(clientes.id, clienteId)));
  if (!cliente) falhar("clienteId", "Esse cliente não existe mais. Escolha outro.");
}

export const criarContrato = definirOperacao({
  nome: "criarContrato",
  descricao:
    "Cria um contrato de empréstimo ou venda parcelada e gera as parcelas. Pode registrar junto o envio do dinheiro (repasse).",
  tipo: "gravacao",
  entrada: camposContrato.superRefine(vendaPrecisaDeProduto),
  saida: contratoGravado,
  async executar(tx, ctx, dados) {
    await garantirCliente(tx, ctx, dados.clienteId);

    const [conta] = await tx
      .update(contas)
      .set({ proximoNumeroContrato: sql`${contas.proximoNumeroContrato} + 1` })
      .where(eq(contas.id, ctx.contaId))
      .returning({ proximo: contas.proximoNumeroContrato });
    const numero = conta.proximo - 1;

    const [novo] = await tx
      .insert(contratos)
      .values({
        contaId: ctx.contaId,
        numero,
        clienteId: dados.clienteId,
        tipo: dados.tipo,
        produto: dados.tipo === "venda" ? dados.produto : undefined,
        custo: dados.tipo === "venda" ? dados.custo : undefined,
        entrada: dados.tipo === "venda" ? dados.entrada : undefined,
        principal: dados.principal,
        taxa: dados.taxa,
        jurosSobre: dados.jurosSobre,
        frequencia: dados.frequencia,
        jurosEmAtraso: dados.jurosEmAtraso,
        observacao: dados.observacao,
        repassadoEm: dados.repasse?.data,
        canalRepasse: dados.repasse?.canal,
      })
      .returning({ id: contratos.id });

    await tx.insert(parcelas).values(
      gerarParcelas(dados, dados.primeiroVencimento, dados.frequencia).map((p) => ({
        contaId: ctx.contaId,
        contratoId: novo.id,
        numero: p.numero,
        vencimento: p.vencimento,
        valor: p.valor,
      })),
    );

    return { id: novo.id, numero: rotuloNumeroContrato(numero) };
  },
});

export const editarContrato = definirOperacao({
  nome: "editarContrato",
  descricao:
    "Muda um contrato. As parcelas já pagas ficam como estão; o que falta receber é recalculado e dividido nas parcelas que sobram.",
  tipo: "gravacao",
  entrada: camposContrato
    .extend({ id: id("Esse contrato não existe mais.").describe("id do contrato") })
    .superRefine(vendaPrecisaDeProduto),
  saida: contratoGravado,
  async executar(tx, ctx, { id: contratoId, parcelas: quantas, primeiroVencimento, repasse: envio, ...dados }) {
    await garantirCliente(tx, ctx, dados.clienteId);
    const venda = dados.tipo === "venda";

    const [atualizado] = await tx
      .update(contratos)
      .set({
        clienteId: dados.clienteId,
        tipo: dados.tipo,
        produto: venda ? (dados.produto ?? null) : null,
        custo: venda ? (dados.custo ?? null) : null,
        entrada: venda ? (dados.entrada ?? null) : null,
        principal: dados.principal,
        taxa: dados.taxa,
        jurosSobre: dados.jurosSobre,
        frequencia: dados.frequencia,
        jurosEmAtraso: dados.jurosEmAtraso,
        observacao: dados.observacao ?? null,
        ...(envio ? { repassadoEm: envio.data, canalRepasse: envio.canal } : {}),
      })
      .where(and(eq(contratos.contaId, ctx.contaId), eq(contratos.id, contratoId)))
      .returning({ id: contratos.id, numero: contratos.numero });
    if (!atualizado) falhar("_", "Esse contrato não existe mais. Volte e abra de novo.");

    const pagas = await tx
      .select({ valor: parcelas.valor })
      .from(parcelas)
      .where(and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.contratoId, contratoId), eq(parcelas.pago, true)))
      .orderBy(asc(parcelas.numero));

    await tx
      .delete(parcelas)
      .where(and(eq(parcelas.contaId, ctx.contaId), eq(parcelas.contratoId, contratoId), eq(parcelas.pago, false)));

    const abertas = Math.max(quantas - pagas.length, 0);
    if (abertas > 0) {
      const { total } = simular({ ...dados, parcelas: quantas });
      const recebido = pagas.reduce((soma, p) => soma + p.valor, 0);
      const restante = arredondar(Math.max(total - recebido, 0));
      const porParcela = arredondar(restante / abertas);

      await tx.insert(parcelas).values(
        Array.from({ length: abertas }, (_, i) => {
          const numero = pagas.length + i + 1;
          return {
            contaId: ctx.contaId,
            contratoId,
            numero,
            vencimento: vencimentoDe(primeiroVencimento, numero - 1, dados.frequencia),
            valor: i === abertas - 1 ? arredondar(restante - porParcela * (abertas - 1)) : porParcela,
          };
        }),
      );
    }

    return { id: atualizado.id, numero: rotuloNumeroContrato(atualizado.numero) };
  },
});

export const registrarRepasse = definirOperacao({
  nome: "registrarRepasse",
  descricao:
    "Registra que o dinheiro do contrato foi enviado ao cliente (quando e como). É só anotação: nenhum dinheiro é transferido.",
  tipo: "gravacao",
  entrada: z.object({ contratoId: id("Esse contrato não existe mais.").describe("id do contrato") }).extend(repasse.shape),
  saida: contratoGravado,
  async executar(tx, ctx, { contratoId, data, canal: meio }) {
    const [atualizado] = await tx
      .update(contratos)
      .set({ repassadoEm: data, canalRepasse: meio })
      .where(and(eq(contratos.contaId, ctx.contaId), eq(contratos.id, contratoId)))
      .returning({ id: contratos.id, numero: contratos.numero });
    if (!atualizado) falhar("_", "Esse contrato não existe mais.");
    return { id: atualizado.id, numero: rotuloNumeroContrato(atualizado.numero) };
  },
});

export const excluirContrato = definirOperacao({
  nome: "excluirContrato",
  descricao: "Apaga o contrato com todas as parcelas e recebimentos. Não dá para desfazer.",
  tipo: "perigosa",
  entrada: z.object({ id: id("Esse contrato não existe mais.").describe("id do contrato") }),
  saida: z.object({ id: z.uuid() }),
  async executar(tx, ctx, { id: contratoId }) {
    const [apagado] = await tx
      .delete(contratos)
      .where(and(eq(contratos.contaId, ctx.contaId), eq(contratos.id, contratoId)))
      .returning({ id: contratos.id });
    if (!apagado) falhar("_", "Esse contrato já não existe.");
    return apagado;
  },
});
