import { cookies } from "next/headers";
import { AppShell } from "@/components/shell/app-shell";
import { MENU_COOKIE, parseMenuMode } from "@/components/shell/menu-mode";
import { getConta } from "@/lib/dados";

/** Área logada: tudo aqui dentro ganha o menu lateral (desktop) e a barra inferior (celular). */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const [conta, cookieStore] = await Promise.all([getConta(), cookies()]);
  const menuMode = parseMenuMode(cookieStore.get(MENU_COOKIE)?.value);

  return (
    <AppShell user={conta.usuario} plan={conta.plano} overdueCount={conta.atrasadas} menuMode={menuMode}>
      {children}
    </AppShell>
  );
}
