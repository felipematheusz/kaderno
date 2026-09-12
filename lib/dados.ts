import type { MesDeFluxo } from "@/components/domain/monthly-flow";
import type { TipoEvento } from "@/components/domain/timeline-row";
import type { PlanUsage, ShellUser } from "@/components/shell/sidebar";
import type { InstallmentStatus } from "@/components/ui/installment-bar";
import { arredondar, gerarParcelas, simular, vencimentoDe, type Frequencia, type JurosSobre } from "./contrato";
import { atrasoLabel, situacaoContrato, type SituacaoContrato } from "./emprestimos";
import {
  diasAte,
  fimDoMes,
  formatShortDate,
  isoDate,
  isoEmDias,
  mesAtual,
  mesDe,
  somarAoMes,
  somarDias,
} from "./format";

/*
 * O "banco" enquanto o de verdade não está ligado: três listas na memória do servidor.
 * As telas só conhecem as funções daqui; trocar o miolo por SQL não mexe em nenhuma tela.
 *
 * Como está na memória do processo, o que for criado some quando o servidor reinicia.
 * O estado fica no globalThis para sobreviver ao recarregamento de módulo do `next dev`.
 */

/* ── O que fica guardado ────────────────────────────────────────────── */

type ClienteRegistro = {
  id: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
  /** Score de crédito de 0 a 100. */
  score?: number;
  /** Dia do cadastro em ISO. */
  desde: string;
};

type ContratoRegistro = {
  id: string;
  /** "#0042". */
  numero: string;
  clienteId: string;
  tipo: "emprestimo" | "venda";
  /** Venda: o que foi vendido. */
  produto?: string;
  /** Venda: quanto o produto custou para você. Só entra no lucro. */
  custo?: number;
  /** Venda: parte paga na hora, fora do parcelamento. */
  entrada?: number;
  principal: number;
  /** Juros em % ao mês; zero é contrato de valor fixo. */
  taxa: number;
  jurosSobre: JurosSobre;
  frequencia: Frequencia;
  /** Soma 1% ao dia depois do vencimento. Hoje só fica registrado. */
  jurosEmAtraso: boolean;
  observacao?: string;
  criadoEm: string;
};

type ParcelaRegistro = {
  id: string;
  contratoId: string;
  numero: number;
  vencimento: string;
  valor: number;
  pago: boolean;
  pagoEm?: string;
  valorRecebido?: number;
  /** Complemento da linha: "recebida via Pix". */
  detalhe?: string;
  /** Combinado da renegociação. */
  observacao?: string;
  renegociada?: boolean;
  /** Comprovante que deu baixa nela. As parcelas do exemplo inicial não têm. */
  reciboId?: string;
};

export type FormaRecebimento =
  /** Quitou a parcela. */
  | "parcela"
  /** Pagou só o juro: a parcela continua em aberto e vai para o próximo vencimento. */
  | "juros"
  /** Juros mais um pedaço da dívida. */
  | "parcial"
  /** Pagou tudo o que falta do contrato. */
  | "quitacao";

export type CanalRecebimento = "pix" | "dinheiro" | "transferencia" | "cartao";

export type Recibo = {
  id: string;
  contratoId: string;
  numeroContrato: string;
  cliente: string;
  parcela: { numero: number; total: number };
  valor: number;
  forma: FormaRecebimento;
  canal: CanalRecebimento;
  /** Dia informado no recebimento. */
  data: string;
};

/** O que o Caderno avisa. Cada chave é uma chave do painel de avisos do perfil. */
type AvisoChave = "vencimentos" | "atrasos" | "resumo";

type PerfilRegistro = {
  nome: string;
  email: string;
  telefone?: string;
  /** Enquanto não há login de verdade, a senha mora aqui só para a troca funcionar. */
  senha: string;
  /** Dia em que a conta foi aberta, em ISO. */
  desde: string;
  avisos: Record<AvisoChave, boolean>;
};

type Store = {
  perfil: PerfilRegistro;
  clientes: ClienteRegistro[];
  contratos: ContratoRegistro[];
  parcelas: ParcelaRegistro[];
  recibos: Recibo[];
  /** De onde sai o próximo número de contrato. */
  sequencia: number;
};

/* ── O que as telas veem ────────────────────────────────────────────── */

export type Avisos = Record<AvisoChave, boolean>;

/** O dono da conta, sem a senha. */
export type Perfil = Omit<PerfilRegistro, "senha">;

export type Conta = {
  usuario: ShellUser;
  /** Omitido em plano sem limite. */
  plano?: PlanUsage;
  /** Parcelas atrasadas: contador do menu. */
  atrasadas: number;
};

export type Cliente = ClienteRegistro & {
  /** Contratos em aberto; quitado não conta. */
  contratosAtivos: number;
  emprestado: number;
  recebido: number;
  aReceber: number;
  /** "1 parcela atrasada", quando houver. */
  alerta?: string;
};

