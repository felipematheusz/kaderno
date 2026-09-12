import Link from "next/link";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

type ChipBase = {
  selected?: boolean;
  /** Quantidade ao lado do rótulo ("Atrasados 2"). */
  count?: number;
  /** Superfície onde o filtro está: na sálvia o filtro é branco; no branco, sálvia. */
  on?: "sage" | "canvas";
  children: ReactNode;
  className?: string;
};

type FilterChipLinkProps = ChipBase & { href: string };
type FilterChipButtonProps = ChipBase &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & { href?: undefined };

/** Com `href` vira link (filtro na URL); sem `href`, botão com `aria-pressed`. */
export type FilterChipProps = FilterChipLinkProps | FilterChipButtonProps;

function chipClass({ selected, on = "sage", className }: Pick<ChipBase, "selected" | "on" | "className">) {
  return cn(
    "inline-flex h-11 shrink-0 items-center gap-2 rounded-pill px-4 text-body-sm font-semibold whitespace-nowrap transition-colors",
    selected
      ? "bg-ink-deep text-primary"
      : cn("text-ink hover:bg-primary-pale", on === "sage" ? "bg-canvas" : "bg-canvas-soft"),
    className,
  );
}

function Count({ value }: { value?: number }) {
  if (value === undefined) return null;
  return <span className="text-caption opacity-70">{value}</span>;
}

export function FilterChip(props: FilterChipProps) {
  if (props.href !== undefined) {
    const { href, selected = false, count, on, children, className } = props;
    return (
      <Link href={href} aria-current={selected ? "true" : undefined} className={chipClass({ selected, on, className })}>
        {children}
        <Count value={count} />
      </Link>
    );
  }

  const { selected = false, count, on, children, className, type = "button", ...rest } = props;
  return (
    <button type={type} aria-pressed={selected} className={chipClass({ selected, on, className })} {...rest}>
      {children}
      <Count value={count} />
    </button>
  );
}

export type FilterChipsProps = HTMLAttributes<HTMLDivElement> & { "aria-label": string };

/** Grupo de filtros em pílula. Quebra linha no celular. */
export function FilterChips({ className, ...props }: FilterChipsProps) {
  return <div role="group" className={cn("flex flex-wrap gap-2", className)} {...props} />;
}
