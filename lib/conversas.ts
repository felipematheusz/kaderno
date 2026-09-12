import type { InstallmentStatus } from "@/components/ui/installment-bar";
import type { Cliente, Contrato, Parcela } from "./dados";
import { verParcela } from "./emprestimos";
import { cobrancaDaParcela, textoDaMensagem } from "./mensagens";

/*
 * Conversas do WhatsApp, de mentira, enquanto a uazapi não está ligada.
 * Mensagens, etapa e anotações são inventadas; o dinheiro e a situação vêm do mesmo
 * "banco" das outras telas, para a ficha nunca discordar da tela do cliente.
 */

export type Etapa = "novo" | "negociando" | "ativo" | "cobranca" | "quitado";

export const ETAPAS: readonly { value: Etapa; label: string }[] = [
  { value: "novo", label: "Novo contato" },
  { value: "negociando", label: "Negociando" },
  { value: "ativo", label: "Contrato ativo" },
  { value: "cobranca", label: "Em cobrança" },
  { value: "quitado", label: "Quitado" },
];

export const ATENDENTES: readonly string[] = ["Felipe", "Ana", "Bruno"];

export type Autor = "cliente" | "empresa";

export type Balao = {
  tipo: "texto";
  id: string;
  autor: Autor;
  texto: string;
  /** "09:41". */
  hora: string;
  /** Só mensagem da empresa: o cliente já viu. */
  lida?: boolean;
};

/** Acontecimento no meio da conversa: "Parcela paga", "Cobrança automática enviada". */
export type Marco = {
  tipo: "evento";
  id: string;
  texto: string;
  tom: "positive" | "negative" | "neutral";
};

export type ItemConversa = Balao | Marco;

export type Dia = {
  /** "Hoje", "Ontem", "Segunda", "10/09". */
  rotulo: string;
  itens: readonly ItemConversa[];
};

export type Anotacao = { id: string; texto: string; autor: string; quando: string };

/** Quem está do outro lado: cliente cadastrado ou contato que ainda não virou cliente. */
type Contato = { clienteId: string } | { nome: string; telefone: string };

type ConversaRegistro = {
  id: string;
  contato: Contato;
  etapa: Etapa;
  atendente: string;
  naoLidas: number;
  anotacoes: readonly Anotacao[];
  dias: readonly Dia[];
};

export type Ficha = {
  clienteId: string;
  score?: number;
  aReceber: number;
  contrato?: { numero: string; parcelas: readonly InstallmentStatus[]; pagas: number; total: number };
  proxima?: { prazo: string; valor: number };
  /** Texto pronto de cobrança da próxima parcela em aberto. */
  cobranca?: string;
};

/** Selo da lista: só aparece quando pede atenção. */
export type Situacao = { texto: string; tom: "negative" | "warning" };

export type Conversa = Omit<ConversaRegistro, "contato"> & {
  nome: string;
  telefone?: string;
  /** Sem ficha: contato que ainda não é cliente. */
  ficha?: Ficha;
  situacao?: Situacao;
};

export type Resumo = { texto: string; autor: Autor; quando: string };

/** Última mensagem escrita (eventos não contam) e quando: hora se foi hoje, o dia se não. */
export function ultimaMensagem(conversa: Conversa): Resumo | undefined {
  for (const dia of [...conversa.dias].reverse()) {
    const balao = [...dia.itens].reverse().find((item): item is Balao => item.tipo === "texto");
    if (balao) return { texto: balao.texto, autor: balao.autor, quando: dia.rotulo === "Hoje" ? balao.hora : dia.rotulo };
  }
  return undefined;
}

