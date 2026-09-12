import Link from "next/link";
import { cn } from "@/lib/cn";
import { segmentActiveClass, segmentIdleClass, segmentItemClass, segmentTrackClass } from "./segmented";

export type NavTabItem = {
  href: string;
  label: string;
  active: boolean;
};

export type NavTabsProps = {
  items: readonly NavTabItem[];
  "aria-label": string;
  className?: string;
};

/**
 * Mesmo visual das abas, mas cada peça é um link (a troca muda a URL).
 * Ex.: Contratos / Vendas em `/contratos` e `/contratos?modo=venda`.
 */
export function NavTabs({ items, className, ...props }: NavTabsProps) {
  return (
    <nav className={cn(segmentTrackClass, "self-start", className)} {...props}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={item.active ? "page" : undefined}
          className={cn(segmentItemClass, item.active ? segmentActiveClass : segmentIdleClass)}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
