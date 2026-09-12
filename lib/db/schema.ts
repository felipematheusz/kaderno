import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  jsonb,
  numeric,
  pgPolicy,
  pgRole,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * O banco do Kaderno. Multi-tenant: todo dado de negócio pertence a uma conta (`conta_id`).
 *
 * Quem separa as contas é o próprio banco. O app conecta como `postgres`, mas cada operação
 * roda dentro de uma transação que troca para o papel `kaderno_app` (sem BYPASSRLS) e grava
 * a conta em `app.conta_id`. As políticas abaixo só deixam passar linha dessa conta.
 * Veja lib/db/conexao.ts.
 */

export const kadernoApp = pgRole("kaderno_app");

const contaAtual = sql`conta_id = privado.conta_atual()`;

/** A mesma política para toda tabela de dados da conta: lê e grava só o que é dela. */
function daConta(tabela: string) {
  return pgPolicy(`${tabela}: só a conta atual`, {
    for: "all",
    to: kadernoApp,
    using: contaAtual,
    withCheck: contaAtual,
  });
}

const dinheiro = (nome?: string) =>
  nome ? numeric(nome, { precision: 12, scale: 2, mode: "number" }) : numeric({ precision: 12, scale: 2, mode: "number" });

/* ── Conta, pessoa e quem é de qual conta ───────────────────────────── */

export const contas = pgTable(
  "contas",
  {
    id: uuid().primaryKey().defaultRandom(),
    nome: text().notNull(),
    /** De onde sai o próximo número de contrato ("#0042"). */
    proximoNumeroContrato: integer().notNull().default(1),
    criadaEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("contas: só a conta atual", {
      for: "all",
      to: kadernoApp,
      using: sql`id = privado.conta_atual()`,
      withCheck: sql`id = privado.conta_atual()`,
    }),
  ],
).enableRLS();

export type Avisos = { vencimentos: boolean; atrasos: boolean; resumo: boolean };

