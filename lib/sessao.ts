import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import type * as z from "zod";
import { contaDoUsuario } from "@/lib/db/conexao";
import { executar, type Contexto, type Operacao, type Resultado } from "@/lib/operacoes/base";
import { supabaseServidor } from "@/lib/supabase/servidor";

/*
 * A ponte entre o app web e as operações: descobre quem está logado e de qual conta,
 * e chama a operação com esse contexto. Checado a cada pedido, não só no proxy.
 */

const claimsDoLogin = cache(async () => {
  const supabase = await supabaseServidor();
  const { data } = await supabase.auth.getClaims();
  return data?.claims;
});

export const contextoWeb = cache(async (): Promise<Contexto> => {
  const usuarioId = (await claimsDoLogin())?.sub;
  if (!usuarioId) redirect("/entrar");

  const contaId = await contaDoUsuario(usuarioId);
  if (!contaId) redirect("/entrar?erro=sem-conta");

  return { contaId, usuarioId, origem: "web" };
});

/** O e-mail do login, que é a fonte certa (muda só depois de confirmado pelo link). */
export async function emailDoLogin(): Promise<string | undefined> {
  return (await claimsDoLogin())?.email;
}

/** Leitura para tela: se falhar, é defeito, não erro de preenchimento. */
export async function consultar<E extends z.ZodType, S extends z.ZodType>(
  operacao: Operacao<E, S>,
  entrada: z.input<E>,
): Promise<z.output<S>> {
  const resultado = await executar(operacao, await contextoWeb(), entrada);
  if (!resultado.ok) throw new Error(`${operacao.nome}: ${Object.values(resultado.erros).join(" ")}`);
  return resultado.dados;
}

/** Gravação vinda de formulário: a entrada é conferida pelo schema da operação. */
export async function gravar<E extends z.ZodType, S extends z.ZodType>(
  operacao: Operacao<E, S>,
  entrada: unknown,
  chave?: string,
): Promise<Resultado<z.output<S>>> {
  return executar(operacao, await contextoWeb(), entrada, { chave });
}
