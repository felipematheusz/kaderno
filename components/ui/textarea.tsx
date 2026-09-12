import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import { FieldFrame, fieldBoxClass } from "./field";

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

/** Texto longo (observação do contrato, detalhes do acordo) no visual do Field. */
export function Textarea({ label, hint, error, className, id, rows = 4, ...props }: TextareaProps) {
  return (
    <FieldFrame label={label} hint={hint} error={error} id={id} className={className}>
      {(control) => (
        <div className={cn(fieldBoxClass({ error, size: "auto" }), "items-stretch py-3")}>
          <textarea
            {...control}
            rows={rows}
            className="min-h-12 w-full resize-y bg-transparent text-body-md outline-none placeholder:text-mute"
            {...props}
          />
        </div>
      )}
    </FieldFrame>
  );
}
