/** Quantos itens cabem numa página. Listas em linha usam este; a grade de cartões usa 24. */
export const POR_PAGINA = 20;

export type EstadoPaginacao = {
  /** Página atual, começando em 1 e já dentro do intervalo válido. */
  pagina: number;
  paginas: number;
  total: number;
  /** Posição do primeiro e do último item da página dentro da lista inteira. */
  primeiro: number;
  ultimo: number;
};

/** Lê `?pagina=` da URL. Lixo, zero ou negativo caem na primeira página. */
export function lerPagina(valor: string | string[] | undefined): number {
  const texto = Array.isArray(valor) ? valor[0] : valor;
  const numero = Number(texto);
  return Number.isInteger(numero) && numero > 1 ? numero : 1;
}

/** Em que página cai o item nessa posição. Serve para abrir a lista já no que interessa. */
export function paginaDoItem(indice: number, tamanho: number = POR_PAGINA): number {
  return indice < 0 ? 1 : Math.floor(indice / tamanho) + 1;
}

/**
 * Corta a lista na página pedida. Página fora do intervalo é puxada para a borda,
 * então URL adulterada nunca devolve tela vazia.
 */
export function paginar<T>(
  lista: readonly T[],
  pagina: number,
  tamanho: number = POR_PAGINA,
): { itens: readonly T[]; paginacao: EstadoPaginacao } {
  const total = lista.length;
  const paginas = Math.max(1, Math.ceil(total / tamanho));
  const atual = Math.min(Math.max(1, Math.trunc(pagina)), paginas);
  const inicio = (atual - 1) * tamanho;
  const itens = lista.slice(inicio, inicio + tamanho);

  return {
    itens,
    paginacao: {
      pagina: atual,
      paginas,
      total,
      primeiro: total === 0 ? 0 : inicio + 1,
      ultimo: inicio + itens.length,
    },
  };
}
