import "server-only";

import { and, eq } from "drizzle-orm";
import * as z from "zod";
import { comConta, type Tx } from "@/lib/db/conexao";
import { eventos, idempotencia } from "@/lib/db/schema";

/*
 * Toda ação do sistema (ler ou gravar) é uma operação. É o que o app web chama hoje e o que
 * vira ferramenta da IA amanhã, sem reescrever regra. Cada operação declara:
 *
 * - nome e descrição em português (a IA lê a descrição para escolher a ferramenta);
 * - tipo: leitura roda direto; gravação e perigosa, no bot, passam por confirmação;
 * - entrada e saída em zod, com descrição nos campos (vira JSON Schema);
 * - a função, que recebe a transação já presa à conta.
 *
 * Conta e usuário nunca fazem parte da entrada: vêm do servidor, no Contexto.
 */

z.config(z.locales.ptBR());

export type Origem = "web" | "whatsapp" | "ia" | "sistema";

export type Contexto = { contaId: string; usuarioId: string; origem: Origem };

export type TipoOperacao = "leitura" | "gravacao" | "perigosa";

/** Mensagem por campo. `_` é o erro que não pertence a um campo só. */
export type Erros = Readonly<Record<string, string>>;

export type Resultado<T> = { ok: true; dados: T } | { ok: false; erros: Erros };

export type Operacao<E extends z.ZodType, S extends z.ZodType> = {
  nome: string;
  descricao: string;
  tipo: TipoOperacao;
  entrada: E;
  saida: S;
  executar: (tx: Tx, ctx: Contexto, entrada: z.output<E>) => Promise<z.output<S>>;
};

export function definirOperacao<E extends z.ZodType, S extends z.ZodType>(operacao: Operacao<E, S>): Operacao<E, S> {
  return operacao;
}

/** Erro de regra de negócio: desfaz a transação e volta como mensagem, não como exceção. */
export class ErroDeNegocio extends Error {
  constructor(readonly erros: Erros) {
    super(Object.values(erros)[0] ?? "Não deu para concluir.");
  }
}

export function falhar(campo: string, mensagem: string): never {
  throw new ErroDeNegocio({ [campo]: mensagem });
}

function errosDoZod(erro: z.ZodError): Erros {
  const erros: Record<string, string> = {};
  for (const issue of erro.issues) {
    const campo = issue.path.length === 0 ? "_" : issue.path.map(String).join(".");
    erros[campo] ??= issue.message;
  }
  return erros;
}

export type OpcoesExecucao = {
  /** Mesma chave, mesmo resultado: o pedido repetido não grava de novo. */
  chave?: string;
};

/**
 * Roda a operação presa à conta do contexto. A entrada chega como veio (formulário, JSON da IA)
 * e só passa a valer depois de conferida pelo schema da operação.
 */
export async function executar<E extends z.ZodType, S extends z.ZodType>(
  operacao: Operacao<E, S>,
  ctx: Contexto,
  entrada: unknown,
  opcoes: OpcoesExecucao = {},
): Promise<Resultado<z.output<S>>> {
  const lida = operacao.entrada.safeParse(entrada);
  if (!lida.success) return { ok: false, erros: errosDoZod(lida.error) };

  const grava = operacao.tipo !== "leitura";

  try {
    const dados = await comConta(ctx, async (tx) => {
      if (grava && opcoes.chave) {
        const [anterior] = await tx
          .select({ resultado: idempotencia.resultado })
          .from(idempotencia)
          .where(and(eq(idempotencia.contaId, ctx.contaId), eq(idempotencia.chave, opcoes.chave)));
        if (anterior) return anterior.resultado as z.output<S>;
      }

      const saida = await operacao.executar(tx, ctx, lida.data);

      if (grava) {
        await tx.insert(eventos).values({
          contaId: ctx.contaId,
          usuarioId: ctx.usuarioId,
          origem: ctx.origem,
          operacao: operacao.nome,
          entrada: lida.data,
          resultado: saida ?? null,
        });
        if (opcoes.chave) {
          await tx.insert(idempotencia).values({
            contaId: ctx.contaId,
            chave: opcoes.chave,
            operacao: operacao.nome,
            resultado: saida ?? null,
          });
        }
      }

      return saida;
    });

    return { ok: true, dados };
  } catch (erro) {
    if (erro instanceof ErroDeNegocio) return { ok: false, erros: erro.erros };
    throw erro;
  }
}
