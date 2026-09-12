import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BalanceBar } from "@/components/domain/balance-bar";
import { ClientAvatar } from "@/components/domain/client-avatar";
import { ChargeButton } from "@/components/domain/charge-dialog";
import { ClientCard } from "@/components/domain/client-card";
import { ContractListHeader, ContractRow } from "@/components/domain/contract-row";
import { InstallmentRow } from "@/components/domain/installment-row";
import { MessagePreview } from "@/components/domain/message-preview";
import { MonthCalendar, MonthCalendarLegend, type DiaDoCalendario } from "@/components/domain/month-calendar";
import { MonthlyFlow, type MesDeFluxo } from "@/components/domain/monthly-flow";
import { TimelineRow } from "@/components/domain/timeline-row";
import { StatCard } from "@/components/domain/stat-card";
import { BottomNav } from "@/components/shell/bottom-nav";
import { PageHeader } from "@/components/shell/page-header";
import { Sidebar } from "@/components/shell/sidebar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { AlertIcon, BellIcon, CheckIcon, ClockIcon, ContractIcon, PlusIcon, UsersIcon } from "@/components/ui/icons";
import { InstallmentBar, type InstallmentStatus } from "@/components/ui/installment-bar";
import { Money } from "@/components/ui/money";
import { NavTabs } from "@/components/ui/nav-tabs";
import { Pagination } from "@/components/ui/pagination";
import { formatBRL, formatLongDate } from "@/lib/format";
import { lerPagina, paginar } from "@/lib/paginacao";
import { MODELOS } from "@/lib/mensagens";
import { FeedbackDemo, FiltersDemo, FormDemo, ReceiveDemo, TabsDemo } from "./_demos";

export const metadata: Metadata = {
  title: "Identidade visual · Caderno",
};

type Swatch = { nome: string; classe: string; hex: string; papel: string };

const cores: readonly Swatch[] = [
  { nome: "Verde Wise", classe: "bg-primary", hex: "#9FE870", papel: "ação principal" },
  { nome: "Verde ativo", classe: "bg-primary-active", hex: "#CDFFAD", papel: "hover" },
  { nome: "Verde neutro", classe: "bg-primary-neutral", hex: "#C5EDAB", papel: "seleção suave" },
  { nome: "Verde pálido", classe: "bg-primary-pale", hex: "#E2F6D5", papel: "selo positivo" },
  { nome: "Sálvia", classe: "bg-canvas-soft", hex: "#E8EBE6", papel: "fundo" },
  { nome: "Branco", classe: "bg-canvas", hex: "#FFFFFF", papel: "cartões" },
  { nome: "Tinta", classe: "bg-ink", hex: "#0E0F0C", papel: "texto, selo quitado" },
  { nome: "Verde-floresta", classe: "bg-ink-deep", hex: "#163300", papel: "cartão invertido" },
  { nome: "Positivo", classe: "bg-positive", hex: "#2EAD4B", papel: "situação" },
  { nome: "Alerta", classe: "bg-warning", hex: "#FFD11A", papel: "vence hoje" },
  { nome: "Negativo", classe: "bg-negative", hex: "#D03238", papel: "erro, atraso" },
  { nome: "Vinho", classe: "bg-negative-bg", hex: "#320707", papel: "selo atrasado" },
];

type Recebimento = { id: string; data: string; cliente: string; contrato: string; tipo: string; valor: number };

const recebimentos: readonly Recebimento[] = [
  { id: "r1", data: "11/09/2026", cliente: "Marcos Andrade", contrato: "#0042", tipo: "Parcela", valor: 366.67 },
  { id: "r2", data: "10/09/2026", cliente: "Juliana Prado", contrato: "#0041", tipo: "Só os juros", valor: 240 },
  { id: "r3", data: "08/09/2026", cliente: "Renata Lima", contrato: "#0038", tipo: "Parcela", valor: 400 },
];

/** Lista longa só para a vitrine: a paginação abaixo da tabela funciona de verdade. */
const muitosRecebimentos: readonly Recebimento[] = Array.from({ length: 134 }, (_, i) => ({
  ...recebimentos[i % recebimentos.length],
  id: `r${i}`,
}));

const colunas: readonly DataTableColumn<Recebimento>[] = [
  { key: "data", header: "Data", cell: (r) => r.data },
  { key: "cliente", header: "Cliente", cell: (r) => <span className="font-semibold">{r.cliente}</span> },
  { key: "contrato", header: "Contrato", cell: (r) => r.contrato },
  { key: "tipo", header: "Tipo", cell: (r) => r.tipo },
  { key: "valor", header: "Valor", align: "right", cell: (r) => <span className="font-semibold">{formatBRL(r.valor)}</span> },
];