export type Contrato = Omit<ContratoRegistro, "clienteId"> & {
  clienteId: string;
  cliente: string;
  telefone?: string;
  totalParcelas: number;
  /** Total a receber no contrato, com juros. */
  valor: number;
  recebido: number;
  aReceber: number;
  /** Juro do contrato inteiro. */
  juros: number;
  pagas: number;
  /** A fita de parcelas do andamento. */
  parcelas: readonly InstallmentStatus[];
  situacao: SituacaoContrato;
  /** Texto do selo quando há atraso: "4 dias atrasada". */
  alerta?: string;
  primeiroVencimento: string;
};

export type Parcela = ParcelaRegistro & {
  /** "#0039". */
  contrato: string;
  clienteId: string;
  cliente: string;
  telefone?: string;
  tipo: "emprestimo" | "venda";
  parcela: { numero: number; total: number };
};

export type Balanco = {
  emprestado: number;
  recebido: number;
  aVencer: number;
  atrasado: number;
  /** Parte do "a receber" que é juro. */
  jurosPrevistos: number;
};

export type Inicio = {
  balanco: Balanco;
  /** Cartão "Parcelas de hoje": o que está atrasado, o que vence hoje e o que vence amanhã. */
  agenda: readonly Parcela[];
  /** Vencem hoje e ainda não foram pagas. */
  venceHoje: number;
  recebidoHoje: number;
  /** Os primeiros contratos ativos; a tela de contratos mostra todos. */
  contratos: readonly Contrato[];
  totalContratosAtivos: number;
};

/* ── Exemplo inicial ────────────────────────────────────────────────── */

type SeedContrato = Omit<ContratoRegistro, "id" | "numero" | "criadoEm"> & {
  numero: string;
  parcelas: number;
  /** Quantas das primeiras já foram pagas. */
  pagas: number;
  /** Prende o calendário: a parcela `numero` vence daqui a `dias`. */
  ancora: { numero: number; dias: number };
  /** Complemento das parcelas pagas, por número. */
  detalhes?: Readonly<Record<number, string>>;
};

const SEED_CLIENTES: readonly Omit<ClienteRegistro, "desde">[] = [
  { id: "marcos", nome: "Marcos Andrade", cpf: "12345678900", telefone: "(11) 98844-1220", score: 82 },
  { id: "juliana", nome: "Juliana Prado", telefone: "(11) 99120-4477", score: 64 },
  { id: "antonio", nome: "Antônio Ferreira", cpf: "98765432100", telefone: "(21) 98812-3344", score: 31 },
  { id: "renata", nome: "Renata Lima", telefone: "(31) 99450-8890", email: "renata@exemplo.com", score: 75 },
  { id: "sandra", nome: "Sandra Vieira", telefone: "(11) 98340-1129", score: 58 },
  { id: "carlos", nome: "Carlos Nogueira", cpf: "45678912300", telefone: "(11) 99777-2211", score: 90 },
  { id: "beatriz", nome: "Beatriz Souza", telefone: "(85) 98122-7766" },
];

const SEED_CONTRATOS: readonly SeedContrato[] = [
  {
    numero: "0042",
    clienteId: "marcos",
    tipo: "emprestimo",
    principal: 1000,
    taxa: 10,
    jurosSobre: "total",
    frequencia: "mensal",
    jurosEmAtraso: true,
    parcelas: 3,
    pagas: 1,
    ancora: { numero: 1, dias: 0 },
    detalhes: { 1: "recebida via Pix" },
  },
  {
    numero: "0041",
    clienteId: "juliana",
    tipo: "emprestimo",
    principal: 2400,
    taxa: 10,
    jurosSobre: "total",
    frequencia: "mensal",
    jurosEmAtraso: true,
    parcelas: 6,
    pagas: 2,
    ancora: { numero: 3, dias: 0 },
  },
  {
    numero: "0039",
    clienteId: "antonio",
    tipo: "emprestimo",
    principal: 800,
    taxa: 10,
    jurosSobre: "total",
    frequencia: "mensal",
    jurosEmAtraso: true,
    observacao: "Combinado por telefone. Cliente pediu vencimento no dia do pagamento.",
    parcelas: 4,
    pagas: 1,
    ancora: { numero: 2, dias: -4 },
  },
  {
    numero: "0038",
    clienteId: "renata",
    tipo: "venda",
    produto: "Notebook Dell",
    custo: 2100,
    principal: 2600,
    taxa: 23,
    jurosSobre: "total",
    frequencia: "mensal",
    jurosEmAtraso: false,
    parcelas: 8,
    pagas: 4,
    ancora: { numero: 5, dias: 1 },
    detalhes: { 4: "recebida via Pix" },
  },
  {
    numero: "0035",
    clienteId: "sandra",
    tipo: "emprestimo",
    principal: 3600,
    taxa: 20,
    jurosSobre: "total",
    frequencia: "diaria",
    jurosEmAtraso: true,
    parcelas: 72,
    pagas: 30,
    ancora: { numero: 32, dias: 0 },
  },
  {
    numero: "0031",
    clienteId: "juliana",
    tipo: "venda",
    produto: "Geladeira Brastemp",
    custo: 1250,
    principal: 1600,
    taxa: 23.75,
    jurosSobre: "total",
    frequencia: "mensal",
    jurosEmAtraso: false,
    parcelas: 6,
    pagas: 2,
    ancora: { numero: 3, dias: 3 },
  },
  {
    numero: "0030",
    clienteId: "carlos",
    tipo: "emprestimo",
    principal: 1500,
    taxa: 10,
    jurosSobre: "total",
    frequencia: "mensal",
    jurosEmAtraso: true,
    parcelas: 3,
    pagas: 3,
    ancora: { numero: 3, dias: -5 },
  },
  {
    numero: "0026",
    clienteId: "marcos",
    tipo: "venda",
    produto: "iPhone 13",
    custo: 2400,
    principal: 2800,
    taxa: 21.43,
    jurosSobre: "total",
    frequencia: "mensal",
    jurosEmAtraso: false,
    parcelas: 6,
    pagas: 6,
    ancora: { numero: 6, dias: -20 },
  },
];

