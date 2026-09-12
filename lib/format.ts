const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const inteiro = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/** Datas sempre no fuso do Brasil, mesmo quando renderizadas no servidor (UTC). */
const FUSO = "America/Sao_Paulo";

const diaSemana = new Intl.DateTimeFormat("pt-BR", { weekday: "long", timeZone: FUSO });
const diaMesAno = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: FUSO,
});

/** R$ 1.100,00 — para listas, tabelas e texto corrido. */
export function formatBRL(valor: number): string {
  return brl.format(valor);
}

/** Separa um valor em parte inteira ("1.100") e centavos ("00"). */
export function splitBRL(valor: number): { inteiro: string; centavos: string } {
  const centavosTotais = Math.round(Math.abs(valor) * 100);
  const sinal = valor < 0 ? "-" : "";
  return {
    inteiro: sinal + inteiro.format(Math.floor(centavosTotais / 100)),
    centavos: String(centavosTotais % 100).padStart(2, "0"),
  };
}

const hora = new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: FUSO });

/** "Bom dia" até meio-dia, "Boa tarde" até as 18h, depois "Boa noite" (horário de Brasília). */
export function greeting(data: Date): string {
  const h = Number(hora.format(data));
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

/** "Sexta, 11 de setembro de 2026" — data do cabeçalho de tela. */
export function formatLongDate(data: Date): string {
  const semana = diaSemana.format(data).split("-")[0];
  return `${semana.charAt(0).toUpperCase()}${semana.slice(1)}, ${diaMesAno.format(data)}`;
}

/** Só os dígitos de um texto ("123.456.789-00" → "12345678900"). */
export function onlyDigits(texto: string): string {
  return texto.replace(/\D/g, "");
}

/** 123.456.789-00. Devolve o texto original se não tiver 11 dígitos. */
export function formatCPF(cpf: string): string {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/** Minúsculas e sem acento, para comparar em buscas ("Antônio" casa com "antonio"). */
export function normalizeSearch(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

/** Iniciais para avatar: "Felipe Matheus Moura" → "FM". */
export function initials(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";
  const primeira = partes[0].charAt(0);
  const ultima = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
  return (primeira + ultima).toUpperCase();
}

const partesDia = new Intl.DateTimeFormat("pt-BR", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: FUSO,
});

const diaMes = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: FUSO });

const dataCompleta = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: FUSO,
});

const DIA = 86_400_000;

