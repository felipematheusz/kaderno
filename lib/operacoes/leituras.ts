import "server-only";

import { eq } from "drizzle-orm";
import * as z from "zod";
import { arredondar, lerNumeroContrato } from "@/lib/contrato";
import { usuarios } from "@/lib/db/schema";
import { clienteCombina } from "@/lib/emprestimos";
import { diasAte, fimDoMes, isoDate, mesAtual, mesDe, normalizeSearch, somarAoMes, somarDias } from "@/lib/format";
import { definirOperacao } from "./base";
import { carregarCarteira, Indice } from "./carteira";
import { id, tipoContrato } from "./campos";
import {
  clienteVisao,
  contaVisao,
  contratoVisao,
  eventoVisao,
  inicioVisao,
  parcelaVisao,
  perfilVisao,
  periodo,
  recorte,
  reciboVisao,
  relatorioVisao,
  type Balanco,
  type Contrato,
  type Evento,
  type FormaRecebimento,
  type CanalRecebimento,
} from "./visoes";

const sem = z.object({});

export const resumoDaConta = definirOperacao({
  nome: "resumoDaConta",
  descricao: "Nome de quem está usando, plano e quantas parcelas estão atrasadas agora.",
  tipo: "leitura",
  entrada: sem,
  saida: contaVisao,
  async executar(tx, ctx) {
    const [usuario] = await tx.select({ nome: usuarios.nome }).from(usuarios).where(eq(usuarios.id, ctx.usuarioId));
    const indice = new Indice(await carregarCarteira(tx, ctx.contaId), new Date());

    return {
      usuario: { nome: usuario?.nome ?? "" },
      plano: { nome: "Plano Pro", usados: indice.carteira.contratos.length, limite: 25, unidade: "contratos" },
      atrasadas: indice.carteira.parcelas.filter((p) => indice.atrasada(p)).length,
    };
  },
});

export const verPerfil = definirOperacao({
  nome: "verPerfil",
  descricao: "Dados de quem está usando o sistema e os avisos ligados.",
  tipo: "leitura",
  entrada: sem,
  saida: perfilVisao,
  async executar(tx, ctx) {
    const [usuario] = await tx.select().from(usuarios).where(eq(usuarios.id, ctx.usuarioId));
    return {
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone ?? undefined,
      desde: isoDate(usuario.criadoEm),
      avisos: usuario.avisos,
    };
  },
});

export const listarClientes = definirOperacao({
  nome: "listarClientes",
  descricao:
    "Lista os clientes com quanto cada um deve. Com busca, acha por nome ou apelido (sem acento) ou por parte do CPF. Use para descobrir o id de um cliente citado pelo nome.",
  tipo: "leitura",
  entrada: z.object({ busca: z.string().trim().optional().describe("nome, apelido ou dígitos do CPF") }),
  saida: z.array(clienteVisao),
  async executar(tx, ctx, { busca }) {
    const todos = new Indice(await carregarCarteira(tx, ctx.contaId), new Date()).clientes();
    if (!busca) return todos;
    const termo = normalizeSearch(busca);
    return todos.filter(
      (c) => clienteCombina(c, busca) || (c.apelido !== undefined && normalizeSearch(c.apelido).includes(termo)),
    );
  },
});

export const verCliente = definirOperacao({
  nome: "verCliente",
  descricao: "Ficha de um cliente: contato, score e quanto emprestou, recebeu e falta receber.",
  tipo: "leitura",
  entrada: z.object({ id: id("Cliente não encontrado.").describe("id do cliente") }),
  saida: clienteVisao.nullable(),
  async executar(tx, ctx, entrada) {
    const todos = new Indice(await carregarCarteira(tx, ctx.contaId), new Date()).clientes();
    return todos.find((c) => c.id === entrada.id) ?? null;
  },
});

export const listarContratos = definirOperacao({
  nome: "listarContratos",
  descricao: "Lista contratos com andamento e situação. Dá para filtrar por cliente, tipo e situação.",
  tipo: "leitura",
  entrada: z.object({
    clienteId: z.uuid().optional().describe("só os contratos desse cliente"),
    tipo: tipoContrato.optional(),
    situacao: z.enum(["em-dia", "atrasado", "quitado"]).optional(),
  }),
  saida: z.array(contratoVisao),
  async executar(tx, ctx, filtro) {
    return new Indice(await carregarCarteira(tx, ctx.contaId), new Date())
      .contratos()
      .filter(
        (c) =>
          (filtro.clienteId === undefined || c.clienteId === filtro.clienteId) &&
          (filtro.tipo === undefined || c.tipo === filtro.tipo) &&
          (filtro.situacao === undefined || c.situacao === filtro.situacao),
      );
  },
});

