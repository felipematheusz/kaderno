import { cn } from "@/lib/cn";
import { parseTemplate } from "@/lib/template";

export type MessagePreviewProps = {
  /** Modelo com variáveis: "Oi {nome}, sua parcela de {valor} vence {vencimento}." */
  template: string;
  /** Valores de exemplo (primeiro contrato) ou do contrato real. */
  values: Readonly<Record<string, string>>;
  /** Hora exibida no balão ("09:41"). */
  time?: string;
  className?: string;
};

/**
 * Prévia da mensagem de cobrança: balão com as variáveis já preenchidas.
 * Variável sem valor aparece marcada em vermelho para o usuário perceber antes de enviar.
 */
export function MessagePreview({ template, values, time, className }: MessagePreviewProps) {
  const partes = parseTemplate(template, values);

  return (
    <figure className={cn("flex flex-col rounded-xl bg-canvas-soft p-4", className)}>
      <figcaption className="sr-only">Prévia da mensagem</figcaption>
      <div className="ml-auto flex max-w-[85%] flex-col gap-1 rounded-lg rounded-br-sm bg-primary-pale px-4 py-3">
        <p className="text-body-md break-words whitespace-pre-wrap text-ink">
          {partes.map((parte, i) =>
            parte.tipo === "texto" ? (
              parte.texto
            ) : parte.valor !== undefined ? (
              <strong key={i} className="font-semibold">
                {parte.valor}
              </strong>
            ) : (
              <span
                key={i}
                title="Variável sem valor"
                className="font-semibold text-negative-darkest underline decoration-dotted underline-offset-4"
              >
                {`{${parte.nome}}`}
              </span>
            ),
          )}
        </p>
        {time && <span className="self-end text-caption text-body">{time}</span>}
      </div>
    </figure>
  );
}
