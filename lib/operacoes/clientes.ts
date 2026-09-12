import "server-only";

import { and, eq } from "drizzle-orm";
import * as z from "zod";
import { clientes } from "@/lib/db/schema";
import { definirOperacao, falhar } from "./base";
import { cpf, id, textoOpcional } from "./campos";

const dadosCliente = z.object({
  nome: z.string({ error: "Escreva o nome do cliente." }).trim().min(2, { error: "Escreva o nome do cliente." }),
  apelido: textoOpcional().describe("como o cliente é chamado no dia a dia, se for diferente do nome"),
  cpf: cpf(),
  telefone: textoOpcional(),
  email: textoOpcional(),
  endereco: textoOpcional(),
  score: z
    .int({ error: "O score vai de 0 a 100." })
    .min(0, { error: "O score vai de 0 a 100." })
    .max(100, { error: "O score vai de 0 a 100." })
    .optional()
    .describe("nota de confiança de 0 a 100"),
});

const clienteGravado = z.object({ id: z.uuid(), nome: z.string() });

export const cadastrarCliente = definirOperacao({
  nome: "cadastrarCliente",
  descricao: "Cadastra um cliente novo. Antes, use buscarClientes para não duplicar alguém que já existe.",
  tipo: "gravacao",
  entrada: dadosCliente,
  saida: clienteGravado,
  async executar(tx, ctx, dados) {
    const [novo] = await tx
      .insert(clientes)
      .values({ ...dados, contaId: ctx.contaId })
      .returning({ id: clientes.id, nome: clientes.nome });
    return novo;
  },
});

export const editarCliente = definirOperacao({
  nome: "editarCliente",
  descricao: "Troca os dados de um cliente. Campos não enviados ficam vazios, então mande o cadastro inteiro.",
  tipo: "gravacao",
  entrada: dadosCliente.extend({ id: id("Esse cliente não existe mais.").describe("id do cliente") }),
  saida: clienteGravado,
  async executar(tx, ctx, { id: clienteId, ...dados }) {
    const [atualizado] = await tx
      .update(clientes)
      .set({
        nome: dados.nome,
        apelido: dados.apelido ?? null,
        cpf: dados.cpf ?? null,
        telefone: dados.telefone ?? null,
        email: dados.email ?? null,
        endereco: dados.endereco ?? null,
        score: dados.score ?? null,
      })
      .where(and(eq(clientes.contaId, ctx.contaId), eq(clientes.id, clienteId)))
      .returning({ id: clientes.id, nome: clientes.nome });
    if (!atualizado) falhar("_", "Esse cliente não existe mais. Volte e abra de novo.");
    return atualizado;
  },
});

export const excluirCliente = definirOperacao({
  nome: "excluirCliente",
  descricao: "Apaga o cliente e, junto, todos os contratos, parcelas e recebimentos dele. Não dá para desfazer.",
  tipo: "perigosa",
  entrada: z.object({ id: id("Esse cliente não existe mais.").describe("id do cliente") }),
  saida: z.object({ id: z.uuid() }),
  async executar(tx, ctx, { id: clienteId }) {
    const [apagado] = await tx
      .delete(clientes)
      .where(and(eq(clientes.contaId, ctx.contaId), eq(clientes.id, clienteId)))
      .returning({ id: clientes.id });
    if (!apagado) falhar("_", "Esse cliente já não existe.");
    return apagado;
  },
});
