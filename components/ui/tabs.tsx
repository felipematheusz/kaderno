"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { segmentActiveClass, segmentIdleClass, segmentItemClass, segmentTrackClass } from "./segmented";

type TabsContextValue = {
  value: string;
  select: (value: string) => void;
  baseId: string;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabs(componente: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${componente}> precisa estar dentro de <Tabs>.`);
  return ctx;
}

export type TabsProps = {
  /** Aba ativa (controlado). */
  value?: string;
  /** Aba inicial (não controlado). */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
};

/**
 * Abas que trocam conteúdo na mesma tela (Todas / Não lidas).
 * Quando a troca muda a URL (Contratos / Vendas), prefira `NavTabs`.
 */
export function Tabs({ value, defaultValue = "", onValueChange, children, className }: TabsProps) {
  const [interno, setInterno] = useState(defaultValue);
  const baseId = useId();
  const atual = value ?? interno;

  function select(proximo: string) {
    if (value === undefined) setInterno(proximo);
    onValueChange?.(proximo);
  }

  return (
    <TabsContext value={{ value: atual, select, baseId }}>
      <div className={cn("flex flex-col gap-4", className)}>{children}</div>
    </TabsContext>
  );
}

export type TabListProps = HTMLAttributes<HTMLDivElement> & {
  /** Nome do conjunto de abas para leitor de tela. */
  "aria-label": string;
};

export function TabList({ className, onKeyDown, ...props }: TabListProps) {
  const { select } = useTabs("TabList");

  // Setas, Home e End movem entre as abas e já ativam (padrão WAI-ARIA com ativação automática).
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    onKeyDown?.(event);
    const tabs = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="tab"]:not(:disabled)'));
    const atual = tabs.findIndex((tab) => tab === document.activeElement);
    if (atual === -1) return;

    const destino: Record<string, number> = {
      ArrowRight: (atual + 1) % tabs.length,
      ArrowLeft: (atual - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    };
    const indice = destino[event.key];
    if (indice === undefined) return;

    event.preventDefault();
    const tab = tabs[indice];
    tab.focus();
    const valor = tab.dataset.value;
    if (valor !== undefined) select(valor);
  }

  return (
    <div role="tablist" className={cn(segmentTrackClass, "self-start", className)} onKeyDown={handleKeyDown} {...props} />
  );
}

export type TabProps = Omit<HTMLAttributes<HTMLButtonElement>, "children"> & {
  value: string;
  children: ReactNode;
  /** Contador ao lado do rótulo ("Não lidas 3"). */
  count?: number;
  disabled?: boolean;
};

export function Tab({ value, children, count, disabled, className, ...props }: TabProps) {
  const { value: ativo, select, baseId } = useTabs("Tab");
  const selecionada = ativo === value;

  return (
    <button
      type="button"
      role="tab"
      id={`${baseId}-tab-${value}`}
      aria-controls={`${baseId}-panel-${value}`}
      aria-selected={selecionada}
      tabIndex={selecionada ? 0 : -1}
      data-value={value}
      disabled={disabled}
      onClick={() => select(value)}
      className={cn(
        segmentItemClass,
        selecionada ? segmentActiveClass : segmentIdleClass,
        "disabled:pointer-events-none disabled:opacity-40",
        className,
      )}
      {...props}
    >
      {children}
      {count !== undefined && <span className="text-caption text-mute">{count}</span>}
    </button>
  );
}

export type TabPanelProps = HTMLAttributes<HTMLDivElement> & { value: string };

export function TabPanel({ value, className, ...props }: TabPanelProps) {
  const { value: ativo, baseId } = useTabs("TabPanel");

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      hidden={ativo !== value}
      tabIndex={0}
      className={className}
      {...props}
    />
  );
}
