/*
 * Teste das operações contra o banco de verdade.
 *
 * Cria duas contas descartáveis (A e B) direto no Supabase Auth, roda as operações e confere:
 * - uma conta nunca lê nem grava dado da outra;
 * - criar contrato, receber parcela e quitar batem com as contas esperadas;
 * - a mesma chave de envio não grava duas vezes;
 * - toda operação vira ferramenta válida (JSON Schema) para IA.
 * No fim apaga tudo o que criou, mesmo se algum teste falhar.
 *
 * Rodar: pnpm testar:operacoes
 */

import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import postgres from "postgres";
import { executar, type Contexto, type Operacao, type Resultado } from "@/lib/operacoes/base";
import { cadastrarCliente, editarCliente, excluirCliente } from "@/lib/operacoes/clientes";
import { criarContrato, excluirContrato, registrarRepasse } from "@/lib/operacoes/contratos";
import { descreverOperacoes, OPERACOES } from "@/lib/operacoes/index";
import { historico, listarClientes, listarParcelas, painelDoDia, relatorio, verContrato } from "@/lib/operacoes/leituras";
import { receberParcela, renegociarParcela } from "@/lib/operacoes/parcelas";
import type * as z from "zod";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL não está no ambiente. Rode com --env-file=.env.local.");
const sql = postgres(url, { prepare: false, max: 1 });

let falhas = 0;

async function caso(nome: string, teste: () => Promise<void>): Promise<void> {
  try {
    await teste();
    console.log(`  ok   ${nome}`);
  } catch (erro) {
    falhas += 1;
    console.log(`  FALHOU ${nome}`);
    console.log(`         ${erro instanceof Error ? erro.message : String(erro)}`);
  }
}

function dados<T>(resultado: Resultado<T>): T {
  if (!resultado.ok) throw new Error(`esperava sucesso, veio erro: ${JSON.stringify(resultado.erros)}`);
  return resultado.dados;
}

async function rodar<E extends z.ZodType, S extends z.ZodType>(
  operacao: Operacao<E, S>,
  ctx: Contexto,
  entrada: unknown,
  chave?: string,
): Promise<Resultado<z.output<S>>> {
  return executar(operacao, ctx, entrada, { chave });
}

async function criarLogin(nome: string): Promise<Contexto> {
  const id = randomUUID();
  await sql`
    insert into auth.users (id, email, raw_user_meta_data, aud, role, created_at, updated_at)
    values (${id}, ${`teste-${id}@kaderno.invalid`}, ${sql.json({ nome })}, 'authenticated', 'authenticated', now(), now())
  `;
  const [membro] = await sql<{ conta_id: string }[]>`select conta_id from public.membros where usuario_id = ${id}`;
  assert.ok(membro, "o cadastro deveria criar a conta e o membro automaticamente");
  return { contaId: membro.conta_id, usuarioId: id, origem: "sistema" };
}

async function limpar(contextos: readonly Contexto[]): Promise<void> {
  for (const ctx of contextos) {
    await sql`delete from public.contas where id = ${ctx.contaId}`;
    await sql`delete from auth.users where id = ${ctx.usuarioId}`;
  }
}

