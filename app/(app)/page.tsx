import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { ContractListHeader, ContractRow } from "@/components/domain/contract-row";
import { InstallmentActions } from "@/components/domain/installment-actions";
import { InstallmentRow } from "@/components/domain/installment-row";
import { StatCard } from "@/components/domain/stat-card";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { AlertIcon, BellIcon, CheckIcon, ClockIcon, ContractIcon, PlusIcon } from "@/components/ui/icons";
import { getConta, getInicio } from "@/lib/dados";
import { verParcela } from "@/lib/emprestimos";
import { cobrancaDaParcela } from "@/lib/mensagens";
import { formatBRL, formatLongDate, greeting } from "@/lib/format";

export const metadata: Metadata = {
  title: "Início · Caderno",
};

/** Como está o dia, em uma frase, logo abaixo da saudação. */
function resumoDoDia(vencemHoje: number, atrasadas: number): string {
  const hoje = `${vencemHoje} ${vencemHoje === 1 ? "parcela vence" : "parcelas vencem"} hoje`;
  const atraso = `${atrasadas} ${atrasadas === 1 ? "está atrasada" : "estão atrasadas"}`;

  if (vencemHoje > 0 && atrasadas > 0) return `${hoje} e ${atraso}.`;
  if (vencemHoje > 0) return `${hoje}.`;
  if (atrasadas > 0) return `Nada vence hoje, mas ${atraso}.`;
  return "Nada para receber hoje. Está tudo em dia.";
}

/** Título de cartão com resumo apagado ao lado e link à direita. */
function CardTitle({ titulo, resumo, href, rotulo }: { titulo: string; resumo?: string; href: string; rotulo: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 pt-5 pb-3 md:px-6">
      {/* No celular o resumo desce para baixo do título em vez de espremer. */}
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
        <h2 className="text-display-xs whitespace-nowrap">{titulo}</h2>
        {resumo && <span className="text-body-sm text-mute">{resumo}</span>}
      </div>
      <Link href={href} className="shrink-0 text-body-sm font-semibold underline underline-offset-4">
        {rotulo}
      </Link>
    </div>
  );
}

export default async function InicioPage() {
  await connection(); // saudação e data mudam a cada acesso: não pode congelar no build
  const agora = new Date();
  const [conta, { balanco, agenda, venceHoje, recebidoHoje, contratos, totalContratosAtivos }] = await Promise.all([
    getConta(),
    getInicio(),
  ]);

  const primeiroNome = conta.usuario.nome.split(" ")[0];
  const aReceber = balanco.aVencer + balanco.atrasado;

  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(agora)}
        title={`${greeting(agora)}, ${primeiroNome}.`}
        description={resumoDoDia(venceHoje, conta.atrasadas)}
        actions={
          <>
            {/* No celular, Notificações fica no menu "Mais": o sino some para os dois botões caberem numa linha. */}
            <Link
              href="/notificacoes"
              aria-label="Notificações"
              className={buttonClass({ variant: "ghost", size: "icon", className: "max-md:hidden" })}
            >
              <BellIcon />
            </Link>
            <Link href="/clientes/novo" className={buttonClass({ variant: "tertiary" })}>
              Novo cliente
            </Link>
            <Link href="/contratos/novo" className={buttonClass()}>
              <PlusIcon size={18} />
              Novo contrato
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatCard rotulo="Emprestado" valor={balanco.emprestado} icon={<ContractIcon />} />
        <StatCard
          rotulo="Recebido"
          valor={balanco.recebido}
          detalhe={`${formatBRL(recebidoHoje)} hoje`}
          icon={<CheckIcon />}
        />
        <StatCard
          rotulo="A receber"
          valor={aReceber}
          detalhe={`${formatBRL(balanco.jurosPrevistos)} são juros previstos`}
          icon={<ClockIcon />}
        />
        <StatCard
          rotulo="Atrasado"
          valor={balanco.atrasado}
          detalhe={
            conta.atrasadas === 0
              ? "Tudo em dia"
              : `${conta.atrasadas} ${conta.atrasadas === 1 ? "parcela" : "parcelas"}`
          }
          icon={<AlertIcon />}
          tone={balanco.atrasado > 0 ? "negative" : "default"}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,6fr)_minmax(0,5fr)]">
        <Card variant="outlined" flush>
          <CardTitle titulo="Parcelas de hoje" href="/parcelas" rotulo="Ver agenda" />
          {agenda.length === 0 ? (
            <p className="border-t border-canvas-soft px-5 py-6 text-body-md text-body md:px-6">
              Nada para receber hoje. Tudo em dia.
            </p>
          ) : (
            <ul>
              {agenda.map((p) => {
                const { status, prazo, detalhe } = verParcela(p, agora);
                return (
                  <InstallmentRow
                    key={p.id}
                    status={status}
                    prazo={prazo}
                    cliente={p.cliente}
                    contrato={p.contrato}
                    parcela={p.parcela}
                    tipo={p.tipo}
                    detalhe={detalhe}
                    valor={p.valor}
                    actions={
                      <InstallmentActions
                        status={status}
                        parcelaId={p.id}
                        cliente={p.cliente}
                        mensagem={cobrancaDaParcela(p, agora)}
                      />
                    }
                  />
                );
              })}
            </ul>
          )}
        </Card>

        <Card flush>
          <CardTitle titulo="Contratos ativos" resumo={String(totalContratosAtivos)} href="/contratos" rotulo="Ver todos" />
          {contratos.length === 0 ? (
            <div className="px-5 pb-5 md:px-6">
              <EmptyState
                title="Nenhum contrato ativo"
                description="Os contratos que você criar aparecem aqui com o andamento das parcelas."
              />
            </div>
          ) : (
            <>
              <ContractListHeader />
              <ul>
                {contratos.map((c) => (
                  <ContractRow
                    key={c.id}
                    cliente={c.cliente}
                    produto={c.produto}
                    numero={c.numero}
                    tipo={c.tipo}
                    valor={c.valor}
                    parcelas={c.parcelas}
                    alerta={c.alerta}
                    href={`/contratos/${c.id}`}
                  />
                ))}
              </ul>
            </>
          )}
        </Card>
      </div>
    </>
  );
}
