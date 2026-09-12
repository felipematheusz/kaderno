"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { MoreIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { isActive, mobileNav, moreNav, overdueLabel } from "./nav";

export type BottomNavProps = {
  overdueCount?: number;
  /** Força a rota atual (vitrine, testes). Por padrão lê da URL. */
  currentPath?: string;
  className?: string;
};

const itemClass = "relative flex min-h-16 flex-col items-center justify-center gap-1 text-caption font-semibold";

function Indicator({ active }: { active: boolean }) {
  if (!active) return null;
  return <span aria-hidden className="absolute top-0 h-1 w-8 rounded-pill bg-primary" />;
}

function OverdueDot({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <>
      <span
        aria-hidden
        className="absolute -top-1.5 -right-2.5 grid h-5 min-w-5 place-items-center rounded-pill bg-negative-bg px-1 text-caption text-canvas"
      >
        {count}
      </span>
      <span className="sr-only">, {overdueLabel(count)}</span>
    </>
  );
}

function IconSlot({ children }: { children: ReactNode }) {
  return <span className="relative">{children}</span>;
}

/** Barra inferior do celular: Início, Clientes, Contratos, Parcelas e Mais. */
export function BottomNav({ overdueCount = 0, currentPath, className }: BottomNavProps) {
  const pathname = usePathname();
  const atual = currentPath ?? pathname;
  const [maisAberto, setMaisAberto] = useState(false);
  const maisAtivo = moreNav.some((item) => isActive(atual, item));

  return (
    <>
      <nav
        aria-label="Menu principal"
        className={cn("grid grid-cols-5 bg-canvas pb-[env(safe-area-inset-bottom)]", className)}
      >
        {mobileNav.map((item) => {
          const ativo = isActive(atual, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={ativo ? "page" : undefined}
              className={cn(itemClass, ativo ? "text-ink" : "text-body")}
            >
              <Indicator active={ativo} />
              <IconSlot>
                {item.icon}
                {item.showOverdue && <OverdueDot count={overdueCount} />}
              </IconSlot>
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          aria-haspopup="dialog"
          aria-expanded={maisAberto}
          onClick={() => setMaisAberto(true)}
          className={cn(itemClass, maisAtivo ? "text-ink" : "text-body")}
        >
          <Indicator active={maisAtivo} />
          <MoreIcon />
          Mais
        </button>
      </nav>

      <Modal open={maisAberto} onClose={() => setMaisAberto(false)} title="Mais" placement="sheet">
        <ul className="flex flex-col gap-0.5">
          {moreNav.map((item) => {
            const ativo = isActive(atual, item);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMaisAberto(false)}
                  aria-current={ativo ? "page" : undefined}
                  className={cn(
                    "relative flex h-12 items-center gap-3 rounded-sm px-4 text-body-md font-semibold transition-colors",
                    ativo ? "text-ink" : "text-body hover:bg-canvas-soft hover:text-ink",
                  )}
                >
                  {ativo && <span aria-hidden className="absolute top-3.5 left-1 h-5 w-1 rounded-pill bg-primary" />}
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </Modal>
    </>
  );
}
