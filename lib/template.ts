/** Pedaço de um modelo de mensagem: texto fixo ou variável ({nome}, {valor}...). */
export type TemplatePart =
  | { tipo: "texto"; texto: string }
  | { tipo: "variavel"; nome: string; valor: string | undefined };

const VARIAVEL = /\{(\w+)\}/g;

/** Quebra o modelo em texto e variáveis, já com o valor de cada uma (se houver). */
export function parseTemplate(modelo: string, valores: Readonly<Record<string, string>>): TemplatePart[] {
  const partes: TemplatePart[] = [];
  let ultimo = 0;

  for (const match of modelo.matchAll(VARIAVEL)) {
    const inicio = match.index;
    if (inicio > ultimo) partes.push({ tipo: "texto", texto: modelo.slice(ultimo, inicio) });
    const nome = match[1];
    partes.push({ tipo: "variavel", nome, valor: valores[nome] });
    ultimo = inicio + match[0].length;
  }

  if (ultimo < modelo.length) partes.push({ tipo: "texto", texto: modelo.slice(ultimo) });
  return partes;
}

/** Texto final para enviar: troca cada {variavel} pelo valor; sem valor, mantém a marcação. */
export function fillTemplate(modelo: string, valores: Readonly<Record<string, string>>): string {
  return modelo.replace(VARIAVEL, (marcacao, nome: string) => valores[nome] ?? marcacao);
}
