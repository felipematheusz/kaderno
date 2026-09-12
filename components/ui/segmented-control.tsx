import { cn } from "@/lib/cn";
import { segmentItemClass, segmentTrackClass } from "./segmented";

export type SegmentedOption<T extends string> = {
  value: T;
  label: string;
};

export type SegmentedControlProps<T extends string> = {
  label: string;
  /** Esconde o rótulo visualmente (continua para leitor de tela). */
  hideLabel?: boolean;
  name: string;
  options: readonly SegmentedOption<T>[];
  /** Controlado: exige `onValueChange`. */
  value?: T;
  defaultValue?: T;
  onValueChange?: (value: T) => void;
  /** Ocupa a largura toda, peças do mesmo tamanho. */
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
};

/**
 * Escolha única dentro de formulário (frequência: diária, semanal, quinzenal, mensal).
 * Usa rádios nativos: setas do teclado, envio no <form> e leitura "1 de 4" vêm de graça.
 */
export function SegmentedControl<T extends string>({
  label,
  hideLabel = false,
  name,
  options,
  value,
  defaultValue,
  onValueChange,
  fullWidth = false,
  disabled,
  className,
}: SegmentedControlProps<T>) {
  const controlado = value !== undefined;

  return (
    <fieldset disabled={disabled} className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <legend className={cn("mb-1.5 text-body-sm font-semibold", hideLabel && "sr-only")}>{label}</legend>
      <div className={cn(segmentTrackClass, fullWidth ? "flex w-full" : "self-start")}>
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              segmentItemClass,
              "cursor-pointer text-body hover:text-ink",
              "has-checked:bg-canvas has-checked:text-ink",
              "has-focus-visible:outline-2 has-focus-visible:outline-offset-0 has-focus-visible:outline-ink",
              "has-disabled:cursor-default has-disabled:opacity-40",
              fullWidth && "flex-1 px-3",
            )}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              className="sr-only"
              {...(controlado
                ? { checked: option.value === value, onChange: () => onValueChange?.(option.value) }
                : { defaultChecked: option.value === defaultValue })}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
