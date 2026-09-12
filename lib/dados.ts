import "server-only";

import { cache } from "react";
import * as z from "zod";
import {
  historico,
  listarClientes,
  listarContratos,
  listarParcelas,
  painelDoDia,
  relatorio,
  resumoDaConta,
  verContrato,
  verParcela,
  verPerfil,
  verRecebimento,
} from "./operacoes/leituras";
import type { PeriodoProjecao, RecorteRelatorio } from "./operacoes/visoes";
import { consultar, emailDoLogin } from "./sessao";

/*
 * O que as telas leem. Cada função é uma operação de leitura (lib/operacoes) rodando com a conta
 * de quem está logado. `cache` evita ler o banco duas vezes no mesmo pedido (metadata + página).
 */

export type {
  Avisos,
  Balanco,
  CanalRecebimento,
  Cliente,
  Conta,
  Contrato,
  Evento,
  FormaRecebimento,
  Inicio,
  LinhaProjecao,
  Parcela,
  Perfil,
  PeriodoProjecao,
  Recibo,
  RecorteRelatorio,
  Relatorio,
} from "./operacoes/visoes";

/** Endereço digitado à mão (ou antigo) não é erro do sistema: a página só não existe. */
function ehId(valor: string): boolean {
  return z.uuid().safeParse(valor).success;
}

export const getConta = cache(() => consultar(resumoDaConta, {}));

export const getPerfil = cache(async () => {
  const [perfil, email] = await Promise.all([consultar(verPerfil, {}), emailDoLogin()]);
  return { ...perfil, email: email ?? perfil.email };
});

export const getClientes = cache(() => consultar(listarClientes, {}));

export const getCliente = cache(async (id: string) => {
  if (!ehId(id)) return undefined;
  return (await getClientes()).find((c) => c.id === id);
});

export const getContratos = cache(() => consultar(listarContratos, {}));

const contratoCompleto = cache(async (id: string) => (ehId(id) ? consultar(verContrato, { referencia: id }) : null));

export const getContrato = cache(async (id: string) => (await contratoCompleto(id))?.contrato);

export const getParcelasDoContrato = cache(async (id: string) => (await contratoCompleto(id))?.parcelas ?? []);

export const getParcelas = cache(() => consultar(listarParcelas, {}));

export const getParcela = cache(async (id: string) => {
  if (!ehId(id)) return undefined;
  return (await consultar(verParcela, { id })) ?? undefined;
});

export const getRecibo = cache(async (id: string) => {
  if (!ehId(id)) return undefined;
  return (await consultar(verRecebimento, { id })) ?? undefined;
});

export const getInicio = cache(() => consultar(painelDoDia, {}));

export const getRelatorio = cache((recorte: RecorteRelatorio, periodo: PeriodoProjecao) =>
  consultar(relatorio, { recorte, periodo }),
);

export const getHistorico = cache(() => consultar(historico, {}));