export const verContrato = definirOperacao({
  nome: "verContrato",
  descricao: 'Um contrato com todas as parcelas. Aceita o id ou o número como a pessoa fala ("#0042", "42").',
  tipo: "leitura",
  entrada: z.object({ referencia: z.string().trim().min(1).describe('id do contrato ou número: "#0042"') }),
  saida: z.object({ contrato: contratoVisao, parcelas: z.array(parcelaVisao) }).nullable(),
  async executar(tx, ctx, { referencia }) {
    const indice = new Indice(await carregarCarteira(tx, ctx.contaId), new Date());
    const numero = lerNumeroContrato(referencia);
    const linha = indice.carteira.contratos.find(
      (c) => c.id === referencia || (numero !== undefined && c.numero === numero),
    );
    if (!linha) return null;
    return { contrato: indice.contrato(linha), parcelas: indice.parcelasDe(linha.id).map((p) => indice.parcela(p)) };
  },
});

export const listarParcelas = definirOperacao({
  nome: "listarParcelas",
  descricao:
    "Parcelas em ordem de vencimento, com cliente e contrato. Filtra por situação: atrasadas, as que vencem hoje, a receber ou pagas.",
  tipo: "leitura",
  entrada: z.object({
    situacao: z.enum(["a-receber", "atrasadas", "hoje", "pagas", "todas"]).default("todas"),
    clienteId: z.uuid().optional(),
  }),
  saida: z.array(parcelaVisao),
  async executar(tx, ctx, { situacao, clienteId }) {
    const agora = new Date();
    return new Indice(await carregarCarteira(tx, ctx.contaId), agora).parcelas().filter((p) => {
      if (clienteId !== undefined && p.clienteId !== clienteId) return false;
      const dias = diasAte(p.vencimento, agora);
      if (situacao === "pagas") return p.pago;
      if (situacao === "a-receber") return !p.pago;
      if (situacao === "atrasadas") return !p.pago && dias < 0;
      if (situacao === "hoje") return !p.pago && dias === 0;
      return true;
    });
  },
});

export const verParcela = definirOperacao({
  nome: "verParcela",
  descricao: "Uma parcela com cliente, contrato, valor e vencimento.",
  tipo: "leitura",
  entrada: z.object({ id: id("Parcela não encontrada.").describe("id da parcela") }),
  saida: parcelaVisao.nullable(),
  async executar(tx, ctx, entrada) {
    const indice = new Indice(await carregarCarteira(tx, ctx.contaId), new Date());
    const linha = indice.carteira.parcelas.find((p) => p.id === entrada.id);
    return linha ? indice.parcela(linha) : null;
  },
});

export const verRecebimento = definirOperacao({
  nome: "verRecebimento",
  descricao: "O comprovante de um recebimento: valor, forma, canal e parcela.",
  tipo: "leitura",
  entrada: z.object({ id: id("Comprovante não encontrado.").describe("id do comprovante") }),
  saida: reciboVisao.nullable(),
  async executar(tx, ctx, entrada) {
    const indice = new Indice(await carregarCarteira(tx, ctx.contaId), new Date());
    const linha = indice.carteira.recebimentos.find((r) => r.id === entrada.id);
    return linha ? indice.recibo(linha) : null;
  },
});

