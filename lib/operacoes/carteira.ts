import "server-only";

import { eq } from "drizzle-orm";
import { arredondar, rotuloNumeroContrato } from "@/lib/contrato";
import type { Tx } from "@/lib/db/conexao";
import { clientes, contratos, parcelas, recebimentos } from "@/lib/db/schema";
import { atrasoLabel, situacaoContrato } from "@/lib/emprestimos";
import { diasAte } from "@/lib/format";
import type { Cliente, Contrato, Parcela, Recibo } from "./visoes";

/*
 * A carteira inteira da conta, lida de uma vez, e as contas que as telas mostram
 * (situação, quanto falta, atraso). Mesma regra que existia na versão em memória.
 *
 * Ler tudo por pedido é simples e correto para carteiras de centenas de contratos.
 * Quando crescer, as leituras mais pesadas passam a filtrar no banco.
 */

type ClienteLinha = typeof clientes.$inferSelect;
type ContratoLinha = typeof contratos.$inferSelect;
type ParcelaLinha = typeof parcelas.$inferSelect;
type RecebimentoLinha = typeof recebimentos.$inferSelect;

export type Carteira = {
  clientes: ClienteLinha[];
  contratos: ContratoLinha[];
  parcelas: ParcelaLinha[];
  recebimentos: RecebimentoLinha[];
};

export async function carregarCarteira(tx: Tx, contaId: string): Promise<Carteira> {
  // As políticas do banco já prendem a leitura à conta; o filtro repete a regra de propósito.
  const listaClientes = await tx.select().from(clientes).where(eq(clientes.contaId, contaId));
  const listaContratos = await tx.select().from(contratos).where(eq(contratos.contaId, contaId));
  const listaParcelas = await tx.select().from(parcelas).where(eq(parcelas.contaId, contaId));
  const listaRecebimentos = await tx.select().from(recebimentos).where(eq(recebimentos.contaId, contaId));
  return { clientes: listaClientes, contratos: listaContratos, parcelas: listaParcelas, recebimentos: listaRecebimentos };
}

/** O banco guarda null; as telas e a IA recebem o campo ausente. */
function opcional<T>(valor: T | null): T | undefined {
  return valor ?? undefined;
}

export class Indice {
  private readonly clientesPorId: Map<string, ClienteLinha>;
  private readonly contratosPorId: Map<string, ContratoLinha>;
  private readonly parcelasPorContrato = new Map<string, ParcelaLinha[]>();

  constructor(
    readonly carteira: Carteira,
    readonly agora: Date,
  ) {
    this.clientesPorId = new Map(carteira.clientes.map((c) => [c.id, c]));
    this.contratosPorId = new Map(carteira.contratos.map((c) => [c.id, c]));
    for (const parcela of carteira.parcelas) {
      const lista = this.parcelasPorContrato.get(parcela.contratoId) ?? [];
      lista.push(parcela);
      this.parcelasPorContrato.set(parcela.contratoId, lista);
    }
    for (const lista of this.parcelasPorContrato.values()) lista.sort((a, b) => a.numero - b.numero);
  }

  parcelasDe(contratoId: string): readonly ParcelaLinha[] {
    return this.parcelasPorContrato.get(contratoId) ?? [];
  }

  contratoLinha(id: string): ContratoLinha | undefined {
    return this.contratosPorId.get(id);
  }

  atrasada(parcela: ParcelaLinha): boolean {
    return !parcela.pago && diasAte(parcela.vencimento, this.agora) < 0;
  }

  /** A fita do andamento: paga, atrasada, a próxima em aberto e o resto. */
  private fita(lista: readonly ParcelaLinha[]): Contrato["parcelas"] {
    let achouProxima = false;
    return lista.map((p) => {
      if (p.pago) return "paga";
      if (this.atrasada(p)) return "atrasada";
      if (!achouProxima) {
        achouProxima = true;
        return "proxima";
      }
      return "futura";
    });
  }