async function main(): Promise<void> {
  const contextos: Contexto[] = [];

  try {
    console.log("\nCadastro");
    const a = await criarLogin("Conta A");
    const b = await criarLogin("Conta B");
    contextos.push(a, b);
    await caso("cada login novo ganha uma conta própria", async () => {
      assert.notEqual(a.contaId, b.contaId);
    });

    console.log("\nCarteira da conta A");
    const cliente = dados(await rodar(cadastrarCliente, a, { nome: "João da Silva", apelido: "Zé", cpf: "123.456.789-00" }));

    await caso("CPF é guardado só com dígitos e busca acha pelo apelido sem acento", async () => {
      const achados = dados(await rodar(listarClientes, a, { busca: "ze" }));
      assert.equal(achados.length, 1);
      assert.equal(achados[0].cpf, "12345678900");
    });

    await caso("erro de preenchimento volta como mensagem no campo", async () => {
      const resultado = await rodar(cadastrarCliente, a, { nome: "J", cpf: "123" });
      assert.equal(resultado.ok, false);
      if (resultado.ok) return;
      assert.equal(resultado.erros.nome, "Escreva o nome do cliente.");
      assert.equal(resultado.erros.cpf, "CPF tem 11 dígitos. Confira o que você digitou.");
    });

    const chave = randomUUID();
    const entradaContrato = {
      clienteId: cliente.id,
      principal: 1000,
      taxa: 10,
      jurosSobre: "total",
      parcelas: 3,
      frequencia: "mensal",
      primeiroVencimento: "2026-01-10",
      repasse: { data: "2025-12-10", canal: "pix" },
    };
    const contrato = dados(await rodar(criarContrato, a, entradaContrato, chave));

    await caso("contrato ganha número #0001 e três parcelas que somam 1.100", async () => {
      assert.equal(contrato.numero, "#0001");
      const visto = dados(await rodar(verContrato, a, { referencia: "#1" }));
      assert.ok(visto);
      assert.equal(visto.parcelas.length, 3);
      assert.equal(visto.contrato.valor, 1100);
      assert.deepEqual(
        visto.parcelas.map((p) => p.valor),
        [366.67, 366.67, 366.66],
      );
      assert.equal(visto.contrato.repassadoEm, "2025-12-10");
    });

    await caso("mesma chave de envio não cria contrato de novo", async () => {
      const repetido = dados(await rodar(criarContrato, a, entradaContrato, chave));
      assert.equal(repetido.id, contrato.id);
      const [{ total }] = await sql<{ total: number }[]>`
        select count(*)::int as total from public.contratos where conta_id = ${a.contaId}`;
      assert.equal(total, 1);
    });

    await caso("venda sem produto é recusada", async () => {
      const resultado = await rodar(criarContrato, a, { ...entradaContrato, tipo: "venda" });
      assert.equal(resultado.ok, false);
      if (!resultado.ok) assert.equal(resultado.erros.produto, "Diga o que foi vendido.");
    });

    const visto = dados(await rodar(verContrato, a, { referencia: contrato.id }));
    assert.ok(visto);
    const [primeira, segunda] = visto.parcelas;

    await caso("receber a parcela 1 dá baixa e gera comprovante", async () => {
      const { reciboId } = dados(
        await rodar(receberParcela, a, { parcelaId: primeira.id, valor: 366.67, data: "2026-01-10" }),
      );
      const pagas = dados(await rodar(listarParcelas, a, { situacao: "pagas" }));
      assert.equal(pagas.length, 1);
      assert.equal(pagas[0].reciboId, reciboId);
      assert.equal(pagas[0].detalhe, "recebida via Pix");
    });

    await caso("parcela já paga não recebe de novo", async () => {
      const resultado = await rodar(receberParcela, a, { parcelaId: primeira.id, valor: 10, data: "2026-01-11" });
      assert.equal(resultado.ok, false);
    });

    await caso("renegociar muda valor e vencimento", async () => {
      dados(await rodar(renegociarParcela, a, { parcelaId: segunda.id, valor: 400, vencimento: "2026-03-01" }));
      const depois = dados(await rodar(verContrato, a, { referencia: contrato.id }));
      assert.equal(depois?.parcelas[1].valor, 400);
      assert.equal(depois?.parcelas[1].renegociada, true);
    });

    await caso("quitação paga tudo o que falta e o contrato fica quitado", async () => {
      dados(
        await rodar(receberParcela, a, { parcelaId: segunda.id, valor: 766.66, forma: "quitacao", data: "2026-02-01" }),
      );
      const depois = dados(await rodar(verContrato, a, { referencia: contrato.id }));
      assert.equal(depois?.contrato.situacao, "quitado");
      assert.equal(depois?.contrato.aReceber, 0);
    });

    await caso("painel, relatório e histórico rodam e contam o que entrou", async () => {
      const painel = dados(await rodar(painelDoDia, a, {}));
      assert.equal(painel.balanco.emprestado, 1000);
      const rel = dados(await rodar(relatorio, a, { recorte: "todos", periodo: "90" }));
      assert.equal(rel.totais.contratos, 1);
      const eventos = dados(await rodar(historico, a, {}));
      assert.equal(eventos.filter((e) => e.tipo === "pagamento").length, 2);
    });

    await caso("toda gravação deixa registro com origem", async () => {
      const [{ total }] = await sql<{ total: number }[]>`
        select count(*)::int as total from public.eventos where conta_id = ${a.contaId} and origem = 'sistema'`;
      assert.ok(total >= 5, `esperava 5 ou mais eventos, veio ${total}`);
    });

    console.log("\nIsolamento: a conta B tentando mexer na A");

    await caso("B não enxerga clientes nem contratos de A", async () => {
      assert.equal(dados(await rodar(listarClientes, b, {})).length, 0);
      assert.equal(dados(await rodar(verContrato, b, { referencia: contrato.id })), null);
      assert.equal(dados(await rodar(verContrato, b, { referencia: "#0001" })), null);
    });

    await caso("B não edita cliente de A", async () => {
      const resultado = await rodar(editarCliente, b, { id: cliente.id, nome: "Invadido" });
      assert.equal(resultado.ok, false);
      const [linha] = await sql<{ nome: string }[]>`select nome from public.clientes where id = ${cliente.id}`;
      assert.equal(linha.nome, "João da Silva");
    });

    await caso("B não cria contrato para cliente de A", async () => {
      const resultado = await rodar(criarContrato, b, entradaContrato);
      assert.equal(resultado.ok, false);
    });

    await caso("B não recebe, não registra repasse e não exclui nada de A", async () => {
      assert.equal((await rodar(receberParcela, b, { parcelaId: primeira.id, valor: 1, data: "2026-01-01" })).ok, false);
      assert.equal(
        (await rodar(registrarRepasse, b, { contratoId: contrato.id, data: "2026-01-01", canal: "pix" })).ok,
        false,
      );
      assert.equal((await rodar(excluirContrato, b, { id: contrato.id })).ok, false);
      assert.equal((await rodar(excluirCliente, b, { id: cliente.id })).ok, false);
      const [{ total }] = await sql<{ total: number }[]>`
        select count(*)::int as total from public.contratos where id = ${contrato.id}`;
      assert.equal(total, 1);
    });

    await caso("mesmo sem filtro no código, o banco esconde a outra conta", async () => {
      const linhas = await sql.begin(async (tx) => {
        await tx`select set_config('app.conta_id', ${b.contaId}, true)`;
        await tx`set local role kaderno_app`;
        return tx<{ id: string }[]>`select id from public.clientes`;
      });
      assert.equal(linhas.length, 0);
    });

    await caso("sem conta na transação, o banco não mostra nada", async () => {
      const linhas = await sql.begin(async (tx) => {
        await tx`set local role kaderno_app`;
        return tx<{ id: string }[]>`select id from public.clientes`;
      });
      assert.equal(linhas.length, 0);
    });

    console.log("\nFerramentas para IA");

    await caso(`as ${OPERACOES.length} operações viram JSON Schema com descrição`, async () => {
      const ferramentas = descreverOperacoes();
      const nomes = new Set(ferramentas.map((f) => f.nome));
      assert.equal(nomes.size, ferramentas.length, "nome de operação repetido");
      for (const f of ferramentas) {
        assert.ok(f.descricao.length >= 20, `${f.nome} está sem descrição útil`);
        assert.equal(f.entrada.type, "object", `${f.nome}: entrada precisa ser objeto`);
        const propriedades = JSON.stringify(f.entrada);
        assert.ok(!/conta_?id/i.test(propriedades), `${f.nome}: a conta nunca pode ser parâmetro`);
      }
    });

    await caso("excluir cliente leva contratos, parcelas e recebimentos junto", async () => {
      dados(await rodar(excluirCliente, a, { id: cliente.id }));
      const [{ contratos, parcelas, recebimentos }] = await sql<
        { contratos: number; parcelas: number; recebimentos: number }[]
      >`
        select
          (select count(*)::int from public.contratos where conta_id = ${a.contaId}) as contratos,
          (select count(*)::int from public.parcelas where conta_id = ${a.contaId}) as parcelas,
          (select count(*)::int from public.recebimentos where conta_id = ${a.contaId}) as recebimentos`;
      assert.deepEqual({ contratos, parcelas, recebimentos }, { contratos: 0, parcelas: 0, recebimentos: 0 });
    });
  } finally {
    await limpar(contextos);
    await sql.end();
  }

  console.log(falhas === 0 ? "\nTudo certo.\n" : `\n${falhas} teste(s) falharam.\n`);
  process.exit(falhas === 0 ? 0 : 1);
}

void main();