const REGISTROS: readonly ConversaRegistro[] = [
  {
    id: "c-antonio",
    contato: { clienteId: "antonio" },
    etapa: "cobranca",
    atendente: "Ana",
    naoLidas: 2,
    anotacoes: [
      { id: "n1", texto: "Trabalha de motorista de aplicativo. Costuma pagar na sexta.", autor: "Ana", quando: "02/09" },
    ],
    dias: [
      {
        rotulo: "Ontem",
        itens: [
          { tipo: "evento", id: "a1", texto: "Cobrança automática enviada", tom: "neutral" },
          {
            tipo: "texto",
            id: "a2",
            autor: "empresa",
            texto: "Oi, Antônio! A parcela do seu contrato venceu e ainda não recebi. Consegue acertar hoje?",
            hora: "09:00",
            lida: true,
          },
        ],
      },
      {
        rotulo: "Hoje",
        itens: [
          {
            tipo: "texto",
            id: "a3",
            autor: "cliente",
            texto: "Bom dia! Vi sim, desculpa. Tive um imprevisto com o carro essa semana.",
            hora: "10:08",
          },
          {
            tipo: "texto",
            id: "a4",
            autor: "cliente",
            texto: "Consigo pagar metade hoje e o resto na sexta, pode ser?",
            hora: "10:12",
          },
        ],
      },
    ],
  },
  {
    id: "c-paulo",
    contato: { nome: "Paulo Henrique", telefone: "(11) 97654-3321" },
    etapa: "novo",
    atendente: "Bruno",
    naoLidas: 1,
    anotacoes: [],
    dias: [
      {
        rotulo: "Hoje",
        itens: [
          {
            tipo: "texto",
            id: "p1",
            autor: "cliente",
            texto: "Oi, boa tarde. Um amigo me passou esse número. Vocês fazem empréstimo para autônomo?",
            hora: "09:58",
          },
        ],
      },
    ],
  },
  {
    id: "c-marcos",
    contato: { clienteId: "marcos" },
    etapa: "ativo",
    atendente: "Felipe",
    naoLidas: 1,
    anotacoes: [],
    dias: [
      {
        rotulo: "Segunda",
        itens: [
          { tipo: "evento", id: "m1", texto: "Parcela paga via Pix", tom: "positive" },
          {
            tipo: "texto",
            id: "m2",
            autor: "empresa",
            texto: "Recebido, Marcos! Obrigado. Já dei baixa aqui.",
            hora: "14:20",
            lida: true,
          },
        ],
      },
      {
        rotulo: "Hoje",
        itens: [
          {
            tipo: "texto",
            id: "m3",
            autor: "cliente",
            texto: "Felipe, se eu quiser adiantar as duas últimas parcelas, tem desconto? Quanto fica?",
            hora: "08:30",
          },
        ],
      },
    ],
  },
  {
    id: "c-juliana",
    contato: { clienteId: "juliana" },
    etapa: "ativo",
    atendente: "Ana",
    naoLidas: 0,
    anotacoes: [],
    dias: [
      {
        rotulo: "Hoje",
        itens: [
          {
            tipo: "texto",
            id: "j1",
            autor: "cliente",
            texto: "Oi! Mandei o Pix agora há pouco.",
            hora: "09:32",
          },
          { tipo: "evento", id: "j2", texto: "Comprovante recebido", tom: "positive" },
          {
            tipo: "texto",
            id: "j3",
            autor: "empresa",
            texto: "Recebido, Juliana! Obrigada pelo pagamento. Já está registrado.",
            hora: "09:41",
            lida: true,
          },
        ],
      },
    ],
  },
  {
    id: "c-renata",
    contato: { clienteId: "renata" },
    etapa: "negociando",
    atendente: "Felipe",
    naoLidas: 0,
    anotacoes: [
      { id: "n2", texto: "Quer R$ 2.000 para reformar a loja. Prefere parcela mensal.", autor: "Felipe", quando: "ontem" },
    ],
    dias: [
      {
        rotulo: "Ontem",
        itens: [
          {
            tipo: "texto",
            id: "r1",
            autor: "cliente",
            texto: "Queria ver um novo empréstimo, uns 2 mil. Em quantas vezes dá para fazer?",
            hora: "16:05",
          },
          {
            tipo: "texto",
            id: "r2",
            autor: "empresa",
            texto: "Oi, Renata! Dá para fazer em até 6 vezes mensais. Vou montar a simulação e te mando ainda hoje.",
            hora: "16:40",
            lida: true,
          },
        ],
      },
    ],
  },
  {
    id: "c-sandra",
    contato: { clienteId: "sandra" },
    etapa: "ativo",
    atendente: "Bruno",
    naoLidas: 0,
    anotacoes: [],
    dias: [
      {
        rotulo: "Ontem",
        itens: [
          { tipo: "evento", id: "s1", texto: "Lembrete automático enviado", tom: "neutral" },
          {
            tipo: "texto",
            id: "s2",
            autor: "empresa",
            texto: "Oi, Sandra! Passando para lembrar da sua próxima parcela. Qualquer coisa, é só chamar.",
            hora: "08:00",
          },
        ],
      },
    ],
  },
  {
    id: "c-rodrigo",
    contato: { nome: "Rodrigo Alves", telefone: "(21) 99321-8870" },
    etapa: "negociando",
    atendente: "Ana",
    naoLidas: 0,
    anotacoes: [{ id: "n3", texto: "Falta o comprovante de residência.", autor: "Ana", quando: "10/09" }],
    dias: [
      {
        rotulo: "10/09",
        itens: [
          {
            tipo: "texto",
            id: "ro1",
            autor: "empresa",
            texto: "Rodrigo, para seguir preciso de foto do RG ou CNH e um comprovante de residência.",
            hora: "11:15",
            lida: true,
          },
          {
            tipo: "texto",
            id: "ro2",
            autor: "cliente",
            texto: "Mandei o RG. O comprovante eu pego em casa e te mando amanhã.",
            hora: "11:52",
          },
        ],
      },
    ],
  },
  {
    id: "c-carlos",
    contato: { clienteId: "carlos" },
    etapa: "quitado",
    atendente: "Felipe",
    naoLidas: 0,
    anotacoes: [],
    dias: [
      {
        rotulo: "08/09",
        itens: [
          { tipo: "evento", id: "ca1", texto: "Contrato quitado", tom: "positive" },
          {
            tipo: "texto",
            id: "ca2",
            autor: "cliente",
            texto: "Obrigado pela parceria! Quando precisar de novo eu chamo.",
            hora: "18:03",
          },
        ],
      },
    ],
  },
];