/** Volta do vencimento de referência até a primeira parcela. */
function primeiroVencimentoDoSeed(seed: SeedContrato, hoje: Date): string {
  const referencia = isoEmDias(seed.ancora.dias, hoje);
  const passos = seed.ancora.numero - 1;
  // vencimentoDe só anda para a frente: descobre a primeira data testando a partir da referência.
  if (passos === 0) return referencia;
  if (seed.frequencia === "mensal") {
    const [ano, mes, dia] = referencia.split("-").map(Number);
    const alvo = new Date(Date.UTC(ano, mes - 1 - passos, dia));
    return alvo.toISOString().slice(0, 10);
  }
  const dias = seed.frequencia === "diaria" ? 1 : seed.frequencia === "semanal" ? 7 : 15;
  const alvo = new Date(Date.parse(`${referencia}T00:00:00Z`) - passos * dias * 86_400_000);
  return alvo.toISOString().slice(0, 10);
}

function semear(): Store {
  const hoje = new Date();
  const store: Store = {
    perfil: {
      nome: "Felipe Moura",
      email: "felipe@caderno.app",
      telefone: "(11) 98888-1200",
      senha: "caderno123",
      desde: isoEmDias(-210, hoje),
      avisos: { vencimentos: true, atrasos: true, resumo: false },
    },
    clientes: SEED_CLIENTES.map((c, i) => ({ ...c, desde: isoEmDias(-150 + i * 8, hoje) })),
    contratos: [],
    parcelas: [],
    recibos: [],
    sequencia: 43,
  };

  for (const seed of SEED_CONTRATOS) {
    const primeiro = primeiroVencimentoDoSeed(seed, hoje);
    const contrato: ContratoRegistro = {
      id: seed.numero,
      numero: `#${seed.numero}`,
      clienteId: seed.clienteId,
      tipo: seed.tipo,
      produto: seed.produto,
      custo: seed.custo,
      entrada: seed.entrada,
      principal: seed.principal,
      taxa: seed.taxa,
      jurosSobre: seed.jurosSobre,
      frequencia: seed.frequencia,
      jurosEmAtraso: seed.jurosEmAtraso,
      observacao: seed.observacao,
      criadoEm: primeiro,
    };
    store.contratos.push(contrato);

    const geradas = gerarParcelas(
      { principal: seed.principal, taxa: seed.taxa, jurosSobre: seed.jurosSobre, parcelas: seed.parcelas },
      primeiro,
      seed.frequencia,
    );

    for (const parcela of geradas) {
      const pago = parcela.numero <= seed.pagas;
      store.parcelas.push({
        id: `${contrato.id}-${parcela.numero}`,
        contratoId: contrato.id,
        numero: parcela.numero,
        vencimento: parcela.vencimento,
        valor: parcela.valor,
        pago,
        pagoEm: pago ? parcela.vencimento : undefined,
        valorRecebido: pago ? parcela.valor : undefined,
        detalhe: pago ? seed.detalhes?.[parcela.numero] : undefined,
      });
    }
  }

  return store;
}

const memoria = globalThis as typeof globalThis & { __caderno?: Store };

function store(): Store {
  memoria.__caderno ??= semear();
  return memoria.__caderno;
}

/* ── Leitura ────────────────────────────────────────────────────────── */

function parcelasDe(contratoId: string): ParcelaRegistro[] {
  return store()
    .parcelas.filter((p) => p.contratoId === contratoId)
    .sort((a, b) => a.numero - b.numero);
}