  contrato(linha: ContratoLinha): Contrato {
    const cliente = this.clientesPorId.get(linha.clienteId);
    const lista = this.parcelasDe(linha.id);
    const pagas = lista.filter((p) => p.pago);
    const abertas = lista.filter((p) => !p.pago);
    const maiorAtraso = abertas.reduce((maior, p) => Math.max(maior, -diasAte(p.vencimento, this.agora)), 0);
    const valor = arredondar(lista.reduce((soma, p) => soma + p.valor, 0));
    const fita = this.fita(lista);

    return {
      id: linha.id,
      numero: rotuloNumeroContrato(linha.numero),
      clienteId: linha.clienteId,
      cliente: cliente?.nome ?? "Cliente removido",
      telefone: opcional(cliente?.telefone ?? null),
      tipo: linha.tipo,
      produto: opcional(linha.produto),
      custo: opcional(linha.custo),
      entrada: opcional(linha.entrada),
      principal: linha.principal,
      taxa: linha.taxa,
      jurosSobre: linha.jurosSobre,
      frequencia: linha.frequencia,
      jurosEmAtraso: linha.jurosEmAtraso,
      observacao: opcional(linha.observacao),
      criadoEm: linha.criadoEm,
      repassadoEm: opcional(linha.repassadoEm),
      canalRepasse: opcional(linha.canalRepasse),
      totalParcelas: lista.length,
      valor,
      recebido: arredondar(pagas.reduce((soma, p) => soma + (p.valorRecebido ?? p.valor), 0)),
      aReceber: arredondar(abertas.reduce((soma, p) => soma + p.valor, 0)),
      juros: arredondar(valor - linha.principal + (linha.entrada ?? 0)),
      pagas: pagas.length,
      parcelas: fita,
      situacao: situacaoContrato(fita),
      alerta: maiorAtraso > 0 ? atrasoLabel(maiorAtraso) : undefined,
      primeiroVencimento: lista[0]?.vencimento ?? linha.criadoEm,
    };
  }

  contratos(): Contrato[] {
    return this.carteira.contratos
      .map((c) => this.contrato(c))
      .sort((a, b) => b.numero.localeCompare(a.numero));
  }

  parcela(linha: ParcelaLinha): Parcela {
    const contrato = this.contratosPorId.get(linha.contratoId);
    const cliente = contrato && this.clientesPorId.get(contrato.clienteId);

    return {
      id: linha.id,
      contratoId: linha.contratoId,
      contrato: contrato ? rotuloNumeroContrato(contrato.numero) : "#—",
      clienteId: contrato?.clienteId ?? "",
      cliente: cliente?.nome ?? "Cliente removido",
      telefone: opcional(cliente?.telefone ?? null),
      tipo: contrato?.tipo ?? "emprestimo",
      numero: linha.numero,
      parcela: { numero: linha.numero, total: this.parcelasDe(linha.contratoId).length },
      vencimento: linha.vencimento,
      valor: linha.valor,
      pago: linha.pago,
      pagoEm: opcional(linha.pagoEm),
      valorRecebido: opcional(linha.valorRecebido),
      detalhe: opcional(linha.detalhe),
      observacao: opcional(linha.observacao),
      renegociada: linha.renegociada,
      reciboId: opcional(linha.recebimentoId),
    };
  }

  parcelas(): Parcela[] {
    return this.carteira.parcelas
      .map((p) => this.parcela(p))
      .sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.numero - b.numero);
  }

  clientes(): Cliente[] {
    const contratos = this.contratos();

    return this.carteira.clientes
      .map((linha) => {
        const deles = contratos.filter((c) => c.clienteId === linha.id);
        const atrasadas = deles.reduce(
          (soma, c) => soma + this.parcelasDe(c.id).filter((p) => this.atrasada(p)).length,
          0,
        );

        return {
          id: linha.id,
          nome: linha.nome,
          apelido: opcional(linha.apelido),
          cpf: opcional(linha.cpf),
          telefone: opcional(linha.telefone),
          email: opcional(linha.email),
          endereco: opcional(linha.endereco),
          score: opcional(linha.score),
          desde: linha.desde,
          contratosAtivos: deles.filter((c) => c.situacao !== "quitado").length,
          emprestado: arredondar(deles.reduce((soma, c) => soma + c.principal, 0)),
          recebido: arredondar(deles.reduce((soma, c) => soma + c.recebido, 0)),
          aReceber: arredondar(deles.reduce((soma, c) => soma + c.aReceber, 0)),
          alerta:
            atrasadas === 0 ? undefined : `${atrasadas} ${atrasadas === 1 ? "parcela atrasada" : "parcelas atrasadas"}`,
        };
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  }

  recibo(linha: RecebimentoLinha): Recibo {
    const contrato = this.contratosPorId.get(linha.contratoId);
    const cliente = contrato && this.clientesPorId.get(contrato.clienteId);

    return {
      id: linha.id,
      contratoId: linha.contratoId,
      numeroContrato: contrato ? rotuloNumeroContrato(contrato.numero) : "#—",
      cliente: cliente?.nome ?? "Cliente removido",
      parcela: { numero: linha.parcelaNumero, total: this.parcelasDe(linha.contratoId).length },
      valor: linha.valor,
      forma: linha.forma,
      canal: linha.canal,
      data: linha.data,
    };
  }
}
