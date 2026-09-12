import "server-only";

import { eq } from "drizzle-orm";
import * as z from "zod";
import { usuarios } from "@/lib/db/schema";
import { definirOperacao } from "./base";
import { textoOpcional } from "./campos";

export const atualizarPerfil = definirOperacao({
  nome: "atualizarPerfil",
  descricao: "Troca o nome e o telefone de quem está usando o sistema. O e-mail muda pelo login, não por aqui.",
  tipo: "gravacao",
  entrada: z.object({
    nome: z.string({ error: "Escreva seu nome." }).trim().min(2, { error: "Escreva seu nome." }),
    telefone: textoOpcional(),
  }),
  saida: z.object({ nome: z.string() }),
  async executar(tx, ctx, { nome, telefone }) {
    const [atualizado] = await tx
      .update(usuarios)
      .set({ nome, telefone: telefone ?? null })
      .where(eq(usuarios.id, ctx.usuarioId))
      .returning({ nome: usuarios.nome });
    return atualizado;
  },
});

export const atualizarAvisos = definirOperacao({
  nome: "atualizarAvisos",
  descricao: "Liga ou desliga os avisos: parcelas que vencem hoje, parcelas atrasadas e resumo da semana.",
  tipo: "gravacao",
  entrada: z.object({
    vencimentos: z.boolean().describe("aviso de manhã com as parcelas que vencem no dia"),
    atrasos: z.boolean().describe("aviso quando uma parcela passa do vencimento"),
    resumo: z.boolean().describe("resumo toda segunda"),
  }),
  saida: z.object({ vencimentos: z.boolean(), atrasos: z.boolean(), resumo: z.boolean() }),
  async executar(tx, ctx, avisos) {
    await tx.update(usuarios).set({ avisos }).where(eq(usuarios.id, ctx.usuarioId));
    return avisos;
  },
});