/** A fita do andamento: paga, atrasada, a próxima em aberto e o resto. */
function fita(parcelas: readonly ParcelaRegistro[], hoje: Date): InstallmentStatus[] {
  let achouProxima = false;
  return parcelas.map((p) => {
    if (p.pago) return "paga";
    if (diasAte(p.vencimento, hoje) < 0) return "atrasada";
    if (!achouProxima) {
      achouProxima = true;
      return "proxima";
    }
    return "futura";
  });
}

function montarContrato(registro: ContratoRegistro, hoje: Date): Contrato {
  const cliente = store().clientes.find((c) => c.id === registro.clienteId);
  const parcelas = parcelasDe(registro.id);
  const pagas = parcelas.filter((p) => p.pago);
  const abertas = parcelas.filter((p) => !p.pago);
  const atrasadas = abertas.filter((p) => diasAte(p.vencimento, hoje) < 0);
  const maiorAtraso = atrasadas.reduce((maior, p) => Math.max(maior, -diasAte(p.vencimento, hoje)), 0);
  const valor = arredondar(parcelas.reduce((soma, p) => soma + p.valor, 0));

  return {
    ...registro,
    cliente: cliente?.nome ?? "Cliente removido",
    telefone: cliente?.telefone,
    totalParcelas: parcelas.length,
    valor,
    recebido: arredondar(pagas.reduce((soma, p) => soma + (p.valorRecebido ?? p.valor), 0)),
    aReceber: arredondar(abertas.reduce((soma, p) => soma + p.valor, 0)),
    juros: arredondar(valor - registro.principal + (registro.entrada ?? 0)),
    pagas: pagas.length,
    parcelas: fita(parcelas, hoje),
    situacao: situacaoContrato(fita(parcelas, hoje)),
    alerta: maiorAtraso > 0 ? atrasoLabel(maiorAtraso) : undefined,
    primeiroVencimento: parcelas[0]?.vencimento ?? registro.criadoEm,
  };
}

function montarParcela(registro: ParcelaRegistro): Parcela {
  const contrato = store().contratos.find((c) => c.id === registro.contratoId);
  const cliente = store().clientes.find((c) => c.id === contrato?.clienteId);
  const total = parcelasDe(registro.contratoId).length;

  return {
    ...registro,
    contrato: contrato?.numero ?? "#—",
    clienteId: cliente?.id ?? "",
    cliente: cliente?.nome ?? "Cliente removido",
    telefone: cliente?.telefone,
    tipo: contrato?.tipo ?? "emprestimo",
    parcela: { numero: registro.numero, total },
  };
}

export async function getConta(): Promise<Conta> {
  const hoje = new Date();
  const atrasadas = store().parcelas.filter((p) => !p.pago && diasAte(p.vencimento, hoje) < 0).length;

  return {
    usuario: { nome: store().perfil.nome },
    plano: { nome: "Plano Pro", usados: store().contratos.length, limite: 25, unidade: "contratos" },
    atrasadas,
  };
}

export async function getPerfil(): Promise<Perfil> {
  const { nome, email, telefone, desde, avisos } = store().perfil;
  return { nome, email, telefone, desde, avisos: { ...avisos } };
}

export async function getClientes(): Promise<readonly Cliente[]> {
  const hoje = new Date();

  return store().clientes.map((registro) => {
    const contratos = store()
      .contratos.filter((c) => c.clienteId === registro.id)
      .map((c) => montarContrato(c, hoje));
    const atrasadas = contratos.reduce(
      (soma, c) => soma + parcelasDe(c.id).filter((p) => !p.pago && diasAte(p.vencimento, hoje) < 0).length,
      0,
    );

    return {
      ...registro,
      contratosAtivos: contratos.filter((c) => c.situacao !== "quitado").length,
      emprestado: arredondar(contratos.reduce((soma, c) => soma + c.principal, 0)),
      recebido: arredondar(contratos.reduce((soma, c) => soma + c.recebido, 0)),
      aReceber: arredondar(contratos.reduce((soma, c) => soma + c.aReceber, 0)),
      alerta:
        atrasadas === 0 ? undefined : `${atrasadas} ${atrasadas === 1 ? "parcela atrasada" : "parcelas atrasadas"}`,
    };
  });
}

export async function getCliente(id: string): Promise<Cliente | undefined> {
  return (await getClientes()).find((c) => c.id === id);
}

export async function getContratos(): Promise<readonly Contrato[]> {
  const hoje = new Date();
  return store()
    .contratos.map((c) => montarContrato(c, hoje))
    .sort((a, b) => b.id.localeCompare(a.id));
}

export async function getContrato(id: string): Promise<Contrato | undefined> {
  const registro = store().contratos.find((c) => c.id === id);
  return registro && montarContrato(registro, new Date());
}

export async function getParcelas(): Promise<readonly Parcela[]> {
  return store()
    .parcelas.map(montarParcela)
    .sort((a, b) => a.vencimento.localeCompare(b.vencimento) || a.numero - b.numero);
}

export async function getParcelasDoContrato(contratoId: string): Promise<readonly Parcela[]> {
  return parcelasDe(contratoId).map(montarParcela);
}

