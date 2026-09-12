"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabaseServidor } from "./supabase/servidor";

/*
 * Entrar, criar conta, sair e recuperar senha. Quem guarda senha e sessão é o Supabase Auth;
 * ao criar o login, o banco já cria a conta da pessoa (gatilho em drizzle/0002).
 */

export type EstadoLogin = {
  erros?: Readonly<Record<string, string>>;
  /** Mensagem que substitui o formulário ("Mandamos um link para..."). */
  aviso?: string;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function texto(dados: FormData, campo: string): string {
  const valor = dados.get(campo);
  return typeof valor === "string" ? valor.trim() : "";
}

async function origem(): Promise<string> {
  const lista = await headers();
  const host = lista.get("x-forwarded-host") ?? lista.get("host") ?? "localhost:3000";
  const protocolo = lista.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocolo}://${host}`;
}

/** Só caminho interno: "voltar" nunca leva para outro site. */
function destinoSeguro(valor: string): string {
  return valor.startsWith("/") && !valor.startsWith("//") ? valor : "/";
}

export async function entrar(_estado: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const email = texto(dados, "email");
  const senha = texto(dados, "senha");
  const erros: Record<string, string> = {};
  if (!EMAIL.test(email)) erros.email = "Escreva o e-mail inteiro, como voce@exemplo.com.";
  if (senha === "") erros.senha = "Digite sua senha.";
  if (Object.keys(erros).length > 0) return { erros };

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
  if (error) {
    if (error.code === "email_not_confirmed") {
      return { erros: { email: "Falta confirmar o e-mail. Abra o link que mandamos quando você criou a conta." } };
    }
    return { erros: { senha: "E-mail ou senha não conferem. Confira e tente de novo." } };
  }

  redirect(destinoSeguro(texto(dados, "voltar")));
}

export async function cadastrar(_estado: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const nome = texto(dados, "nome");
  const email = texto(dados, "email");
  const senha = texto(dados, "senha");
  const erros: Record<string, string> = {};
  if (nome.length < 2) erros.nome = "Escreva seu nome.";
  if (!EMAIL.test(email)) erros.email = "Escreva o e-mail inteiro, como voce@exemplo.com.";
  if (senha.length < 8) erros.senha = "A senha precisa de 8 caracteres ou mais.";
  if (Object.keys(erros).length > 0) return { erros };

  const supabase = await supabaseServidor();
  const { data, error } = await supabase.auth.signUp({
    email,
    password: senha,
    options: { data: { nome }, emailRedirectTo: `${await origem()}/auth/confirmar` },
  });

  if (error) {
    if (error.code === "user_already_exists") {
      return { erros: { email: "Esse e-mail já tem conta. Entre ou recupere a senha." } };
    }
    if (error.code === "weak_password") {
      return { erros: { senha: "Senha fraca. Misture letras e números e use 8 caracteres ou mais." } };
    }
    if (error.code === "over_email_send_rate_limit") {
      return { erros: { email: "Muitos cadastros em pouco tempo. Espere alguns minutos e tente de novo." } };
    }
    return { erros: { email: "Não deu para criar a conta agora. Tente de novo em alguns minutos." } };
  }

  // Com confirmação de e-mail ligada, o Supabase não abre sessão: a pessoa precisa clicar no link.
  if (!data.session) return { aviso: `Mandamos um link para ${email}. Abra para confirmar e entrar.` };
  redirect("/");
}

export async function sair(): Promise<void> {
  const supabase = await supabaseServidor();
  await supabase.auth.signOut();
  redirect("/entrar");
}

export async function pedirNovaSenha(_estado: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const email = texto(dados, "email");
  if (!EMAIL.test(email)) return { erros: { email: "Escreva o e-mail inteiro, como voce@exemplo.com." } };

  const supabase = await supabaseServidor();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await origem()}/auth/confirmar?voltar=/nova-senha`,
  });
  // Mesma resposta com ou sem conta: a tela não conta quais e-mails estão cadastrados.
  return { aviso: `Se ${email} tiver conta, chega um link para criar a senha nova. Confira também o spam.` };
}

export async function definirNovaSenha(_estado: EstadoLogin, dados: FormData): Promise<EstadoLogin> {
  const senha = texto(dados, "senha");
  const confirmacao = texto(dados, "confirmacao");
  const erros: Record<string, string> = {};
  if (senha.length < 8) erros.senha = "A senha precisa de 8 caracteres ou mais.";
  if (senha !== confirmacao) erros.confirmacao = "As duas senhas não bateram. Digite de novo.";
  if (Object.keys(erros).length > 0) return { erros };

  const supabase = await supabaseServidor();
  const { error } = await supabase.auth.updateUser({ password: senha });
  if (error) {
    return {
      erros: {
        senha:
          error.code === "weak_password"
            ? "Senha fraca. Misture letras e números e use 8 caracteres ou mais."
            : "O link expirou. Peça um novo em Esqueci a senha.",
      },
    };
  }
  redirect("/");
}
