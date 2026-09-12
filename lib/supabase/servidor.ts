import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Cliente do Supabase para Server Components, Server Actions e Route Handlers. Só login. */
export async function supabaseServidor() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl(), supabaseChavePublica(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Component não pode gravar cookie. O proxy.ts renova a sessão a cada pedido.
        }
      },
    },
  });
}

export function supabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL não está configurada.");
  return url;
}

export function supabaseChavePublica(): string {
  const chave = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!chave) throw new Error("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY não está configurada.");
  return chave;
}
