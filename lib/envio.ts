import type { FormEvent } from "react";

/**
 * Dá ao envio do formulário uma chave única, gerada no primeiro clique e mantida nos seguintes.
 * Clique duplo ou reenvio chega ao servidor com a mesma chave e não grava duas vezes.
 * O formulário precisa de um `<input type="hidden" name="chave" />`.
 */
export function marcarEnvio(evento: FormEvent<HTMLFormElement>): void {
  const campo = evento.currentTarget.elements.namedItem("chave");
  if (campo instanceof HTMLInputElement && campo.value === "") campo.value = crypto.randomUUID();
}
