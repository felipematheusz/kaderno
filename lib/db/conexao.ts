import "server-only";

import { eq, sql } from "drizzle-orm";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

/*
 * A única porta para o banco.
 *
 * `comConta` abre uma transação, troca para o papel `kaderno_app` (que obedece às políticas
 * de linha) e grava conta e usuário na transação. Tudo que roda ali dentro só enxerga a conta
 * informada, mesmo que alguém esqueça um filtro.
 *
 * `comSistema` roda sem esse filtro e existe só para o que acontece antes de saber a conta
 * (descobrir de qual conta é o usuário que acabou de entrar). Não use para dado de negócio.
 */

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está configurada.");

const global_ = globalThis as typeof globalThis & { __kadernoSql?: postgres.Sql };

// Transaction pooler do Supabase não aceita prepared statements.
// Guardado no globalThis para o `next dev` não abrir uma conexão nova a cada recarga.
const cliente = (global_.__kadernoSql ??= postgres(url, { prepare: false, max: 5 }));

const db = drizzle({ client: cliente, schema, casing: "snake_case" });

type Db = PostgresJsDatabase<typeof schema>;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

export type Escopo = { contaId: string; usuarioId: string };

export async function comConta<T>(escopo: Escopo, trabalho: (tx: Tx) => Promise<T>): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`
      select
        set_config('app.conta_id', ${escopo.contaId}, true),
        set_config('app.usuario_id', ${escopo.usuarioId}, true)
    `);
    await tx.execute(sql`set local role kaderno_app`);
    return trabalho(tx);
  });
}

/** De qual conta é o usuário. Hoje cada pessoa tem uma conta só, da qual é dona. */
export async function contaDoUsuario(usuarioId: string): Promise<string | undefined> {
  const [membro] = await db
    .select({ contaId: schema.membros.contaId })
    .from(schema.membros)
    .where(eq(schema.membros.usuarioId, usuarioId))
    .limit(1);
  return membro?.contaId;
}
