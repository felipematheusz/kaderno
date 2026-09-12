"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { PanelLeftIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";
import { Logo } from "./logo";
import { saveMenuMode, type MenuMode } from "./menu-mode";
import { isActive, mainNav, overdueLabel, secondaryNav, type NavItem } from "./nav";

export type PlanUsage = {
  nome: string;
  usados: number;
  limite: number;
  /** O que o limite conta ("contratos"). */
  unidade: string;
};

export type ShellUser = { nome: string };

export type SidebarProps = {
  user: ShellUser;
  /** Cartão do plano. Omitir em plano sem limite. */
  plan?: PlanUsage;
  overdueCount?: number;
  /** Tamanho inicial (vem do cookie). Depois o botão de recolher assume. */
  mode?: MenuMode;
  /** Força a rota atual (vitrine, testes). Por padrão lê da URL. */
  currentPath?: string;
  className?: string;
};

/** Mesmo corte da variante `compacto` em globals.css. */
const TELA_MEDIA = "(width < 80rem)";

function subscribeTelaMedia(onChange: () => void): () => void {
  const consulta = window.matchMedia(TELA_MEDIA);
  consulta.addEventListener("change", onChange);
  return () => consulta.removeEventListener("change", onChange);
}

/** Tela abaixo de 1280px. No servidor não se sabe: o CSS cuida do visual, isto só ajusta dicas e o botão. */
function useTelaMedia(): boolean {
  return useSyncExternalStore(subscribeTelaMedia, () => window.matchMedia(TELA_MEDIA).matches, () => false);
}

function SidebarLink({
  item,
  active,
  overdueCount,
  recolhido,
}: {
  item: NavItem;
  active: boolean;
  overdueCount: number;
  recolhido: boolean;
}) {
  const mostrarAtraso = item.showOverdue && overdueCount > 0;

  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        title={recolhido ? item.label : undefined}
        className={cn(
          "relative flex h-11 items-center gap-3 rounded-sm px-4 text-body-sm font-semibold transition-colors",
          "compacto:justify-center compacto:px-0",
          active ? "text-ink" : "text-body hover:bg-canvas-soft hover:text-ink",
        )}
      >
        {active && <span aria-hidden className="absolute top-3 left-1 h-5 w-1 rounded-pill bg-primary" />}
        <span className="relative shrink-0">
          {item.icon}
          {/* Recolhido, o contador de atraso vai para cima do ícone, como na barra do celular. */}
          {mostrarAtraso && (
            <span
              aria-hidden
              className="absolute -top-1.5 -right-2.5 hidden h-5 min-w-5 place-items-center rounded-pill bg-ink-deep px-1 text-caption text-primary compacto:grid"
            >
              {overdueCount}
            </span>
          )}
        </span>
        <span className="truncate compacto:sr-only">{item.label}</span>
        {mostrarAtraso && (
          <>
            <Badge tone="deep" size="sm" className="ml-auto compacto:hidden" aria-hidden>
              {overdueCount}
            </Badge>
            <span className="sr-only">, {overdueLabel(overdueCount)}</span>
          </>
        )}
      </Link>
    </li>
  );
}

function PlanCard({ plan }: { plan: PlanUsage }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl bg-canvas-soft p-6 compacto:hidden">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-body-sm font-semibold">{plan.nome}</span>
        <span className="text-caption text-body">
          {plan.usados} de {plan.limite}
        </span>
      </div>
      <div role="img" aria-label={`${plan.usados} de ${plan.limite} ${plan.unidade} usados`} className="flex h-2 gap-1">
        {Array.from({ length: plan.limite }, (_, i) => (
          <span key={i} className={cn("flex-1 rounded-pill", i < plan.usados ? "bg-ink-deep" : "bg-canvas")} />
        ))}
      </div>
      <Link href="/planos" className={buttonClass({ variant: "tertiary", size: "sm" })}>
        Ver planos
      </Link>
    </div>
  );
}

/**
 * Menu lateral do desktop: branco, linha ativa com indicador verde de 4px.
 * Recolhe para só ícones (72px) em tela média ou pelo botão; a escolha fica em cookie.
 */
export function Sidebar({ user, plan, overdueCount = 0, mode = "auto", currentPath, className }: SidebarProps) {
  const pathname = usePathname();
  const atual = currentPath ?? pathname;
  const [modo, setModo] = useState(mode);
  const telaMedia = useTelaMedia();
  const recolhido = modo === "fechado" || (modo === "auto" && telaMedia);
  const rotuloBotao = recolhido ? "Abrir menu" : "Recolher menu";

  function alternar() {
    const proximo = recolhido ? "aberto" : "fechado";
    setModo(proximo);
    saveMenuMode(proximo);
  }

  return (
    <nav
      aria-label="Menu principal"
      data-menu={modo}
      className={cn(
        "flex h-full w-62 flex-col gap-5 overflow-x-hidden overflow-y-auto bg-canvas px-3 pt-6 pb-5",
        "motion-safe:transition-[width] compacto:w-18",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2 compacto:flex-col compacto:gap-3">
        <Link href="/" aria-label="Caderno, início" className="rounded-sm px-4 pt-1 pb-2 compacto:px-0 compacto:pb-0">
          <Logo wordmarkClassName="compacto:hidden" />
        </Link>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={rotuloBotao}
          aria-expanded={!recolhido}
          title={rotuloBotao}
          onClick={alternar}
          className="text-body"
        >
          <PanelLeftIcon />
        </Button>
      </div>

      <ul className="flex flex-col gap-0.5">
        {mainNav.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActive(atual, item)}
            overdueCount={overdueCount}
            recolhido={recolhido}
          />
        ))}
      </ul>

      <hr className="mx-2 border-canvas-soft" />

      <ul className="flex flex-col gap-0.5">
        {secondaryNav.map((item) => (
          <SidebarLink
            key={item.href}
            item={item}
            active={isActive(atual, item)}
            overdueCount={overdueCount}
            recolhido={recolhido}
          />
        ))}
      </ul>

      <div className="mt-auto flex flex-col gap-3">
        {plan && <PlanCard plan={plan} />}
        <Link
          href="/perfil"
          aria-current={atual === "/perfil" ? "page" : undefined}
          title={recolhido ? `${user.nome} · Perfil e conta` : undefined}
          className="flex min-h-11 items-center gap-2.5 rounded-sm px-3 py-1 transition-colors hover:bg-canvas-soft compacto:justify-center compacto:px-0"
        >
          <span
            aria-hidden
            className="grid size-9 shrink-0 place-items-center rounded-pill bg-ink-deep text-caption font-semibold text-primary"
          >
            {initials(user.nome)}
          </span>
          <span className="flex min-w-0 flex-col compacto:sr-only">
            <span className="truncate text-body-sm font-semibold">{user.nome}</span>
            <span className="text-caption text-mute">Perfil e conta</span>
          </span>
        </Link>
      </div>
    </nav>
  );
}
