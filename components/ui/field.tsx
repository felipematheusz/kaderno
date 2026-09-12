import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Atributos que ligam o controle ao rótulo e à mensagem. */
export type FieldControlProps = {
  id: string;
  "aria-invalid"?: true;
  "aria-describedby"?: string;
};

export type FieldFrameProps = {
  label: string;
  /** Texto de apoio abaixo do campo. */
  hint?: string;
  /** Mensagem de erro: diz o que aconteceu e o que fazer. */
  error?: string;
  id?: string;
  className?: string;
  children: (control: FieldControlProps) => ReactNode;
};

/**
 * Rótulo + controle + mensagem. Base de Field, Select, Textarea, MoneyInput e ClientSearch,
 * para todos terem o mesmo rótulo, a mesma ligação de acessibilidade e o mesmo erro.
 */
export function FieldFrame({ label, hint, error, id, className, children }: FieldFrameProps) {
  const autoId = useId();
  const controlId = id ?? autoId;
  const hintId = `${controlId}-hint`;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={controlId} className="text-body-sm font-semibold">
        {label}
      </label>
      {children({
        id: controlId,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": error || hint ? hintId : undefined,
      })}
      {(error || hint) && (
        <p id={hintId} className={cn("text-caption", error ? "text-negative-darkest" : "text-mute")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

/** Caixa do campo: contorno 1px tinta, canto 12, foco de 2px tinta, borda vermelha no erro. */
export function fieldBoxClass({ error, size = "md" }: { error?: string; size?: "md" | "lg" | "auto" }): string {
  return cn(
    "flex items-center gap-2.5 rounded-md border bg-canvas px-4",
    "focus-within:outline-2 focus-within:outline-offset-0 focus-within:outline-ink",
    size === "lg" && "h-14",
    size === "md" && "h-12",
    error ? "border-negative" : "border-ink",
  );
}

export type FieldProps = Omit<ComponentPropsWithRef<"input">, "size"> & {
  label: string;
  hint?: string;
  error?: string;
  /** Elemento à esquerda (ícone de busca). */
  leading?: ReactNode;
  /** Elemento à direita (BRL, %, ícone de calendário). */
  trailing?: ReactNode;
  /** "lg" para valores em dinheiro: 56px e texto maior. */
  size?: "md" | "lg";
};

export function Field({
  label,
  hint,
  error,
  leading,
  trailing,
  size = "md",
  className,
  id,
  ...props
}: FieldProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <div className={fieldBoxClass({ error, size })}>
          {leading}
          <input
            {...control}
            className={cn(
              "min-w-0 flex-1 bg-transparent outline-none placeholder:text-mute",
              size === "lg" ? "text-display-xs" : "text-body-md",
            )}
            {...props}
          />
          {trailing}
        </div>
      )}
    </FieldFrame>
  );
}
