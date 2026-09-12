"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FREQUENCIAS } from "./contrato";
import { cadastrarCliente, editarCliente, excluirCliente } from "./operacoes/clientes";
import { criarContrato, editarContrato, excluirContrato } from "./operacoes/contratos";
import { receberParcela, renegociarParcela } from "./operacoes/parcelas";
import { atualizarAvisos, atualizarPerfil } from "./operacoes/perfil";
import type { Avisos } from "./operacoes/visoes";
import { emailDoLogin, gravar } from "./sessao";
import { supabaseServidor } from "./supabase/servidor";

/*
 * O que os formulários chamam. Cada ação só traduz o formulário para a operação
 * (lib/operacoes), que valida e grava tudo ou nada. Erro de preenchimento volta como texto no campo.
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

/** Número digitado ("1.234,56" já chega como "1234.56" dos campos de dinheiro). Vazio é ausente. */
function numero(dados: FormData, campo: string): number | undefined {
  const valor = texto(dados, campo);
  if (valor === "") return undefined;
  const convertido = Number(valor.replace(",", "."));
  return Number.isFinite(convertido) ? convertido : Number.NaN;
}

/** Só aceita um dos valores conhecidos; o resto vira ausente e a operação usa o padrão. */
function escolha<T extends string>(dados: FormData, campo: string, opcoes: readonly T[]): T | undefined {
  const valor = texto(dados, campo);
  return opcoes.find((opcao) => opcao === valor);
}

function revalidarTudo(): void {
  // Cliente, contrato e parcela aparecem em quase toda tela: o jeito seguro é revalidar o layout.
  revalidatePath("/", "layout");
}

/* ── Perfil e conta ─────────────────────────────────────────────────── */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export async function salvarPerfil(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const email = texto(dados, "email");
  if (!EMAIL.test(email)) return { erros: { email: "Escreva um e-mail inteiro, como voce@exemplo.com." } };

  const resultado = await gravar(atualizarPerfil, { nome: texto(dados, "nome"), telefone: opcional(dados, "telefone") });
  if (!resultado.ok) return { erros: resultado.erros };
  revalidarTudo();

  if (email === (await emailDoLogin())) return { sucesso: "Dados salvos." };

  // O e-mail é o login: só troca depois que a pessoa confirma pelo link enviado ao endereço novo.
  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.updateUser({ email });
  if (error) {
    return {
      erros: {
        email:
          error.code === "email_exists"
            ? "Esse e-mail já é usado em outra conta."
            : "Não deu para trocar o e-mail agora. Tente de novo em alguns minutos.",
      },
    };
  }
  return { sucesso: "Dados salvos. Para trocar o e-mail, abra o link que mandamos para o endereço novo." };
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

  const email = await emailDoLogin();
  const supabase = await supabaseServidor();
  if (!email) return { erros: { atual: "Sua sessão acabou. Entre de novo para trocar a senha." } };

  const conferida = await supabase.auth.signInWithPassword({ email, password: atual });
  if (conferida.error) return { erros: { atual: "Essa não é a sua senha de hoje." } };

  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) {
    return {
      erros: {
        nova:
          error.code === "weak_password"
            ? "Senha fraca. Misture letras e números e use 8 caracteres ou mais."
            : "Não deu para trocar a senha agora. Tente de novo.",
      },
    };
  }
  return { sucesso: "Senha trocada." };
}

export async function salvarAvisosAcao(avisos: Avisos): Promise<void> {
  const resultado = await gravar(atualizarAvisos, avisos);
  if (!resultado.ok) throw new Error("Não deu para salvar os avisos.");
  revalidatePath("/perfil");
}

/* ── Cliente ────────────────────────────────────────────────────────── */

