"use client";

import { useState } from "react";
import { ClientSearch, type ClientOption } from "@/components/domain/client-search";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { Modal } from "@/components/ui/modal";
import { MoneyInput } from "@/components/ui/money-input";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tab, TabList, TabPanel, Tabs } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { formatBRL } from "@/lib/format";

/* Demonstrações com estado para a vitrine /design. Não são telas do produto. */

export function TabsDemo() {
  return (
    <Tabs defaultValue="todas">
      <TabList aria-label="Notificações">
        <Tab value="todas">Todas</Tab>
        <Tab value="nao-lidas" count={3}>
          Não lidas
        </Tab>
      </TabList>
      <TabPanel value="todas" className="text-body-sm text-body">
        Todas as notificações da conta.
      </TabPanel>
      <TabPanel value="nao-lidas" className="text-body-sm text-body">
        3 avisos que você ainda não abriu.
      </TabPanel>
    </Tabs>
  );
}

const filtros = [
  { valor: "todos", rotulo: "Todos", qtd: 7 },
  { valor: "em-dia", rotulo: "Em dia", qtd: 5 },
  { valor: "atrasados", rotulo: "Atrasados", qtd: 1 },
  { valor: "quitados", rotulo: "Quitados", qtd: 1 },
] as const;

export function FiltersDemo() {
  const [filtro, setFiltro] = useState<string>("todos");
  return (
    <FilterChips aria-label="Filtrar contratos por situação">
      {filtros.map((f) => (
        <FilterChip key={f.valor} on="canvas" selected={filtro === f.valor} count={f.qtd} onClick={() => setFiltro(f.valor)}>
          {f.rotulo}
        </FilterChip>
      ))}
    </FilterChips>
  );
}

type Frequencia = "diaria" | "semanal" | "quinzenal" | "mensal";

const frequencias = [
  { value: "diaria", label: "Diária" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
] as const;

const clientes: readonly ClientOption[] = [
  { id: "1", nome: "Marcos Andrade", cpf: "12345678900", telefone: "(11) 98888-1234", score: 82 },
  { id: "2", nome: "Juliana Prado", cpf: "98765432100", telefone: "(11) 97777-4321", score: 64 },
  { id: "3", nome: "Antônio Ferreira", cpf: "45678912300", score: 31 },
  { id: "4", nome: "Renata Lima", telefone: "(21) 96666-0000", score: 90 },
];

export function FormDemo() {
  const [valor, setValor] = useState<number | null>(1000);
  const [frequencia, setFrequencia] = useState<Frequencia>("mensal");
  const [cliente, setCliente] = useState<ClientOption | null>(null);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <ClientSearch
        clients={clientes}
        onValueChange={setCliente}
        hint={cliente ? `Escolhido: ${cliente.nome}` : "Digite parte do nome ou 3 dígitos do CPF."}
        emptyAction={
          <Button variant="tertiary" size="sm">
            Cadastrar cliente
          </Button>
        }
      />
      <MoneyInput
        label="Valor emprestado"
        value={valor}
        onValueChange={setValor}
        hint={`Valor lido: ${valor === null ? "vazio" : formatBRL(valor)}`}
      />
      <SegmentedControl
        label="Frequência"
        name="frequencia"
        options={frequencias}
        value={frequencia}
        onValueChange={setFrequencia}
        fullWidth
      />
      <Select
        label="Juro informado é"
        defaultValue=""
        placeholder="Escolha"
        options={[
          { value: "parcela", label: "Por parcela" },
          { value: "total", label: "Sobre o total" },
        ]}
      />
      <Textarea label="Observação" placeholder="Combinado na conversa de ontem..." hint="Só você vê." />
      <div className="flex flex-col gap-2">
        <Switch label="Cobrar juros em atraso" description="Soma 1% ao dia depois do vencimento." defaultChecked />
        <Switch label="Notificações push" />
        <Switch label="Indisponível" disabled />
      </div>
    </div>
  );
}

type FormaRecebimento = "parcela" | "juros" | "parcial" | "quitar";

const formas: readonly { valor: FormaRecebimento; titulo: string; descricao: string; total: number }[] = [
  { valor: "parcela", titulo: "Pagar a parcela", descricao: "2ª de 3, vence hoje", total: 366.67 },
  { valor: "juros", titulo: "Só os juros", descricao: "A parcela continua em aberto", total: 100 },
  { valor: "parcial", titulo: "Juros + parte da dívida", descricao: "Você digita quanto recebeu", total: 500 },
  { valor: "quitar", titulo: "Quitar tudo", descricao: "Encerra o contrato", total: 733.34 },
];

export function ReceiveDemo() {
  const [forma, setForma] = useState<FormaRecebimento>("parcela");
  const [valor, setValor] = useState<number | null>(366.67);

  return (
    <div className="grid gap-5 md:grid-cols-2">
      <RadioCardGroup label="Como o cliente pagou?">
        {formas.map((f) => (
          <RadioCard
            key={f.valor}
            name="forma"
            value={f.valor}
            title={f.titulo}
            description={f.descricao}
            trailing={formatBRL(f.total)}
            checked={forma === f.valor}
            onChange={() => {
              setForma(f.valor);
              setValor(f.total);
            }}
          />
        ))}
      </RadioCardGroup>
      <MoneyInput
        label="Valor recebido"
        value={valor}
        onValueChange={setValor}
        hint="Vem preenchido pela opção escolhida. Dá para ajustar."
      />
    </div>
  );
}

function espera(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function FeedbackDemo() {
  const [modal, setModal] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const toast = useToast();

  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="tertiary" onClick={() => setModal(true)}>
        Abrir modal
      </Button>
      <Button variant="danger" onClick={() => setConfirmar(true)}>
        Excluir cliente
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: "Pagamento registrado", description: "Parcela 2 de 3 · R$ 366,67", tone: "positive" })}>
        Aviso positivo
      </Button>
      <Button variant="secondary" onClick={() => toast({ title: "Não deu para enviar", description: "Confira a conexão e tente de novo.", tone: "negative" })}>
        Aviso de erro
      </Button>
      <Button
        variant="secondary"
        onClick={() => toast({ title: "Parcela marcada como paga", action: { label: "Desfazer", onClick: () => toast({ title: "Desfeito" }) } })}
      >
        Aviso com ação
      </Button>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Enviar contrato"
        description="Escolha como mandar o contrato #0042 para Marcos Andrade."
        footer={
          <>
            <Button variant="tertiary" onClick={() => setModal(false)}>
              PDF
            </Button>
            <Button onClick={() => setModal(false)}>Enviar no WhatsApp</Button>
          </>
        }
      />

      <ConfirmDialog
        open={confirmar}
        onClose={() => setConfirmar(false)}
        title="Excluir Marcos Andrade?"
        description="Os 2 contratos e as 6 parcelas dele também serão apagados. Não dá para desfazer."
        confirmLabel="Excluir cliente"
        pendingLabel="Excluindo…"
        onConfirm={async () => {
          await espera(1000);
          toast({ title: "Cliente excluído" });
        }}
      />
    </div>
  );
}