export async function getParcela(id: string): Promise<Parcela | undefined> {
  const registro = store().parcelas.find((p) => p.id === id);
  return registro && montarParcela(registro);
}

export async function getRecibo(id: string): Promise<Recibo | undefined> {
  return store().recibos.find((r) => r.id === id);
}

export async function getInicio(): Promise<Inicio> {
  const hoje = new Date();
  const [contratos, parcelas] = await Promise.all([getContratos(), getParcelas()]);
  const ativos = contratos.filter((c) => c.situacao !== "quitado");

  const balanco = contratos.reduce<Balanco>(
    (soma, contrato) => {
      const abertas = parcelasDe(contrato.id).filter((p) => !p.pago);
      const atrasado = abertas
        .filter((p) => diasAte(p.vencimento, hoje) < 0)
        .reduce((total, p) => total + p.valor, 0);

      return {
        emprestado: soma.emprestado + contrato.principal,
        recebido: soma.recebido + contrato.recebido,
        aVencer: soma.aVencer + contrato.aReceber - atrasado,
        atrasado: soma.atrasado + atrasado,
        jurosPrevistos:
          soma.jurosPrevistos +
          (contrato.totalParcelas === 0 ? 0 : (contrato.juros * abertas.length) / contrato.totalParcelas),
      };
    },
    { emprestado: 0, recebido: 0, aVencer: 0, atrasado: 0, jurosPrevistos: 0 },
  );

  const doDia = parcelas.filter((p) => diasAte(p.vencimento, hoje) === 0);
  // Parcela paga de outro dia não volta para a agenda; a de hoje fica, para mostrar o que já entrou.
  const agenda = parcelas.filter((p) => {
    const dias = diasAte(p.vencimento, hoje);
    return dias <= 1 && (p.pago ? dias === 0 : true);
  });

  return {
    balanco,
    agenda: agenda.slice(0, 6),
    venceHoje: doDia.filter((p) => !p.pago).length,
    recebidoHoje: arredondar(doDia.filter((p) => p.pago).reduce((soma, p) => soma + (p.valorRecebido ?? p.valor), 0)),
    contratos: ativos.slice(0, 5),
    totalContratosAtivos: ativos.length,
  };
}

/* ── Relatórios e histórico ─────────────────────────────────────────── */

/** O que entra na conta dos totais: tudo ou só o que ainda está de pé. */
export type RecorteRelatorio = "todos" | "abertos";

/** Até onde a projeção enxerga: o fim deste mês, 30 ou 90 dias. */
export type PeriodoProjecao = "mes" | "30" | "90";

export type TotaisRelatorio = {
  emprestado: number;
  recebido: number;
  aReceber: number;
  /** O juro mais a margem do produto, quando tudo estiver pago. */
  lucro: number;
  /** A parte do lucro que as parcelas já pagas trouxeram. */
  lucroRealizado: number;
  contratos: number;
};

/** Uma linha da projeção: empréstimos ou vendas dentro do período escolhido. */
export type LinhaProjecao = {
  tipo: "emprestimo" | "venda";
  parcelas: number;
  aReceber: number;
  juros: number;
  /** A parte do "a receber" que já passou do vencimento. */
  vencido: number;
};

export type Relatorio = {
  totais: TotaisRelatorio;
  projecao: readonly LinhaProjecao[];
  /** Os últimos seis meses, do mais antigo ao mês corrente. */
  fluxo: readonly MesDeFluxo[];
};

/** O que o contrato deixa: o juro e, na venda, também a margem do produto. */
function lucroDe(contrato: Contrato): number {
  const margem = contrato.tipo === "venda" && contrato.custo !== undefined ? contrato.principal - contrato.custo : 0;
  return contrato.juros + margem;
}

/** O dinheiro que saiu do bolso: o emprestado ou o que o produto vendido custou. */
function saidaDe(contrato: Pick<ContratoRegistro, "tipo" | "principal" | "custo">): number {
  return contrato.tipo === "venda" ? (contrato.custo ?? contrato.principal) : contrato.principal;
}

const rotuloForma: Record<FormaRecebimento, string> = {
  parcela: "parcela",
  juros: "só os juros",
  parcial: "juros e parte da dívida",
  quitacao: "quitação",
};

const canalCurto: Record<CanalRecebimento, string> = {
  pix: "Pix",
  dinheiro: "dinheiro",
  transferencia: "transferência",
  cartao: "cartão",
};

/** Uma entrada de dinheiro, já com o contrato e o cliente resolvidos. */
type Entrada = {
  id: string;
  data: string;
  valor: number;
  contratoId: string;
  numeroContrato: string;
  cliente: string;
  parcela: { numero: number; total: number };
  /** Como entrou: "parcela · Pix". */
  detalhe?: string;
};

