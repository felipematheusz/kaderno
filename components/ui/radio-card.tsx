import type { FieldsetHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";

export type RadioCardProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & {
  title: string;
  description?: string;
  /** À direita: normalmente o valor daquela opção ("R$ 366,67"). */
  trailing?: ReactNode;
};

/**
 * Opção grande de escolha única (formas de receber a parcela).
 * Selecionada: contorno tinta e fundo verde-pálido.
 */
export function RadioCard({ title, description, trailing, className, ...props }: RadioCardProps) {
  return (
    <label
      className={cn(
        "group flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-transparent bg-canvas-soft p-4 transition-colors",
        "hover:bg-primary-pale has-checked:border-ink has-checked:bg-primary-pale",
        "has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ink",
        "has-disabled:cursor-default has-disabled:opacity-40",
        className,
      )}
    >
      <input type="radio" className="sr-only" {...props} />
      <span aria-hidden className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-pill border-2 border-ink bg-canvas">
        <span className="size-2.5 rounded-pill bg-ink opacity-0 transition-opacity group-has-checked:opacity-100" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-body-md font-semibold">{title}</span>
        {description && <span className="text-body-sm text-body">{description}</span>}
      </span>
      {trailing && <span className="shrink-0 text-body-md font-semibold">{trailing}</span>}
    </label>
  );
}

export type RadioCardGroupProps = FieldsetHTMLAttributes<HTMLFieldSetElement> & {
  label: string;
  hideLabel?: boolean;
};

/** Agrupa os RadioCards com um rótulo. Os rádios de dentro precisam do mesmo `name`. */
export function RadioCardGroup({ label, hideLabel = false, className, children, ...props }: RadioCardGroupProps) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2", className)} {...props}>
      <legend className={cn("mb-1.5 text-body-sm font-semibold", hideLabel && "sr-only")}>{label}</legend>
      {children}
    </fieldset>
  );
}