export const painelDoDia = definirOperacao({
  nome: "painelDoDia",
  descricao:
    "Como está o dia: total emprestado, recebido, a vencer, atrasado, o que vence hoje e amanhã e os contratos ativos.",
  tipo: "leitura",
  entrada: sem,
  saida: inicioVisao,
  async executar(tx, ctx) {
    const agora = new Date();
    const indice = new Indice(await carregarCarteira(tx, ctx.contaId), agora);
    const contratos = indice.contratos();
    const parcelas = indice.parcelas();
    const ativos = contratos.filter((c) => c.situacao !== "quitado");

    const balanco = contratos.reduce<Balanco>(
      (soma, contrato) => {
        const abertas = indice.parcelasDe(contrato.id).filter((p) => !p.pago);
        const atrasado = abertas.filter((p) => indice.atrasada(p)).reduce((total, p) => total + p.valor, 0);

        return {
          emprestado: soma.emprestado + contrato.principal,
          recebido: soma.recebido + contrato.recebido,
          aVencer: soma.aVencer + contrato.aReceber - atrasado,
          atrasado: soma.atrasado + atrasado,
          jurosPrevistos:
            soma.jurosPrevistos +
            (contrato.totalParcelas === 0 ? 0 : (contrato.juros * abertas.length) / contrato.totalParcelas),
        };
      },
      { emprestado: 0, recebido: 0, aVencer: 0, atrasado: 0, jurosPrevistos: 0 },
    );

    const doDia = parcelas.filter((p) => diasAte(p.vencimento, agora) === 0);
    // Parcela paga de outro dia não volta para a agenda; a de hoje fica, para mostrar o que já entrou.
    const agenda = parcelas.filter((p) => {
      const dias = diasAte(p.vencimento, agora);
      return dias <= 1 && (p.pago ? dias === 0 : true);
    });

    return {
      balanco: {
        emprestado: arredondar(balanco.emprestado),
        recebido: arredondar(balanco.recebido),
        aVencer: arredondar(balanco.aVencer),
        atrasado: arredondar(balanco.atrasado),
        jurosPrevistos: arredondar(balanco.jurosPrevistos),
      },
      agenda: agenda.slice(0, 6),
      venceHoje: doDia.filter((p) => !p.pago).length,
      recebidoHoje: arredondar(doDia.filter((p) => p.pago).reduce((soma, p) => soma + (p.valorRecebido ?? p.valor), 0)),
      contratos: ativos.slice(0, 5),
      totalContratosAtivos: ativos.length,
    };
  },
});

/** O que o contrato deixa: o juro e, na venda, também a margem do produto. */
function lucroDe(contrato: Contrato): number {
  const margem = contrato.tipo === "venda" && contrato.custo !== undefined ? contrato.principal - contrato.custo : 0;
  return contrato.juros + margem;
}

/** O dinheiro que saiu do bolso: o emprestado ou o que o produto vendido custou. */
function saidaDe(contrato: Pick<Contrato, "tipo" | "principal" | "custo">): number {
  return contrato.tipo === "venda" ? (contrato.custo ?? contrato.principal) : contrato.principal;
}

/** Quando o dinheiro saiu: o dia do repasse registrado ou, sem registro, o dia do contrato. */
function diaDaSaida(contrato: Pick<Contrato, "repassadoEm" | "criadoEm">): string {
  return contrato.repassadoEm ?? contrato.criadoEm;
}

export const relatorio = definirOperacao({
  nome: "relatorio",
  descricao:
    "Totais da carteira (emprestado, recebido, a receber, lucro), o que ainda entra no período e o que entrou e saiu nos últimos seis meses.",
  tipo: "leitura",
  entrada: z.object({ recorte: recorte.default("todos"), periodo: periodo.default("mes") }),
  saida: relatorioVisao,
  async executar(tx, ctx, entrada) {
    const agora = new Date();
    const hoje = isoDate(agora);
    const indice = new Indice(await carregarCarteira(tx, ctx.contaId), agora);
    const contratos = indice.contratos();
    const noRecorte = entrada.recorte === "abertos" ? contratos.filter((c) => c.situacao !== "quitado") : contratos;

    const soma = noRecorte.reduce(
      (total, contrato) => {
        const lucro = lucroDe(contrato);
        return {
          emprestado: total.emprestado + contrato.principal,
          recebido: total.recebido + contrato.recebido,
          aReceber: total.aReceber + contrato.aReceber,
          lucro: total.lucro + lucro,
          lucroRealizado:
            total.lucroRealizado + (contrato.totalParcelas === 0 ? 0 : (lucro * contrato.pagas) / contrato.totalParcelas),
          contratos: total.contratos + 1,
        };
      },
      { emprestado: 0, recebido: 0, aReceber: 0, lucro: 0, lucroRealizado: 0, contratos: 0 },
    );

    // O que já venceu entra na projeção mesmo sendo de antes: é dinheiro que ainda tem de aparecer.
    const limite = entrada.periodo === "mes" ? fimDoMes(mesAtual(agora)) : somarDias(hoje, Number(entrada.periodo));

    const projecao = (["emprestimo", "venda"] as const).map((tipo) => {
      const linha = { tipo, parcelas: 0, aReceber: 0, juros: 0, vencido: 0 };
      for (const contrato of contratos.filter((c) => c.tipo === tipo)) {
        const jurosPorParcela = contrato.totalParcelas === 0 ? 0 : contrato.juros / contrato.totalParcelas;
        for (const parcela of indice.parcelasDe(contrato.id)) {
          if (parcela.pago || parcela.vencimento > limite) continue;
          linha.parcelas += 1;
          linha.aReceber += parcela.valor;
          linha.juros += jurosPorParcela;
          if (parcela.vencimento < hoje) linha.vencido += parcela.valor;
        }
      }
      return {
        ...linha,
        aReceber: arredondar(linha.aReceber),
        juros: arredondar(linha.juros),
        vencido: arredondar(linha.vencido),
      };
    });

    const fluxo = Array.from({ length: 6 }, (_, i) => ({ mes: somarAoMes(mesAtual(agora), i - 5), entrada: 0, saida: 0 }));
    const porMes = new Map(fluxo.map((m) => [m.mes, m]));
    for (const recebimento of indice.carteira.recebimentos) {
      const mes = porMes.get(mesDe(recebimento.data));
      if (mes) mes.entrada = arredondar(mes.entrada + recebimento.valor);
    }
    for (const contrato of contratos) {
      const mes = porMes.get(mesDe(diaDaSaida(contrato)));
      if (mes) mes.saida = arredondar(mes.saida + saidaDe(contrato));
    }

    return {
      totais: {
        ...soma,
        emprestado: arredondar(soma.emprestado),
        recebido: arredondar(soma.recebido),
        aReceber: arredondar(soma.aReceber),
        lucro: arredondar(soma.lucro),
        lucroRealizado: arredondar(soma.lucroRealizado),
      },
      projecao,
      fluxo,
    };
  },
});