/**
 * Tudo o que entrou, sem contar duas vezes: cada baixa deixa um recibo, e as parcelas
 * do exemplo inicial — que já nascem pagas, sem recibo — entram pelo que está na parcela.
 */
function entradas(): readonly Entrada[] {
  const dados = store();

  const deRecibo: Entrada[] = dados.recibos.map((r) => ({
    id: r.id,
    data: r.data,
    valor: r.valor,
    contratoId: r.contratoId,
    numeroContrato: r.numeroContrato,
    cliente: r.cliente,
    parcela: r.parcela,
    detalhe: `${rotuloForma[r.forma]} · ${canalCurto[r.canal]}`,
  }));

  const doExemplo: Entrada[] = dados.parcelas.flatMap((p) => {
    if (!p.pago || p.pagoEm === undefined || p.reciboId !== undefined) return [];
    const contrato = dados.contratos.find((c) => c.id === p.contratoId);
    const cliente = dados.clientes.find((c) => c.id === contrato?.clienteId);

    return [
      {
        id: p.id,
        data: p.pagoEm,
        valor: p.valorRecebido ?? p.valor,
        contratoId: p.contratoId,
        numeroContrato: contrato?.numero ?? "#—",
        cliente: cliente?.nome ?? "Cliente removido",
        parcela: { numero: p.numero, total: parcelasDe(p.contratoId).length },
        detalhe: p.detalhe,
      },
    ];
  });

  return [...deRecibo, ...doExemplo];
}

export async function getRelatorio(recorte: RecorteRelatorio, periodo: PeriodoProjecao): Promise<Relatorio> {
  const agora = new Date();
  const hoje = isoDate(agora);
  const contratos = await getContratos();
  const noRecorte = recorte === "abertos" ? contratos.filter((c) => c.situacao !== "quitado") : contratos;

  const soma = noRecorte.reduce<TotaisRelatorio>(
    (total, contrato) => {
      const lucro = lucroDe(contrato);
      return {
        emprestado: total.emprestado + contrato.principal,
        recebido: total.recebido + contrato.recebido,
        aReceber: total.aReceber + contrato.aReceber,
        lucro: total.lucro + lucro,
        lucroRealizado:
          total.lucroRealizado +
          (contrato.totalParcelas === 0 ? 0 : (lucro * contrato.pagas) / contrato.totalParcelas),
        contratos: total.contratos + 1,
      };
    },
    { emprestado: 0, recebido: 0, aReceber: 0, lucro: 0, lucroRealizado: 0, contratos: 0 },
  );

  const totais: TotaisRelatorio = {
    ...soma,
    emprestado: arredondar(soma.emprestado),
    recebido: arredondar(soma.recebido),
    aReceber: arredondar(soma.aReceber),
    lucro: arredondar(soma.lucro),
    lucroRealizado: arredondar(soma.lucroRealizado),
  };

  // O que já venceu entra na projeção mesmo sendo de antes: é dinheiro que ainda tem de aparecer.
  const limite = periodo === "mes" ? fimDoMes(mesAtual(agora)) : somarDias(hoje, Number(periodo));

  const projecao = (["emprestimo", "venda"] as const).map<LinhaProjecao>((tipo) => {
    const linha = { tipo, parcelas: 0, aReceber: 0, juros: 0, vencido: 0 };

    for (const contrato of contratos.filter((c) => c.tipo === tipo)) {
      const jurosPorParcela = contrato.totalParcelas === 0 ? 0 : contrato.juros / contrato.totalParcelas;
      for (const parcela of parcelasDe(contrato.id)) {
        if (parcela.pago || parcela.vencimento > limite) continue;
        linha.parcelas += 1;
        linha.aReceber += parcela.valor;
        linha.juros += jurosPorParcela;
        if (parcela.vencimento < hoje) linha.vencido += parcela.valor;
      }
    }

    return {
      ...linha,
      aReceber: arredondar(linha.aReceber),
      juros: arredondar(linha.juros),
      vencido: arredondar(linha.vencido),
    };
  });

  const fluxo: MesDeFluxo[] = Array.from({ length: 6 }, (_, i) => ({
    mes: somarAoMes(mesAtual(agora), i - 5),
    entrada: 0,
    saida: 0,
  }));
  const porMes = new Map(fluxo.map((m) => [m.mes, m]));

  for (const entrada of entradas()) {
    const mes = porMes.get(mesDe(entrada.data));
    if (mes) mes.entrada = arredondar(mes.entrada + entrada.valor);
  }
  for (const contrato of store().contratos) {
    const mes = porMes.get(mesDe(contrato.criadoEm));
    if (mes) mes.saida = arredondar(mes.saida + saidaDe(contrato));
  }

  return { totais, projecao, fluxo };
}

export type Evento = {
  id: string;
  tipo: TipoEvento;
  /** Dia do evento em ISO. */
  data: string;
  /** Nome do cliente envolvido. */
  titulo: string;
  /** A linha de baixo: "#0042 · parcela 2 de 3 · Pix". */
  detalhe: string;
  /** No pagamento é o que entrou; no contrato, o que saiu. Cadastro não tem valor. */
  valor?: number;
  href?: string;
};