/** Contrato diário de 72 parcelas: 30 pagas, a 31ª atrasada, a 32ª é a próxima. */
const diarias: readonly InstallmentStatus[] = Array.from({ length: 72 }, (_, i) =>
  i < 30 ? "paga" : i === 30 ? "atrasada" : i === 31 ? "proxima" : "futura",
);

/** As mesmas 72 pagas salteado: gera trechos demais e força a junção dos menores. */
const salteadas: readonly InstallmentStatus[] = Array.from({ length: 72 }, (_, i) =>
  i === 61 ? "atrasada" : i < 60 && i % 2 === 0 ? "paga" : "futura",
);

/** Setembro fixo: a vitrine não pode mudar de mês sozinha. */
const MES_EXEMPLO = "2026-09";
const HOJE_EXEMPLO = "2026-09-12";

const diasDoMes: readonly DiaDoCalendario[] = [
  { data: "2026-09-04", valores: { paga: 400, atrasada: 0, hoje: 0, futura: 0 }, parcelas: 1 },
  { data: "2026-09-08", valores: { paga: 60, atrasada: 220, hoje: 0, futura: 0 }, parcelas: 2 },
  { data: "2026-09-11", valores: { paga: 0, atrasada: 60, hoje: 0, futura: 0 }, parcelas: 1 },
  { data: "2026-09-12", valores: { paga: 366.67, atrasada: 0, hoje: 500, futura: 0 }, parcelas: 3 },
  { data: "2026-09-15", valores: { paga: 0, atrasada: 0, hoje: 0, futura: 390 }, parcelas: 2 },
  { data: "2026-09-22", valores: { paga: 0, atrasada: 0, hoje: 0, futura: 440 }, parcelas: 1 },
  { data: "2026-09-30", valores: { paga: 0, atrasada: 0, hoje: 0, futura: 220 }, parcelas: 1 },
];

/** Seis meses fixos: a vitrine não pode mudar de mês sozinha. */
const fluxoExemplo: readonly MesDeFluxo[] = [
  { mes: "2026-04", entrada: 2400, saida: 3600 },
  { mes: "2026-05", entrada: 3100, saida: 1250 },
  { mes: "2026-06", entrada: 2850, saida: 0 },
  { mes: "2026-07", entrada: 3320, saida: 2400 },
  { mes: "2026-08", entrada: 2960, saida: 800 },
  { mes: "2026-09", entrada: 1480, saida: 1000 },
];

const usuario = { nome: "Felipe Moura" };
const plano = { nome: "Plano gratuito", usados: 4, limite: 5, unidade: "contratos" };