export const usuarios = pgTable(
  "usuarios",
  {
    /** O mesmo id do usuário no Supabase Auth. */
    id: uuid().primaryKey(),
    nome: text().notNull(),
    email: text().notNull(),
    telefone: text(),
    avisos: jsonb().$type<Avisos>().notNull().default({ vencimentos: true, atrasos: true, resumo: false }),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  () => [
    pgPolicy("usuarios: só o próprio usuário", {
      for: "all",
      to: kadernoApp,
      using: sql`id = privado.usuario_atual()`,
      withCheck: sql`id = privado.usuario_atual()`,
    }),
  ],
).enableRLS();

export const membros = pgTable(
  "membros",
  {
    contaId: uuid()
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    usuarioId: uuid()
      .notNull()
      .references(() => usuarios.id, { onDelete: "cascade" }),
    papel: text({ enum: ["dono"] }).notNull(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    primaryKey({ columns: [t.contaId, t.usuarioId] }),
    index().on(t.usuarioId),
    check("membros_papel", sql`${t.papel} in ('dono')`),
    daConta("membros"),
  ],
).enableRLS();

/* ── Carteira ───────────────────────────────────────────────────────── */

export const clientes = pgTable(
  "clientes",
  {
    id: uuid().primaryKey().defaultRandom(),
    contaId: uuid()
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    nome: text().notNull(),
    apelido: text(),
    cpf: text(),
    telefone: text(),
    email: text(),
    endereco: text(),
    /** De 0 a 100. */
    score: smallint(),
    desde: date({ mode: "string" }).notNull().default(sql`current_date`),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.contaId, t.id),
    index().on(t.contaId, t.nome),
    check("clientes_score", sql`${t.score} between 0 and 100`),
    daConta("clientes"),
  ],
).enableRLS();

export const contratos = pgTable(
  "contratos",
  {
    id: uuid().primaryKey().defaultRandom(),
    contaId: uuid()
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    /** 42 vira "#0042" na tela. Único dentro da conta. */
    numero: integer().notNull(),
    clienteId: uuid().notNull(),
    tipo: text({ enum: ["emprestimo", "venda"] }).notNull(),
    produto: text(),
    custo: dinheiro(),
    entrada: dinheiro(),
    principal: dinheiro().notNull(),
    /** % ao mês. Zero é contrato de valor fixo. */
    taxa: numeric({ precision: 7, scale: 4, mode: "number" }).notNull(),
    jurosSobre: text({ enum: ["parcela", "total"] }).notNull(),
    frequencia: text({ enum: ["diaria", "semanal", "quinzenal", "mensal"] }).notNull(),
    jurosEmAtraso: boolean().notNull().default(false),
    observacao: text(),
    /** Dia em que o contrato foi fechado. */
    criadoEm: date({ mode: "string" }).notNull().default(sql`current_date`),
    /** Registro do envio do dinheiro ao cliente. Nada é transferido de verdade. */
    repassadoEm: date({ mode: "string" }),
    canalRepasse: text({ enum: ["pix", "dinheiro", "transferencia", "cartao"] }),
  },
  (t) => [
    unique().on(t.contaId, t.id),
    unique().on(t.contaId, t.numero),
    index().on(t.contaId, t.clienteId),
    foreignKey({ columns: [t.contaId, t.clienteId], foreignColumns: [clientes.contaId, clientes.id] }).onDelete("cascade"),
    check("contratos_tipo", sql`${t.tipo} in ('emprestimo', 'venda')`),
    check("contratos_juros_sobre", sql`${t.jurosSobre} in ('parcela', 'total')`),
    check("contratos_frequencia", sql`${t.frequencia} in ('diaria', 'semanal', 'quinzenal', 'mensal')`),
    check("contratos_canal_repasse", sql`${t.canalRepasse} in ('pix', 'dinheiro', 'transferencia', 'cartao')`),
    check("contratos_valores", sql`${t.principal} > 0 and ${t.taxa} between 0 and 100`),
    daConta("contratos"),
  ],
).enableRLS();

export const recebimentos = pgTable(
  "recebimentos",
  {
    id: uuid().primaryKey().defaultRandom(),
    contaId: uuid()
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    contratoId: uuid().notNull(),
    /** Número da parcela que recebeu a baixa, guardado para o comprovante. */
    parcelaNumero: integer().notNull(),
    valor: dinheiro().notNull(),
    forma: text({ enum: ["parcela", "juros", "parcial", "quitacao"] }).notNull(),
    canal: text({ enum: ["pix", "dinheiro", "transferencia", "cartao"] }).notNull(),
    /** Dia informado no recebimento. */
    data: date({ mode: "string" }).notNull(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.contaId, t.id),
    index().on(t.contaId, t.data),
    index().on(t.contaId, t.contratoId),
    foreignKey({ columns: [t.contaId, t.contratoId], foreignColumns: [contratos.contaId, contratos.id] }).onDelete(
      "cascade",
    ),
    check("recebimentos_forma", sql`${t.forma} in ('parcela', 'juros', 'parcial', 'quitacao')`),
    check("recebimentos_canal", sql`${t.canal} in ('pix', 'dinheiro', 'transferencia', 'cartao')`),
    check("recebimentos_valor", sql`${t.valor} > 0`),
    daConta("recebimentos"),
  ],
).enableRLS();

export const parcelas = pgTable(
  "parcelas",
  {
    id: uuid().primaryKey().defaultRandom(),
    contaId: uuid()
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    contratoId: uuid().notNull(),
    numero: integer().notNull(),
    vencimento: date({ mode: "string" }).notNull(),
    valor: dinheiro().notNull(),
    pago: boolean().notNull().default(false),
    pagoEm: date({ mode: "string" }),
    valorRecebido: dinheiro(),
    /** Complemento da linha: "recebida via Pix". */
    detalhe: text(),
    /** Combinado da renegociação ou do pagamento parcial. */
    observacao: text(),
    renegociada: boolean().notNull().default(false),
    recebimentoId: uuid(),
  },
  (t) => [
    unique().on(t.contaId, t.contratoId, t.numero),
    index().on(t.contaId, t.vencimento),
    index().on(t.contaId, t.recebimentoId),
    foreignKey({ columns: [t.contaId, t.contratoId], foreignColumns: [contratos.contaId, contratos.id] }).onDelete(
      "cascade",
    ),
    foreignKey({ columns: [t.contaId, t.recebimentoId], foreignColumns: [recebimentos.contaId, recebimentos.id] }),
    check("parcelas_valor", sql`${t.valor} >= 0`),
    daConta("parcelas"),
  ],
).enableRLS();

/* ── Registro e proteção contra repetição ───────────────────────────── */

export const eventos = pgTable(
  "eventos",
  {
    id: bigint({ mode: "number" }).primaryKey().generatedAlwaysAsIdentity(),
    contaId: uuid()
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    usuarioId: uuid().references(() => usuarios.id, { onDelete: "set null" }),
    origem: text({ enum: ["web", "whatsapp", "ia", "sistema"] }).notNull(),
    /** Nome da operação: "criarContrato". */
    operacao: text().notNull(),
    /** O que a operação recebeu, já validado. */
    entrada: jsonb().notNull(),
    /** O que a operação devolveu. */
    resultado: jsonb(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index().on(t.contaId, t.criadoEm),
    index().on(t.usuarioId),
    check("eventos_origem", sql`${t.origem} in ('web', 'whatsapp', 'ia', 'sistema')`),
    daConta("eventos"),
  ],
).enableRLS();

export const idempotencia = pgTable(
  "idempotencia",
  {
    contaId: uuid()
      .notNull()
      .references(() => contas.id, { onDelete: "cascade" }),
    chave: text().notNull(),
    operacao: text().notNull(),
    resultado: jsonb().notNull(),
    criadoEm: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.contaId, t.chave] }), daConta("idempotencia")],
).enableRLS();