/** A conta inteira em ordem: pagamentos recebidos, contratos abertos e clientes cadastrados. */
export async function getHistorico(): Promise<readonly Evento[]> {
  const dados = store();

  const pagamentos: Evento[] = entradas().map((e) => ({
    id: `pagamento-${e.id}`,
    tipo: "pagamento",
    data: e.data,
    titulo: e.cliente,
    detalhe: [`${e.numeroContrato} · parcela ${e.parcela.numero} de ${e.parcela.total}`, e.detalhe]
      .filter(Boolean)
      .join(" · "),
    valor: e.valor,
    href: `/contratos/${e.contratoId}`,
  }));

  const contratos: Evento[] = dados.contratos.map((contrato) => {
    const cliente = dados.clientes.find((c) => c.id === contrato.clienteId);
    const total = parcelasDe(contrato.id).length;

    return {
      id: `contrato-${contrato.id}`,
      tipo: "contrato",
      data: contrato.criadoEm,
      titulo: cliente?.nome ?? "Cliente removido",
      detalhe: [
        contrato.numero,
        contrato.tipo === "venda" ? (contrato.produto ?? "venda") : null,
        `${total} ${total === 1 ? "parcela" : "parcelas"}`,
      ]
        .filter(Boolean)
        .join(" · "),
      valor: saidaDe(contrato),
      href: `/contratos/${contrato.id}`,
    };
  });

  const clientes: Evento[] = dados.clientes.map((cliente) => ({
    id: `cliente-${cliente.id}`,
    tipo: "cliente",
    data: cliente.desde,
    titulo: cliente.nome,
    detalhe: "Cliente cadastrado",
    href: `/clientes/${cliente.id}`,
  }));

  // Do mais recente para o mais antigo; no mesmo dia, o dinheiro vem antes do cadastro.
  return [...pagamentos, ...contratos, ...clientes].sort(
    (a, b) => b.data.localeCompare(a.data) || a.id.localeCompare(b.id),
  );
}

/* ── Escrita ────────────────────────────────────────────────────────── */

export type DadosPerfil = Pick<PerfilRegistro, "nome" | "email" | "telefone">;

export function atualizarPerfil(dados: DadosPerfil): void {
  Object.assign(store().perfil, dados);
}

/** Troca a senha. Volta `false` quando a senha de agora não confere; nada é gravado. */
export function alterarSenha(atual: string, nova: string): boolean {
  const perfil = store().perfil;
  if (perfil.senha !== atual) return false;
  perfil.senha = nova;
  return true;
}

export function atualizarAvisos(avisos: Avisos): void {
  store().perfil.avisos = { ...avisos };
}

export type DadosCliente = Omit<ClienteRegistro, "id" | "desde">;

export function criarCliente(dados: DadosCliente): string {
  const id = `c${Date.now().toString(36)}`;
  store().clientes.push({ ...dados, id, desde: isoDate(new Date()) });
  return id;
}

export function atualizarCliente(id: string, dados: DadosCliente): void {
  const cliente = store().clientes.find((c) => c.id === id);
  if (!cliente) return;
  Object.assign(cliente, dados);
}

/** Some com o cliente e com tudo que estava pendurado nele. */
export function excluirCliente(id: string): void {
  const dados = store();
  const contratos = dados.contratos.filter((c) => c.clienteId === id).map((c) => c.id);
  dados.parcelas = dados.parcelas.filter((p) => !contratos.includes(p.contratoId));
  dados.contratos = dados.contratos.filter((c) => c.clienteId !== id);
  dados.clientes = dados.clientes.filter((c) => c.id !== id);
}

export type DadosContrato = Omit<ContratoRegistro, "id" | "numero" | "criadoEm"> & {
  parcelas: number;
  primeiroVencimento: string;
};

export function criarContrato(dados: DadosContrato): string {
  const sequencia = store().sequencia++;
  const id = String(sequencia).padStart(4, "0");
  const { parcelas, primeiroVencimento, ...registro } = dados;

  store().contratos.push({ ...registro, id, numero: `#${id}`, criadoEm: isoDate(new Date()) });
  for (const parcela of gerarParcelas({ ...dados, parcelas }, primeiroVencimento, dados.frequencia)) {
    store().parcelas.push({
      id: `${id}-${parcela.numero}`,
      contratoId: id,
      numero: parcela.numero,
      vencimento: parcela.vencimento,
      valor: parcela.valor,
      pago: false,
    });
  }

  return id;
}

/**
 * Salva a edição e refaz as parcelas ainda em aberto: o que já foi pago fica como está
 * e o valor restante é dividido no número de parcelas que sobrou.
 */
