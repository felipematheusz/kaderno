import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServidor } from "@/lib/supabase/servidor";

/*
 * Onde cai o link dos e-mails do Supabase (confirmar cadastro, recuperar senha, trocar e-mail).
 * Aceita os dois formatos: `code` (padrão dos modelos de e-mail) e `token_hash` (modelo personalizado).
 */

const TIPOS: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const voltar = searchParams.get("voltar") ?? "/";
  const destino = voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/";
  const supabase = await supabaseServidor();

  const code = searchParams.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  const tokenHash = searchParams.get("token_hash");
  const tipo = TIPOS.find((t) => t === searchParams.get("type"));
  if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({ type: tipo, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${destino}`);
  }

  return NextResponse.redirect(`${origin}/entrar?erro=link`);
}
