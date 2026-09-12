import type { SelectHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FieldFrame, fieldBoxClass } from "./field";
import { ChevronDownIcon } from "./icons";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children" | "multiple"> & {
  label: string;
  hint?: string;
  error?: string;
  options: readonly SelectOption[];
  /** Primeira opção vazia ("Escolha..."), não selecionável depois de trocar. */
  placeholder?: string;
};

/** `<select>` nativo no visual do Field. No celular abre a roleta do sistema. */
export function Select({ label, hint, error, options, placeholder, className, id, ...props }: SelectProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <div className={cn(fieldBoxClass({ error }), "relative")}>
          <select
            {...control}
            className="absolute inset-0 w-full cursor-pointer appearance-none rounded-md bg-transparent pr-11 pl-4 text-body-md outline-none"
            {...props}
          >
            {placeholder !== undefined && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="pointer-events-none absolute right-4 text-ink" />
        </div>
      )}
    </FieldFrame>
  );
}