function ordemDeVencimento(a: Parcela, b: Parcela): number {
  return a.vencimento.localeCompare(b.vencimento);
}

/** Junta a conversa inventada com o que o "banco" sabe do cliente hoje. */
export function montarConversas(
  clientes: readonly Cliente[],
  contratos: readonly Contrato[],
  parcelas: readonly Parcela[],
  agora: Date,
): Conversa[] {
  return REGISTROS.flatMap(({ contato, ...registro }): Conversa[] => {
    if (!("clienteId" in contato)) return [{ ...registro, nome: contato.nome, telefone: contato.telefone }];

    const cliente = clientes.find((c) => c.id === contato.clienteId);
    // Cliente excluído: a conversa some junto, como os contratos dele.
    if (!cliente) return [];

    const proxima = [...parcelas].filter((p) => p.clienteId === cliente.id && !p.pago).sort(ordemDeVencimento)[0];
    const vista = proxima && verParcela(proxima, agora);
    const abertos = contratos.filter((c) => c.clienteId === cliente.id && c.situacao !== "quitado");
    const contrato = abertos.find((c) => c.situacao === "atrasado") ?? abertos[0];

    const situacao: Situacao | undefined =
      vista?.status === "atrasada"
        ? { texto: vista.detalhe ?? "Atrasada", tom: "negative" }
        : vista?.status === "hoje"
          ? { texto: "Vence hoje", tom: "warning" }
          : undefined;

    return [
      {
        ...registro,
        nome: cliente.nome,
        telefone: cliente.telefone,
        situacao,
        ficha: {
          clienteId: cliente.id,
          score: cliente.score,
          aReceber: cliente.aReceber,
          contrato: contrato && {
            numero: contrato.numero,
            parcelas: contrato.parcelas,
            pagas: contrato.pagas,
            total: contrato.totalParcelas,
          },
          proxima: proxima && vista && { prazo: vista.prazo, valor: proxima.valor },
          cobranca: proxima && textoDaMensagem(cobrancaDaParcela(proxima, agora)),
        },
      },
    ];
  });
}
