import * as z from "zod";
import { canal, forma, frequencia, jurosSobre, tipoContrato } from "./campos";

/*
 * O formato do que as leituras devolvem. As telas usam os tipos; a IA, a descrição.
 * Campo sem valor não vem (em vez de vir null).
 */

const fita = z.enum(["paga", "proxima", "atrasada", "futura"]);

export const clienteVisao = z.object({
  id: z.uuid(),
  nome: z.string(),
  apelido: z.string().optional(),
  cpf: z.string().optional().describe("só dígitos"),
  telefone: z.string().optional(),
  email: z.string().optional(),
  endereco: z.string().optional(),
  score: z.number().optional().describe("0 a 100"),
  desde: z.string().describe("dia do cadastro"),
  contratosAtivos: z.int().describe("contratos em aberto; quitado não conta"),
  emprestado: z.number(),
  recebido: z.number(),
  aReceber: z.number(),
  alerta: z.string().optional().describe('"1 parcela atrasada", quando houver'),
});

export const contratoVisao = z.object({
  id: z.uuid(),
  numero: z.string().describe('"#0042"'),
  clienteId: z.uuid(),
  cliente: z.string().describe("nome do cliente"),
  telefone: z.string().optional(),
  tipo: tipoContrato,
  produto: z.string().optional(),
  custo: z.number().optional(),
  entrada: z.number().optional(),
  principal: z.number().describe("valor emprestado ou preço da venda"),
  taxa: z.number().describe("% ao mês"),
  jurosSobre,
  frequencia,
  jurosEmAtraso: z.boolean(),
  observacao: z.string().optional(),
  criadoEm: z.string(),
  repassadoEm: z.string().optional().describe("dia em que o dinheiro foi enviado ao cliente"),
  canalRepasse: canal.optional(),
  totalParcelas: z.int(),
  valor: z.number().describe("total a receber no contrato, com juros"),
  recebido: z.number(),
  aReceber: z.number(),
  juros: z.number().describe("juro do contrato inteiro"),
  pagas: z.int(),
  parcelas: z.array(fita).describe("situação de cada parcela, em ordem"),
  situacao: z.enum(["em-dia", "atrasado", "quitado"]),
  alerta: z.string().optional().describe('"4 dias atrasada", quando houver atraso'),
  primeiroVencimento: z.string(),
});

export const parcelaVisao = z.object({
  id: z.uuid(),
  contratoId: z.uuid(),
  contrato: z.string().describe('número do contrato: "#0042"'),
  clienteId: z.uuid(),
  cliente: z.string(),
  telefone: z.string().optional(),
  tipo: tipoContrato,
  numero: z.int(),
  parcela: z.object({ numero: z.int(), total: z.int() }),
  vencimento: z.string(),
  valor: z.number(),
  pago: z.boolean(),
  pagoEm: z.string().optional(),
  valorRecebido: z.number().optional(),
  detalhe: z.string().optional().describe('"recebida via Pix"'),
  observacao: z.string().optional(),
  renegociada: z.boolean(),
  reciboId: z.uuid().optional(),
});

export const reciboVisao = z.object({
  id: z.uuid(),
  contratoId: z.uuid(),
  numeroContrato: z.string(),
  cliente: z.string(),
  parcela: z.object({ numero: z.int(), total: z.int() }),
  valor: z.number(),
  forma,
  canal,
  data: z.string(),
});

export const avisosVisao = z.object({ vencimentos: z.boolean(), atrasos: z.boolean(), resumo: z.boolean() });

export const perfilVisao = z.object({
  nome: z.string(),
  email: z.string(),
  telefone: z.string().optional(),
  desde: z.string(),
  avisos: avisosVisao,
});

export const contaVisao = z.object({
  usuario: z.object({ nome: z.string() }),
  plano: z.object({ nome: z.string(), usados: z.int(), limite: z.int(), unidade: z.string() }).optional(),
  atrasadas: z.int().describe("quantas parcelas estão atrasadas"),
});

export const balancoVisao = z.object({
  emprestado: z.number(),
  recebido: z.number(),
  aVencer: z.number(),
  atrasado: z.number(),
  jurosPrevistos: z.number().describe('parte do "a receber" que é juro'),
});

export const inicioVisao = z.object({
  balanco: balancoVisao,
  agenda: z.array(parcelaVisao).describe("atrasadas, as de hoje e as de amanhã"),
  venceHoje: z.int(),
  recebidoHoje: z.number(),
  contratos: z.array(contratoVisao).describe("os primeiros contratos ativos"),
  totalContratosAtivos: z.int(),
});

export const recorte = z.enum(["todos", "abertos"]).describe("todos os contratos ou só os ainda em aberto");
export const periodo = z.enum(["mes", "30", "90"]).describe("até o fim do mês, 30 ou 90 dias");

export const relatorioVisao = z.object({
  totais: z.object({
    emprestado: z.number(),
    recebido: z.number(),
    aReceber: z.number(),
    lucro: z.number(),
    lucroRealizado: z.number(),
    contratos: z.int(),
  }),
  projecao: z.array(
    z.object({ tipo: tipoContrato, parcelas: z.int(), aReceber: z.number(), juros: z.number(), vencido: z.number() }),
  ),
  fluxo: z.array(z.object({ mes: z.string(), entrada: z.number(), saida: z.number() })).describe("últimos seis meses"),
});

export const eventoVisao = z.object({
  id: z.string(),
  tipo: z.enum(["pagamento", "contrato", "cliente"]),
  data: z.string(),
  titulo: z.string(),
  detalhe: z.string(),
  valor: z.number().optional(),
  href: z.string().optional(),
});

export type Cliente = z.infer<typeof clienteVisao>;
export type Contrato = z.infer<typeof contratoVisao>;
export type Parcela = z.infer<typeof parcelaVisao>;
export type Recibo = z.infer<typeof reciboVisao>;
export type Perfil = z.infer<typeof perfilVisao>;
export type Avisos = z.infer<typeof avisosVisao>;
export type Conta = z.infer<typeof contaVisao>;
export type Balanco = z.infer<typeof balancoVisao>;
export type Inicio = z.infer<typeof inicioVisao>;
export type RecorteRelatorio = z.infer<typeof recorte>;
export type PeriodoProjecao = z.infer<typeof periodo>;
export type Relatorio = z.infer<typeof relatorioVisao>;
export type LinhaProjecao = Relatorio["projecao"][number];
export type Evento = z.infer<typeof eventoVisao>;
export type FormaRecebimento = z.infer<typeof forma>;
export type CanalRecebimento = z.infer<typeof canal>;