export function atualizarContrato(id: string, dados: DadosContrato): void {
  const dadosStore = store();
  const contrato = dadosStore.contratos.find((c) => c.id === id);
  if (!contrato) return;

  const { parcelas: quantas, primeiroVencimento, ...registro } = dados;
  Object.assign(contrato, registro);

  const antigas = parcelasDe(id);
  const pagas = antigas.filter((p) => p.pago);
  const recebido = pagas.reduce((soma, p) => soma + p.valor, 0);
  const { total } = simular(dados);
  const abertas = Math.max(quantas - pagas.length, 0);

  dadosStore.parcelas = dadosStore.parcelas.filter((p) => p.contratoId !== id || p.pago);
  if (abertas === 0) return;

  const restante = arredondar(Math.max(total - recebido, 0));
  const porParcela = arredondar(restante / abertas);

  for (let i = 0; i < abertas; i++) {
    const numero = pagas.length + i + 1;
    dadosStore.parcelas.push({
      id: `${id}-${numero}`,
      contratoId: id,
      numero,
      vencimento: vencimentoDe(primeiroVencimento, numero - 1, dados.frequencia),
      valor: i === abertas - 1 ? arredondar(restante - porParcela * (abertas - 1)) : porParcela,
      pago: false,
    });
  }
}

export function excluirContrato(id: string): void {
  const dados = store();
  dados.parcelas = dados.parcelas.filter((p) => p.contratoId !== id);
  dados.contratos = dados.contratos.filter((c) => c.id !== id);
}

const rotuloCanal: Record<CanalRecebimento, string> = {
  pix: "recebida via Pix",
  dinheiro: "recebida em dinheiro",
  transferencia: "recebida por transferência",
  cartao: "recebida no cartão",
};

export type Recebimento = {
  valor: number;
  forma: FormaRecebimento;
  canal: CanalRecebimento;
  /** Dia informado pelo usuário. */
  data: string;
};

/** Dá baixa na parcela conforme a forma escolhida e devolve o id do comprovante. */
export function receberParcela(id: string, recebimento: Recebimento): string | undefined {
  const dados = store();
  const parcela = dados.parcelas.find((p) => p.id === id);
  if (!parcela) return undefined;
  const contrato = dados.contratos.find((c) => c.id === parcela.contratoId);
  if (!contrato) return undefined;

  const { valor, forma, canal, data } = recebimento;
  const detalhe = rotuloCanal[canal];
  const abertas = parcelasDe(contrato.id).filter((p) => !p.pago);
  // O número do comprovante sai antes da baixa: é ele que liga a parcela ao recibo no histórico.
  const reciboId = `r${Date.now().toString(36)}`;

  function quitar(alvo: ParcelaRegistro, recebido: number) {
    alvo.pago = true;
    alvo.pagoEm = data;
    alvo.valorRecebido = recebido;
    alvo.detalhe = detalhe;
    alvo.reciboId = reciboId;
  }

  if (forma === "quitacao") {
    // Tudo o que falta entra de uma vez; o valor informado se espalha pelas parcelas abertas.
    for (const aberta of abertas) quitar(aberta, aberta.valor);
  } else if (forma === "juros") {
    // A dívida continua de pé: a parcela só anda para o próximo vencimento.
    parcela.vencimento = vencimentoDe(parcela.vencimento, 1, contrato.frequencia);
    parcela.observacao = `Só os juros em ${formatShortDate(data)}: ${valor.toFixed(2)}`;
  } else if (forma === "parcial") {
    if (valor >= parcela.valor) {
      const sobra = arredondar(valor - parcela.valor);
      quitar(parcela, parcela.valor);
      const proxima = abertas.find((p) => p.numero > parcela.numero);
      if (proxima && sobra > 0) proxima.valor = arredondar(Math.max(proxima.valor - sobra, 0));
    } else {
      parcela.valor = arredondar(parcela.valor - valor);
      parcela.vencimento = vencimentoDe(parcela.vencimento, 1, contrato.frequencia);
      parcela.observacao = `Abatimento de ${valor.toFixed(2)} em ${formatShortDate(data)}`;
    }
  } else {
    quitar(parcela, valor);
  }

  const recibo: Recibo = {
    id: reciboId,
    contratoId: contrato.id,
    numeroContrato: contrato.numero,
    cliente: dados.clientes.find((c) => c.id === contrato.clienteId)?.nome ?? "Cliente removido",
    parcela: { numero: parcela.numero, total: parcelasDe(contrato.id).length },
    valor,
    forma,
    canal,
    data,
  };
  dados.recibos.push(recibo);
  return recibo.id;
}

export type Renegociacao = { valor: number; vencimento: string; observacao?: string };

export function renegociarParcela(id: string, { valor, vencimento, observacao }: Renegociacao): void {
  const parcela = store().parcelas.find((p) => p.id === id);
  if (!parcela) return;
  parcela.valor = arredondar(valor);
  parcela.vencimento = vencimento;
  parcela.observacao = observacao;
  parcela.renegociada = true;
}
