import "server-only";

import * as z from "zod";
import type { Operacao, TipoOperacao } from "./base";
import { cadastrarCliente, editarCliente, excluirCliente } from "./clientes";
import { criarContrato, editarContrato, excluirContrato, registrarRepasse, simularContrato } from "./contratos";
import {
  historico,
  listarClientes,
  listarContratos,
  listarParcelas,
  painelDoDia,
  relatorio,
  resumoDaConta,
  verCliente,
  verContrato,
  verParcela,
  verPerfil,
  verRecebimento,
} from "./leituras";
import { receberParcela, renegociarParcela } from "./parcelas";
import { atualizarAvisos, atualizarPerfil } from "./perfil";

/*
 * Todas as operações do sistema num lugar só. É daqui que o bot, o servidor MCP ou qualquer
 * outra porta vai tirar a lista de ferramentas. Operação nova entra nesta lista.
 */

export const OPERACOES: readonly Operacao<z.ZodType, z.ZodType>[] = [
  // Leitura
  resumoDaConta,
  verPerfil,
  painelDoDia,
  listarClientes,
  verCliente,
  listarContratos,
  verContrato,
  simularContrato,
  listarParcelas,
  verParcela,
  verRecebimento,
  relatorio,
  historico,
  // Gravação
  cadastrarCliente,
  editarCliente,
  criarContrato,
  editarContrato,
  registrarRepasse,
  receberParcela,
  renegociarParcela,
  atualizarPerfil,
  atualizarAvisos,
  // Perigosa
  excluirCliente,
  excluirContrato,
];

export type Ferramenta = {
  nome: string;
  descricao: string;
  tipo: TipoOperacao;
  /** JSON Schema da entrada, pronto para qualquer modelo de IA. */
  entrada: Record<string, unknown>;
  saida: Record<string, unknown>;
};

/** As operações no formato de ferramenta: nome, descrição e JSON Schema. */
export function descreverOperacoes(): Ferramenta[] {
  return OPERACOES.map((operacao) => ({
    nome: operacao.nome,
    descricao: operacao.descricao,
    tipo: operacao.tipo,
    entrada: z.toJSONSchema(operacao.entrada, { io: "input" }),
    saida: z.toJSONSchema(operacao.saida),
  }));
}