function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-display-md">{titulo}</h2>
        {descricao && <p className="text-body-md text-body">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

/** Vitrine viva da identidade. Serve de referência ao criar telas; não é tela do produto. */
export default async function DesignPage({ searchParams }: PageProps<"/design">) {
  const { modo, pagina } = await searchParams;
  const vendas = modo === "venda";
  const { itens: recebimentosDaPagina, paginacao } = paginar(muitosRecebimentos, lerPagina(pagina), 3);
  const linkPagina = (p: number): string =>
    `/design?${new URLSearchParams(vendas ? { modo: "venda", pagina: String(p) } : { pagina: String(p) }).toString()}#paginacao`;

  return (
    <main className="mx-auto flex w-full max-w-[1200px] flex-col gap-12 px-4 py-12 md:px-6">
      <header className="flex flex-col gap-4">
        <p className="text-body-sm text-body">Referência de implementação · DESIGN.md</p>
        <h1 className="text-display-lg md:text-display-xl">Identidade visual</h1>
      </header>

      <Secao titulo="Cores">
        <Card className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          {cores.map((c) => (
            <div key={c.classe} className="flex flex-col gap-2">
              <div className={`h-16 rounded-md border border-canvas-soft ${c.classe}`} />
              <span className="text-body-sm font-semibold">{c.nome}</span>
              <span className="text-caption text-mute">
                {c.hex} · {c.papel}
              </span>
            </div>
          ))}
        </Card>
      </Secao>

      <Secao titulo="Superfícies">
        <Card className="grid gap-4 md:grid-cols-4">
          <Card variant="sage" className="flex flex-col gap-2">
            <span className="text-caption text-body">Cartão sálvia</span>
            <span className="text-display-md">7</span>
            <span>contratos ativos</span>
          </Card>
          <Card variant="pale" className="flex flex-col gap-2">
            <span className="text-caption text-body">Cartão verde-pálido</span>
            <Money valor={1240} size="md" />
            <span>recebidos neste mês</span>
          </Card>
          <Card variant="inverse" className="flex flex-col gap-2">
            <span className="text-caption text-canvas-soft">Cartão invertido</span>
            <Money valor={6020} size="md" />
            <span className="text-canvas">a receber</span>
          </Card>
          <Card variant="outlined" className="flex flex-col gap-2">
            <span className="text-caption text-body">Cartão com contorno</span>
            <span className="text-display-xs">Simular contrato</span>
            <span className="text-body-sm text-body">Onde se digita.</span>
          </Card>
        </Card>
      </Secao>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col gap-5">
          <h2 className="text-display-md">Botões</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button>Novo contrato</Button>
            <Button variant="secondary">Cobrar</Button>
            <Button variant="tertiary">Novo cliente</Button>
            <Button variant="danger" size="sm">
              Excluir
            </Button>
            <Button variant="ghost" size="icon-sm" aria-label="Notificações">
              <BellIcon />
            </Button>
          </div>
          <Card variant="inverse" className="flex gap-2">
            <Button variant="inverse" size="sm">
              Renegociar
            </Button>
            <Button size="sm">Pagar</Button>
          </Card>
        </Card>

        <Card className="flex flex-col gap-5">
          <h2 className="text-display-md">Selos e parcelas</h2>
          <div className="flex flex-wrap gap-2">
            <Badge tone="positive">Em dia</Badge>
            <Badge tone="warning">Vence hoje</Badge>
            <Badge tone="negative">Atrasado · 4 dias</Badge>
            <Badge tone="neutral">A vencer</Badge>
            <Badge tone="ink">Quitado</Badge>
            <Badge tone="deep">2</Badge>
            <Badge tone="soft">Renegociada</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-body-sm">
              <span className="font-semibold">Marcos Andrade</span>
              <span className="font-semibold">{formatBRL(1100)}</span>
            </div>
            <InstallmentBar parcelas={["paga", "proxima", "futura"]} />
            <InstallmentBar parcelas={["paga", "atrasada", "futura", "futura"]} size="sm" />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-caption text-body">72 parcelas (contrato diário), 30 pagas e a 31ª atrasada</span>
            <InstallmentBar parcelas={diarias} />
            <span className="text-caption text-body">As mesmas 72, pagas salteado: os trechos menores se juntam</span>
            <InstallmentBar parcelas={salteadas} size="sm" />
          </div>
        </Card>
      </div>

      <Secao
        titulo="Estrutura"
        descricao="Menu lateral no desktop, barra inferior no celular. O AppShell junta os dois e esconde cada um no tamanho certo. O menu recolhe para só ícones abaixo de 1280px ou pelo botão ao lado do logo."
      >
        <div className="grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]">
          <div className="flex items-start gap-4">
            <div className="h-[760px] overflow-hidden rounded-xl">
              <Sidebar user={usuario} plan={plano} overdueCount={1} mode="aberto" currentPath="/" />
            </div>
            <div className="h-[760px] overflow-hidden rounded-xl">
              <Sidebar user={usuario} plan={plano} overdueCount={1} mode="fechado" currentPath="/" />
            </div>
          </div>
          <div className="flex min-w-0 flex-col gap-6">
            <Card variant="sage" className="flex flex-col gap-6">
              <PageHeader
                eyebrow={formatLongDate(new Date())}
                title="Bom dia, Felipe."
                actions={
                  <>
                    <Button variant="ghost" size="icon" aria-label="Notificações">
                      <BellIcon />
                    </Button>
                    <Button variant="tertiary">Novo cliente</Button>
                    <Button>
                      <PlusIcon size={18} />
                      Novo contrato
                    </Button>
                  </>
                }
              />
            </Card>
            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-semibold">Barra inferior (celular)</span>
              <div className="w-full max-w-[390px] overflow-hidden rounded-xl">
                <BottomNav overdueCount={1} currentPath="/contratos" />
              </div>
            </div>
          </div>
        </div>
      </Secao>

      <Secao titulo="Abas e filtros" descricao="Tabs troca conteúdo na tela; NavTabs troca a URL; filtros ficam em tinta quando escolhidos.">
        <Card className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-caption text-body">NavTabs (muda a URL: ?modo=venda)</span>
            <NavTabs
              aria-label="Tipo de operação"
              items={[
                { href: "/design", label: "Contratos", active: !vendas },
                { href: "/design?modo=venda", label: "Vendas", active: vendas },
              ]}
            />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-caption text-body">Tabs (troca o painel)</span>
            <TabsDemo />
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-caption text-body">Filtros</span>
            <FiltersDemo />
          </div>
        </Card>
      </Secao>

      <Secao titulo="Dados">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <StatCard rotulo="Emprestado" valor={12400} icon={<ContractIcon />} />
          <StatCard rotulo="Recebido" valor={7180} detalhe={`${formatBRL(806.67)} hoje`} icon={<CheckIcon />} />
          <StatCard
            rotulo="A receber"
            valor={6020}
            detalhe={`${formatBRL(800)} são juros previstos`}
            icon={<ClockIcon />}
          />
          <StatCard rotulo="Atrasado" valor={220} detalhe="1 parcela" icon={<AlertIcon />} tone="negative" />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Card className="flex flex-col gap-5">
            <span className="text-body-sm text-body">Balanço (BalanceBar)</span>
            <BalanceBar recebido={7180} aVencer={5800} atrasado={220} />
          </Card>
          <Card className="flex flex-wrap items-center gap-5">
            <ClientAvatar nome="Marcos Andrade" score={82} size="lg" />
            <ClientAvatar nome="Juliana Prado" score={64} />
            <ClientAvatar nome="Antônio Ferreira" score={31} size="sm" />
            <ClientAvatar nome="Renata Lima" />
          </Card>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <ClientCard
            nome="Marcos Andrade"
            telefone="(11) 98844-1220"
            score={82}
            contratosAtivos={1}
            emprestado={3800}
            recebido={3766.67}
            href="/design"
          />
          <ClientCard
            nome="Antônio Ferreira"
            telefone="(21) 98812-3344"
            score={31}
            contratosAtivos={1}
            emprestado={800}
            recebido={220}
            alerta="1 parcela atrasada"
            href="/design"
          />
          <ClientCard nome="Beatriz Souza" telefone="(85) 98122-7766" contratosAtivos={0} emprestado={0} recebido={0} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Card variant="outlined" flush>
            <div className="flex items-baseline gap-2.5 px-5 pt-5 pb-3 md:px-6">
              <h3 className="text-display-xs">Parcelas de hoje</h3>
              <span className="text-body-sm text-mute">2 · {formatBRL(806.67)}</span>
            </div>
            <ul>
              <InstallmentRow
                status="atrasada"
                prazo="07/09"
                cliente="Antônio Ferreira"
                contrato="#0039"
                parcela={{ numero: 2, total: 4 }}
                detalhe="4 dias atrasada"
                valor={220}
                actions={
                  <>
                    <Button variant="secondary" size="sm">
                      Cobrar
                    </Button>
                    <Button size="sm">Pagar</Button>
                  </>
                }
              />
              <InstallmentRow
                status="paga"
                prazo="hoje"
                cliente="Marcos Andrade"
                contrato="#0042"
                parcela={{ numero: 1, total: 3 }}
                detalhe="recebida via Pix"
                valor={366.67}
              />
              <InstallmentRow
                status="hoje"
                prazo="hoje"
                cliente="Juliana Prado"
                contrato="#0041"
                parcela={{ numero: 3, total: 6 }}
                valor={440}
                actions={
                  <>
                    <Button variant="secondary" size="sm">
                      Cobrar
                    </Button>
                    <Button size="sm">Pagar</Button>
                  </>
                }
              />
              <InstallmentRow
                status="futura"
                prazo="amanhã"
                cliente="Renata Lima"
                contrato="#0038"
                tipo="venda"
                parcela={{ numero: 5, total: 8 }}
                valor={400}
                actions={
                  <Button variant="secondary" size="sm">
                    Lembrar
                  </Button>
                }
              />
            </ul>
          </Card>

          <Card flush>
            <div className="flex items-baseline gap-2.5 px-5 pt-5 pb-3 md:px-6">
              <h3 className="text-display-xs">Contratos ativos</h3>
              <span className="text-body-sm text-mute">4</span>
            </div>
            <ContractListHeader />
            <ul>
              <ContractRow cliente="Marcos Andrade" numero="#0042" valor={1100} parcelas={["paga", "proxima", "futura"]} href="/design" />
              <ContractRow
                cliente="Antônio Ferreira"
                numero="#0039"
                valor={880}
                parcelas={["paga", "atrasada", "futura", "futura"]}
                alerta="4 dias atrasada"
                href="/design"
              />
              <ContractRow
                cliente="Renata Lima"
                produto="Notebook Dell"
                numero="#0038"
                tipo="venda"
                valor={3200}
                parcelas={["paga", "paga", "paga", "paga", "proxima", "futura", "futura", "futura"]}
                href="/design"
              />
            </ul>
          </Card>
        </div>

        <div id="paginacao" className="flex flex-col gap-4">
          <Card flush>
            <DataTable
              caption="Últimos recebimentos"
              columns={colunas}
              rows={recebimentosDaPagina}
              rowKey={(r) => r.id}
            />
          </Card>
          <Pagination {...paginacao} href={linkPagina} rotulo="recebimentos" />
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-2">
          <Card flush>
            <div className="flex items-baseline gap-2.5 px-5 pt-5 pb-4 md:px-6">
              <h3 className="text-display-xs">Entrou e saiu (MonthlyFlow)</h3>
            </div>
            <div className="px-5 pb-6 md:px-6">
              <MonthlyFlow meses={fluxoExemplo} />
            </div>
          </Card>

          <Card flush>
            <div className="flex items-baseline gap-2.5 px-5 pt-5 pb-3 md:px-6">
              <h3 className="text-display-xs">Histórico (TimelineRow)</h3>
            </div>
            <ul>
              <TimelineRow
                tipo="pagamento"
                data="2026-09-11"
                titulo="Marcos Andrade"
                detalhe="#0042 · parcela 1 de 3 · Pix"
                valor={366.67}
                href="/design"
              />
              <TimelineRow
                tipo="contrato"
                data="2026-09-08"
                titulo="Renata Lima"
                detalhe="#0038 · Notebook Dell · 8 parcelas"
                valor={2100}
                href="/design"
              />
              <TimelineRow tipo="cliente" data="2026-09-02" titulo="Beatriz Souza" detalhe="Cliente cadastrado" href="/design" />
            </ul>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <EmptyState
            icon={<UsersIcon size={24} />}
            title="Nenhum cliente ainda"
            description="Cadastre o primeiro para começar a registrar empréstimos."
            action={<Button variant="tertiary">Cadastrar cliente</Button>}
          />
          <Card className="flex flex-col gap-4">
            <span className="text-body-sm text-body">Prévia da mensagem (MessagePreview) e o botão que a abre (ChargeButton)</span>
            <ChargeButton
              cliente="Marcos Andrade"
              className="self-start"
              mensagem={{
                template: MODELOS.atraso,
                valores: {
                  nome: "Marcos",
                  valor: formatBRL(366.67),
                  parcela: "2 de 3",
                  contrato: "#0042",
                  vencimento: "08/09",
                  atraso: "4 dias atrasada",
                },
                telefone: "(11) 98844-1220",
              }}
            />
            <MessagePreview
              template={"Oi, {nome}! Passando para lembrar que a parcela de {valor} vence {vencimento}.\nQualquer coisa, me chama. {assinatura}"}
              values={{ nome: "Marcos", valor: "R$ 366,67", vencimento: "hoje (11/09)" }}
              time="09:41"
            />
            <span className="text-caption text-mute">{"{assinatura}"} ficou sem valor: aparece marcada em vermelho.</span>
          </Card>
        </div>
      </Secao>

      <Secao
        titulo="Calendário"
        descricao="Cada dia com movimento vira um bloco sálvia, com a fita das situações e o valor do dia. O dia aberto fica em tinta; hoje leva a pílula."
      >
        <Card flush className="max-w-2xl">
          <div className="px-2 pt-4 sm:px-3">
            <MonthCalendar
              mes={MES_EXEMPLO}
              dias={diasDoMes}
              selecionado={HOJE_EXEMPLO}
              hoje={HOJE_EXEMPLO}
              href={() => "/design"}
            />
          </div>
          <MonthCalendarLegend className="px-4 pt-3 pb-5 sm:px-5" />
        </Card>
      </Secao>

      <Secao titulo="Formulário">
        <Card className="grid gap-5 md:grid-cols-3">
          <Field label="Cliente" placeholder="Buscar por nome ou CPF" />
          <Field label="Valor emprestado" size="lg" defaultValue="1.000,00" trailing={<span className="text-body-sm font-semibold text-body">BRL</span>} />
          <Field label="Primeira parcela" defaultValue="30/02/2026" error="Essa data não existe. Confira o dia e o mês." />
        </Card>
        <Card variant="outlined">
          <FormDemo />
        </Card>
        <Card>
          <ReceiveDemo />
        </Card>
      </Secao>

      <Secao titulo="Retorno" descricao="Modal e confirmação com <dialog> nativo. Aviso (toast) some sozinho em 5 segundos.">
        <Card>
          <FeedbackDemo />
        </Card>
      </Secao>
    </main>
  );
}
