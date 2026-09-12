import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Roda antes de cada página: renova a sessão do Supabase (o token expira) e manda
 * quem não entrou para /entrar. A verificação de verdade acontece de novo no servidor,
 * em cada leitura e gravação (lib/sessao.ts); aqui é só o atalho de navegação.
 */

const PUBLICAS = ["/entrar", "/cadastro", "/esqueci-senha", "/auth", "/design"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    },
  );

  const { data } = await supabase.auth.getClaims();
  const logado = data?.claims?.sub !== undefined;
  const caminho = request.nextUrl.pathname;
  const publica = PUBLICAS.some((p) => caminho === p || caminho.startsWith(`${p}/`));

  if (!logado && !publica) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/entrar";
    destino.search = caminho === "/" ? "" : `?voltar=${encodeURIComponent(caminho + request.nextUrl.search)}`;
    return NextResponse.redirect(destino);
  }

  if (logado && (caminho === "/entrar" || caminho === "/cadastro")) {
    const destino = request.nextUrl.clone();
    destino.pathname = "/";
    destino.search = "";
    return NextResponse.redirect(destino);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