const rotuloForma: Record<FormaRecebimento, string> = {
  parcela: "parcela",
  juros: "só os juros",
  parcial: "juros e parte da dívida",
  quitacao: "quitação",
};

const canalCurto: Record<CanalRecebimento, string> = {
  pix: "Pix",
  dinheiro: "dinheiro",
  transferencia: "transferência",
  cartao: "cartão",
};

export const historico = definirOperacao({
  nome: "historico",
  descricao:
    "Tudo o que aconteceu na conta, do mais recente ao mais antigo: pagamentos recebidos, contratos fechados e clientes cadastrados.",
  tipo: "leitura",
  entrada: sem,
  saida: z.array(eventoVisao),
  async executar(tx, ctx) {
    const indice = new Indice(await carregarCarteira(tx, ctx.contaId), new Date());
    const contratos = indice.contratos();

    const pagamentos: Evento[] = indice.carteira.recebimentos.map((linha) => {
      const recibo = indice.recibo(linha);
      return {
        id: `pagamento-${recibo.id}`,
        tipo: "pagamento",
        data: recibo.data,
        titulo: recibo.cliente,
        detalhe: `${recibo.numeroContrato} · parcela ${recibo.parcela.numero} de ${recibo.parcela.total} · ${rotuloForma[recibo.forma]} · ${canalCurto[recibo.canal]}`,
        valor: recibo.valor,
        href: `/contratos/${recibo.contratoId}`,
      };
    });

    const fechados: Evento[] = contratos.map((contrato) => ({
      id: `contrato-${contrato.id}`,
      tipo: "contrato",
      data: diaDaSaida(contrato),
      titulo: contrato.cliente,
      detalhe: [
        contrato.numero,
        contrato.tipo === "venda" ? (contrato.produto ?? "venda") : null,
        `${contrato.totalParcelas} ${contrato.totalParcelas === 1 ? "parcela" : "parcelas"}`,
      ]
        .filter(Boolean)
        .join(" · "),
      valor: saidaDe(contrato),
      href: `/contratos/${contrato.id}`,
    }));

    const cadastros: Evento[] = indice.carteira.clientes.map((cliente) => ({
      id: `cliente-${cliente.id}`,
      tipo: "cliente",
      data: cliente.desde,
      titulo: cliente.nome,
      detalhe: "Cliente cadastrado",
      href: `/clientes/${cliente.id}`,
    }));

    // Do mais recente para o mais antigo; no mesmo dia, o dinheiro vem antes do cadastro.
    return [...pagamentos, ...fechados, ...cadastros].sort(
      (a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id),
    );
  },
});
