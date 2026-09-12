"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Frequencia, JurosSobre } from "./contrato";
import {
  alterarSenha,
  atualizarAvisos,
  atualizarCliente,
  atualizarContrato,
  atualizarPerfil,
  criarCliente,
  criarContrato,
  excluirCliente,
  excluirContrato,
  receberParcela,
  renegociarParcela,
  type Avisos,
  type CanalRecebimento,
  type FormaRecebimento,
} from "./dados";
import { onlyDigits } from "./format";

/*
 * O que os formulários chamam. Cada ação valida, grava e manda a tela seguinte.
 * Erro de preenchimento volta como texto no campo; nada é gravado pela metade.
 */

export type EstadoForm = {
  erros?: Readonly<Record<string, string>>;
  /** Confirmação curta para o formulário que fica na mesma tela ("Dados salvos."). */
  sucesso?: string;
};

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

function opcional(dados: FormData, campo: string): string | undefined {
  const valor = texto(dados, campo);
  return valor === "" ? undefined : valor;
}

function numero(dados: FormData, campo: string): number | null {
  const valor = texto(dados, campo);
  if (valor === "") return null;
  const convertido = Number(valor.replace(",", "."));
  return Number.isFinite(convertido) ? convertido : null;
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function revalidarTudo(): void {
  // Cliente, contrato e parcela aparecem em quase toda tela: o jeito seguro é revalidar o layout.
  revalidatePath("/", "layout");
}

/* ── Perfil e conta ─────────────────────────────────────────────────── */

export async function salvarPerfil(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const nome = texto(dados, "nome");
  const email = texto(dados, "email");
  const erros: Record<string, string> = {};

  if (nome.length < 2) erros.nome = "Escreva seu nome.";
  if (!EMAIL.test(email)) erros.email = "Escreva um e-mail inteiro, como voce@exemplo.com.";
  if (Object.keys(erros).length > 0) return { erros };

  atualizarPerfil({ nome, email, telefone: opcional(dados, "telefone") });
  // O nome aparece no menu de toda tela.
  revalidarTudo();
  return { sucesso: "Dados salvos." };
}

export async function trocarSenhaAcao(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const atual = texto(dados, "atual");
  const nova = texto(dados, "nova");
  const confirmacao = texto(dados, "confirmacao");
  const erros: Record<string, string> = {};

  if (atual === "") erros.atual = "Digite a senha que você usa hoje.";
  if (nova.length < 8) erros.nova = "A senha nova precisa de 8 caracteres ou mais.";
  else if (nova === atual) erros.nova = "A senha nova precisa ser diferente da de hoje.";
  if (nova !== confirmacao) erros.confirmacao = "As duas senhas novas não bateram. Digite de novo.";
  if (Object.keys(erros).length > 0) return { erros };

  if (!alterarSenha(atual, nova)) return { erros: { atual: "Essa não é a sua senha de hoje." } };

  return { sucesso: "Senha trocada." };
}

export async function salvarAvisosAcao(avisos: Avisos): Promise<void> {
  atualizarAvisos(avisos);
  revalidatePath("/perfil");
}

/* ── Cliente ────────────────────────────────────────────────────────── */

export async function salvarCliente(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const id = texto(dados, "id");
  const nome = texto(dados, "nome");
  const cpf = onlyDigits(texto(dados, "cpf"));
  const score = numero(dados, "score");
  const erros: Record<string, string> = {};

  if (nome.length < 2) erros.nome = "Escreva o nome do cliente.";
  if (cpf !== "" && cpf.length !== 11) erros.cpf = "CPF tem 11 dígitos. Confira o que você digitou.";
  if (score !== null && (score < 0 || score > 100)) erros.score = "O score vai de 0 a 100.";
  if (Object.keys(erros).length > 0) return { erros };

  const cliente = {
    nome,
    cpf: cpf === "" ? undefined : cpf,
    telefone: opcional(dados, "telefone"),
    email: opcional(dados, "email"),
    endereco: opcional(dados, "endereco"),
    score: score ?? undefined,
  };

  const destino = id === "" ? criarCliente(cliente) : (atualizarCliente(id, cliente), id);
  revalidarTudo();
  redirect(`/clientes/${destino}`);
}

export async function excluirClienteAcao(id: string): Promise<void> {
  excluirCliente(id);
  revalidarTudo();
}

/* ── Contrato ───────────────────────────────────────────────────────── */

export async function salvarContrato(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const id = texto(dados, "id");
  const clienteId = texto(dados, "clienteId");
  const tipo = texto(dados, "tipo") === "venda" ? "venda" : "emprestimo";
  const principal = numero(dados, "principal");
  const parcelas = numero(dados, "parcelas");
  const taxa = texto(dados, "comJuros") === "sim" ? (numero(dados, "taxa") ?? 0) : 0;
  const primeiroVencimento = texto(dados, "primeiroVencimento");
  const produto = opcional(dados, "produto");
  const erros: Record<string, string> = {};

  if (clienteId === "") erros.clienteId = "Escolha o cliente do contrato.";
  if (principal === null || principal <= 0) erros.principal = "Diga quanto foi emprestado.";
  if (parcelas === null || parcelas < 1 || parcelas > 360) erros.parcelas = "De 1 a 360 parcelas.";
  if (taxa < 0 || taxa > 100) erros.taxa = "A taxa vai de 0 a 100%.";
  if (!DATA.test(primeiroVencimento)) erros.primeiroVencimento = "Escolha a data da primeira parcela.";
  if (tipo === "venda" && produto === undefined) erros.produto = "Diga o que foi vendido.";
  if (Object.keys(erros).length > 0) return { erros };

  const contrato = {
    clienteId,
    tipo: tipo as "emprestimo" | "venda",
    produto,
    custo: tipo === "venda" ? (numero(dados, "custo") ?? undefined) : undefined,
    entrada: tipo === "venda" ? (numero(dados, "entrada") ?? undefined) : undefined,
    principal: principal as number,
    taxa,
    jurosSobre: (texto(dados, "jurosSobre") === "parcela" ? "parcela" : "total") as JurosSobre,
    frequencia: texto(dados, "frequencia") as Frequencia,
    jurosEmAtraso: dados.get("jurosEmAtraso") !== null,
    observacao: opcional(dados, "observacao"),
    parcelas: parcelas as number,
    primeiroVencimento,
  };

  if (id !== "") {
    atualizarContrato(id, contrato);
    revalidarTudo();
    redirect(`/contratos/${id}`);
  }

  const novo = criarContrato(contrato);
  revalidarTudo();
  redirect(`/contratos/sucesso?contrato=${novo}`);
}

export async function excluirContratoAcao(id: string): Promise<void> {
  excluirContrato(id);
  revalidarTudo();
}

/* ── Parcela ────────────────────────────────────────────────────────── */

export async function receberParcelaAcao(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const id = texto(dados, "parcelaId");
  const valor = numero(dados, "valor");
  const data = texto(dados, "data");
  const erros: Record<string, string> = {};

  if (valor === null || valor <= 0) erros.valor = "Diga quanto você recebeu.";
  if (!DATA.test(data)) erros.data = "Escolha o dia do recebimento.";
  if (Object.keys(erros).length > 0) return { erros };

  const recibo = receberParcela(id, {
    valor: valor as number,
    forma: texto(dados, "forma") as FormaRecebimento,
    canal: texto(dados, "canal") as CanalRecebimento,
    data,
  });

  if (recibo === undefined) return { erros: { valor: "Essa parcela não existe mais. Volte e abra de novo." } };

  revalidarTudo();
  redirect(`/recebido?recibo=${recibo}`);
}

export async function renegociarParcelaAcao(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const id = texto(dados, "parcelaId");
  const contratoId = texto(dados, "contratoId");
  const valor = numero(dados, "valor");
  const vencimento = texto(dados, "vencimento");
  const erros: Record<string, string> = {};

  if (valor === null || valor <= 0) erros.valor = "Diga o novo valor da parcela.";
  if (!DATA.test(vencimento)) erros.vencimento = "Escolha a nova data de vencimento.";
  if (Object.keys(erros).length > 0) return { erros };

  renegociarParcela(id, {
    valor: valor as number,
    vencimento,
    observacao: opcional(dados, "observacao"),
  });

  revalidarTudo();
  redirect(`/contratos/${contratoId}`);
}