/** O dia de uma data no fuso do Brasil: "2026-09-12". É assim que vencimento anda pelo sistema. */
export function isoDate(data: Date): string {
  const partes = partesDia.formatToParts(data);
  const parte = (tipo: string) => partes.find((p) => p.type === tipo)?.value ?? "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

function emUTC(iso: string): number {
  const [ano, mes, dia] = iso.split("-").map(Number);
  return Date.UTC(ano, mes - 1, dia);
}

/** Meio-dia UTC do dia informado: formatar a partir daí não escorrega para o dia anterior. */
function meioDia(iso: string): Date {
  return new Date(emUTC(iso) + DIA / 2);
}

/** Quantos dias faltam para o vencimento. Negativo quando já passou. */
export function diasAte(iso: string, agora: Date): number {
  return Math.round((emUTC(iso) - emUTC(isoDate(agora))) / DIA);
}

function isoDoUTC(data: Date): string {
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${data.getUTCFullYear()}-${mes}-${dia}`;
}

/** O dia que cai daqui a `dias` (negativo para trás). */
export function isoEmDias(dias: number, agora: Date): string {
  return isoDoUTC(new Date(emUTC(isoDate(agora)) + dias * DIA));
}

/** O dia que cai `dias` depois do informado. */
export function somarDias(iso: string, dias: number): string {
  return isoDoUTC(new Date(emUTC(iso) + dias * DIA));
}

/** O mesmo dia `meses` à frente. Dia 31 em mês curto cai no último dia do mês. */
export function somarMeses(iso: string, meses: number): string {
  const [ano, mes, dia] = iso.split("-").map(Number);
  const alvo = new Date(Date.UTC(ano, mes - 1 + meses, 1));
  const ultimoDia = new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth() + 1, 0)).getUTCDate();
  return isoDoUTC(new Date(Date.UTC(alvo.getUTCFullYear(), alvo.getUTCMonth(), Math.min(dia, ultimoDia))));
}

/** "12/09/2026" — data por extenso curta, para cabeçalho e comprovante. */
export function formatDate(iso: string): string {
  return dataCompleta.format(meioDia(iso));
}

/** "07/09" — data curta de lista. */
export function formatShortDate(iso: string): string {
  return diaMes.format(meioDia(iso));
}

/** Coluna da esquerda da parcela: "hoje", "amanhã", "ontem" ou "07/09". */
export function prazoCurto(iso: string, agora: Date): string {
  const dias = diasAte(iso, agora);
  if (dias === 0) return "hoje";
  if (dias === 1) return "amanhã";
  if (dias === -1) return "ontem";
  return formatShortDate(iso);
}

/* ── Mês: a grade do calendário ─────────────────────────────────────── */

const mesAno = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric", timeZone: FUSO });
const mesCurto = new Intl.DateTimeFormat("pt-BR", { month: "short", timeZone: FUSO });
const diaPorExtenso = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: FUSO,
});

function maiuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Cabeçalho da grade do mês. A semana começa no domingo. */
export const DIAS_DA_SEMANA: readonly { curto: string; longo: string }[] = [
  { curto: "dom", longo: "domingo" },
  { curto: "seg", longo: "segunda-feira" },
  { curto: "ter", longo: "terça-feira" },
  { curto: "qua", longo: "quarta-feira" },
  { curto: "qui", longo: "quinta-feira" },
  { curto: "sex", longo: "sexta-feira" },
  { curto: "sáb", longo: "sábado" },
];

/** O mês de um dia: "2026-09-12" → "2026-09". */
export function mesDe(iso: string): string {
  return iso.slice(0, 7);
}

/** O mês corrente no fuso do Brasil: "2026-09". */
export function mesAtual(agora: Date): string {
  return mesDe(isoDate(agora));
}

/** "2026-09" é um mês de verdade? */
export function isMes(valor: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(valor);
}

/** "2026-09-12" é um dia de verdade? */
export function isDia(valor: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(valor) && isoDoUTC(new Date(emUTC(valor))) === valor;
}

/** O mês que cai `meses` à frente (negativo para trás). */
export function somarAoMes(mes: string, meses: number): string {
  return mesDe(somarMeses(`${mes}-01`, meses));
}

/** O número do dia: "2026-09-07" → 7. */
export function diaDoMes(iso: string): number {
  return Number(iso.slice(8));
}

/** Dia da semana: 0 é domingo. */
export function diaDaSemana(iso: string): number {
  return new Date(emUTC(iso)).getUTCDay();
}

/** Quantos dias tem o mês. */
export function diasNoMes(mes: string): number {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(Date.UTC(ano, numero, 0)).getUTCDate();
}

/** A grade do mês em semanas inteiras: começa no domingo e vai até o sábado da última semana. */
export function gradeDoMes(mes: string): readonly string[] {
  const primeiro = `${mes}-01`;
  const folgaInicial = diaDaSemana(primeiro);
  const inicio = somarDias(primeiro, -folgaInicial);
  const semanas = Math.ceil((folgaInicial + diasNoMes(mes)) / 7);
  return Array.from({ length: semanas * 7 }, (_, i) => somarDias(inicio, i));
}

/** "Setembro de 2026" — título do calendário. */
export function formatMonth(mes: string): string {
  return maiuscula(mesAno.format(meioDia(`${mes}-01`)));
}

/** "Set" — rótulo curto de mês, para a coluna do gráfico. */
export function formatMonthShort(mes: string): string {
  return maiuscula(mesCurto.format(meioDia(`${mes}-01`)).replace(".", ""));
}

/** O último dia do mês: "2026-09" → "2026-09-30". */
export function fimDoMes(mes: string): string {
  return `${mes}-${String(diasNoMes(mes)).padStart(2, "0")}`;
}

/** "Sábado, 12 de setembro" — cabeçalho do dia escolhido. */
export function formatDayLong(iso: string): string {
  return maiuscula(diaPorExtenso.format(meioDia(iso)));
}

/** "R$ 1.100" — sem centavos, para o que precisa caber apertado (célula do calendário). */
export function formatBRLCurto(valor: number): string {
  return `R$ ${inteiro.format(Math.round(valor))}`;
}
