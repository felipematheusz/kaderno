import { useId, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

export type SwitchProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "role" | "size"> & {
  label: string;
  /** Explicação curta abaixo do rótulo. */
  description?: string;
};

/**
 * Liga/desliga imediato (notificações push, cobrar juros em atraso).
 * Checkbox nativo com `role="switch"`: funciona em <form> e sem JavaScript.
 */
export function Switch({ label, description, className, id, ...props }: SwitchProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const descId = `${inputId}-desc`;

  return (
    <label htmlFor={inputId} className={cn("flex min-h-11 cursor-pointer items-center gap-4", className)}>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-md font-semibold">{label}</span>
        {description && (
          <span id={descId} className="text-body-sm text-body">
            {description}
          </span>
        )}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          id={inputId}
          type="checkbox"
          role="switch"
          aria-describedby={description ? descId : undefined}
          className="peer sr-only"
          {...props}
        />
        <span
          aria-hidden
          className={cn(
            "h-8 w-13 rounded-pill bg-mute transition-colors",
            "peer-checked:bg-ink-deep",
            "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ink",
            "peer-disabled:opacity-40",
          )}
        />
        <span
          aria-hidden
          className="absolute top-1 left-1 size-6 rounded-pill bg-canvas transition-transform peer-checked:translate-x-5 peer-checked:bg-primary"
        />
      </span>
    </label>
  );
}