export async function salvarCliente(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const id = texto(dados, "id");
  const cliente = {
    nome: texto(dados, "nome"),
    apelido: opcional(dados, "apelido"),
    cpf: opcional(dados, "cpf"),
    telefone: opcional(dados, "telefone"),
    email: opcional(dados, "email"),
    endereco: opcional(dados, "endereco"),
    score: numero(dados, "score"),
  };

  const resultado =
    id === ""
      ? await gravar(cadastrarCliente, cliente, opcional(dados, "chave"))
      : await gravar(editarCliente, { ...cliente, id });
  if (!resultado.ok) return { erros: resultado.erros };

  revalidarTudo();
  redirect(`/clientes/${resultado.dados.id}`);
}

export async function excluirClienteAcao(id: string): Promise<void> {
  const resultado = await gravar(excluirCliente, { id });
  if (!resultado.ok) throw new Error(Object.values(resultado.erros)[0]);
  revalidarTudo();
}

/* ── Contrato ───────────────────────────────────────────────────────── */

export async function salvarContrato(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const id = texto(dados, "id");
  const tipo = escolha(dados, "tipo", ["emprestimo", "venda"] as const) ?? "emprestimo";
  const venda = tipo === "venda";

  const contrato = {
    clienteId: texto(dados, "clienteId"),
    tipo,
    produto: venda ? opcional(dados, "produto") : undefined,
    custo: venda ? numero(dados, "custo") : undefined,
    entrada: venda ? numero(dados, "entrada") : undefined,
    principal: numero(dados, "principal"),
    taxa: texto(dados, "comJuros") === "sim" ? (numero(dados, "taxa") ?? 0) : 0,
    jurosSobre: escolha(dados, "jurosSobre", ["parcela", "total"] as const),
    frequencia: escolha(
      dados,
      "frequencia",
      FREQUENCIAS.map((f) => f.value),
    ),
    parcelas: numero(dados, "parcelas"),
    primeiroVencimento: texto(dados, "primeiroVencimento"),
    jurosEmAtraso: dados.get("jurosEmAtraso") !== null,
    observacao: opcional(dados, "observacao"),
  };

  if (id !== "") {
    const resultado = await gravar(editarContrato, { ...contrato, id });
    if (!resultado.ok) return { erros: resultado.erros };
    revalidarTudo();
    redirect(`/contratos/${id}`);
  }

  const resultado = await gravar(criarContrato, contrato, opcional(dados, "chave"));
  if (!resultado.ok) return { erros: resultado.erros };
  revalidarTudo();
  redirect(`/contratos/sucesso?contrato=${resultado.dados.id}`);
}

export async function excluirContratoAcao(id: string): Promise<void> {
  const resultado = await gravar(excluirContrato, { id });
  if (!resultado.ok) throw new Error(Object.values(resultado.erros)[0]);
  revalidarTudo();
}

/* ── Parcela ────────────────────────────────────────────────────────── */

export async function receberParcelaAcao(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const resultado = await gravar(
    receberParcela,
    {
      parcelaId: texto(dados, "parcelaId"),
      valor: numero(dados, "valor"),
      forma: escolha(dados, "forma", ["parcela", "juros", "parcial", "quitacao"] as const),
      canal: escolha(dados, "canal", ["pix", "dinheiro", "transferencia", "cartao"] as const),
      data: texto(dados, "data"),
    },
    opcional(dados, "chave"),
  );
  if (!resultado.ok) return { erros: resultado.erros };

  revalidarTudo();
  redirect(`/recebido?recibo=${resultado.dados.reciboId}`);
}

export async function renegociarParcelaAcao(_estado: EstadoForm, dados: FormData): Promise<EstadoForm> {
  const resultado = await gravar(renegociarParcela, {
    parcelaId: texto(dados, "parcelaId"),
    valor: numero(dados, "valor"),
    vencimento: texto(dados, "vencimento"),
    observacao: opcional(dados, "observacao"),
  });
  if (!resultado.ok) return { erros: resultado.erros };

  revalidarTudo();
  redirect(`/contratos/${resultado.dados.contratoId}`);
}
