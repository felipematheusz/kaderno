import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import type { MenuMode } from "./menu-mode";
import { Sidebar, type PlanUsage, type ShellUser } from "./sidebar";

export type AppShellProps = {
  user: ShellUser;
  plan?: PlanUsage;
  /** Parcelas atrasadas: contador no menu. */
  overdueCount?: number;
  /** Tamanho do menu lateral lido do cookie. */
  menuMode?: MenuMode;
  children: ReactNode;
};

/**
 * Moldura da área logada: menu lateral no desktop, barra inferior no celular.
 * Telas públicas (login, termos) ficam fora dela.
 */
export function AppShell({ user, plan, overdueCount = 0, menuMode = "auto", children }: AppShellProps) {
  return (
    <div className="flex w-full flex-1">
      <a
        href="#conteudo"
        className="sr-only rounded-pill bg-canvas px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Pular para o conteúdo
      </a>

      {/* Solta da borda: vira mais um cartão branco sobre a sálvia, sem sombra. */}
      <div className="sticky top-0 hidden h-dvh shrink-0 py-4 pl-4 md:block">
        <Sidebar user={user} plan={plan} overdueCount={overdueCount} mode={menuMode} className="rounded-xl" />
      </div>

      <main id="conteudo" className="flex min-w-0 flex-1 flex-col gap-5 px-4 pt-6 pb-28 md:p-8">
        {children}
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 md:hidden">
        <BottomNav overdueCount={overdueCount} />
      </div>
    </div>
  );
}
