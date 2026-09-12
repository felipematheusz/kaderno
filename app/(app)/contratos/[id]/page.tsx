import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ChargeButton } from "@/components/domain/charge-dialog";
import { DeleteAction } from "@/components/domain/delete-action";
import { InstallmentActions } from "@/components/domain/installment-actions";
import { InstallmentRow } from "@/components/domain/installment-row";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallmentBar } from "@/components/ui/installment-bar";
import { Money } from "@/components/ui/money";
import { Pagination } from "@/components/ui/pagination";
import { rotuloFrequencia } from "@/lib/contrato";
import { getContrato, getParcelasDoContrato } from "@/lib/dados";
import { verParcela } from "@/lib/emprestimos";
import { diasAte, formatBRL, formatDate, formatShortDate } from "@/lib/format";
import { lerPagina, paginaDoItem, paginar } from "@/lib/paginacao";
import { cobrancaDaParcela, resumoDoContrato } from "@/lib/mensagens";

export async function generateMetadata({ params }: PageProps<"/contratos/[id]">): Promise<Metadata> {
  const { id } = await params;
  const contrato = await getContrato(id);
  return { title: contrato ? `${contrato.numero} · ${contrato.cliente} · Caderno` : "Contrato · Caderno" };
}

/** Quanto falta para o vencimento, escrito como gente. */
function quandoVence(dias: number): string {
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias > 1) return `em ${dias} dias`;
  return `venceu há ${-dias} ${-dias === 1 ? "dia" : "dias"}`;
}

export default async function ContratoPage({ params, searchParams }: PageProps<"/contratos/[id]">) {
  await connection(); // o que está em dia ou atrasado depende do dia de hoje
  const agora = new Date();
  const { id } = await params;
  const { pagina } = await searchParams;
  const contrato = await getContrato(id);
  if (!contrato) notFound();

  const parcelas = await getParcelasDoContrato(id);
  const aberta = parcelas.findIndex((p) => !p.pago);
  const proxima = aberta === -1 ? undefined : parcelas[aberta];
  const venda = contrato.tipo === "venda";

  // Contrato diário passa de 70 parcelas. Sem página na URL, abre onde está a próxima a receber.
  const { itens, paginacao } = paginar(parcelas, pagina === undefined ? paginaDoItem(aberta) : lerPagina(pagina));

  const resumo = [
    venda ? "venda" : "empréstimo",
    `${contrato.totalParcelas}x ${rotuloFrequencia[contrato.frequencia]}`,
    contrato.taxa > 0 ? `${contrato.taxa}% ao mês` : "sem juros",
  ].join(" · ");

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href={venda ? "/contratos?modo=venda" : "/contratos"}>{venda ? "Vendas" : "Contratos"}</BackLink>}
        title={contrato.cliente}
        description={`${contrato.numero}${contrato.produto ? ` · ${contrato.produto}` : ""} · ${resumo}`}
        actions={
          <>
            <Link href={`/clientes/${contrato.clienteId}`} className={buttonClass({ variant: "tertiary" })}>
              Ver cliente
            </Link>
            <Link href={`/contratos/${id}/editar`} className={buttonClass({ variant: "tertiary" })}>
              Editar
            </Link>
            <DeleteAction
              tipo="contrato"
              id={id}
              titulo={`Excluir o contrato ${contrato.numero}?`}
              descricao={
                contrato.totalParcelas === 1
                  ? "A parcela e o histórico de recebimento somem junto. Não dá para desfazer."
                  : `As ${contrato.totalParcelas} parcelas e o histórico de recebimento somem junto. Não dá para desfazer.`
              }
              rotulo="Excluir"
              destino={venda ? "/contratos?modo=venda" : "/contratos"}
              aviso="Contrato excluído"
            />
          </>
        }
      />

      <Card flush>
        <div className="grid grid-cols-2 border-b border-canvas-soft md:grid-cols-4">
          <div className="flex flex-col gap-1 border-b border-canvas-soft p-5 md:border-b-0 md:border-r">
            <span className="text-caption text-mute">{venda ? "Preço" : "Emprestado"}</span>
            <span className="text-body-md font-semibold">{formatBRL(contrato.principal)}</span>
          </div>
          <div className="flex flex-col gap-1 border-b border-l border-canvas-soft p-5 md:border-b-0 md:border-r">
            <span className="text-caption text-mute">Juros</span>
            <span className="text-body-md font-semibold">{formatBRL(contrato.juros)}</span>
          </div>
          <div className="flex flex-col gap-1 p-5 md:border-r md:border-canvas-soft">
            <span className="text-caption text-mute">Total a receber</span>
            <span className="text-body-md font-semibold">{formatBRL(contrato.valor)}</span>
          </div>
          <div className="flex flex-col gap-1 border-l border-canvas-soft p-5 md:border-l-0">
            <span className="text-caption text-mute">Falta</span>
            <span className="text-body-md font-semibold">{formatBRL(contrato.aReceber)}</span>
          </div>
        </div>

        <div className="flex flex-col gap-4 p-5 md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-body-sm">
              <strong className="font-semibold">
                {contrato.pagas} de {contrato.totalParcelas} parcelas pagas
              </strong>
              <span className="text-body"> · {formatBRL(contrato.recebido)} recebidos</span>
            </span>
            <ChargeButton
              mensagem={resumoDoContrato(contrato, parcelas[0]?.valor ?? 0)}
              cliente={contrato.cliente}
              rotulo="Enviar contrato"
            />
          </div>
          <InstallmentBar parcelas={contrato.parcelas} />
        </div>
      </Card>

      {proxima ? (
        <Card variant="inverse" className="flex flex-col gap-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-1.5">
              <span className="text-body-sm text-canvas-soft">Próximo vencimento</span>
              <span className="text-body-md font-semibold text-canvas">{formatDate(proxima.vencimento)}</span>
              <span className="text-body-sm text-mute-inverse">
                {proxima.numero}ª parcela · {quandoVence(diasAte(proxima.vencimento, agora))}
              </span>
            </div>
            <Money valor={proxima.valor} size="md" />
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <ChargeButton
              mensagem={cobrancaDaParcela(proxima, agora)}
              cliente={contrato.cliente}
              variant="inverse"
              size="md"
            />
            <Link
              href={`/parcelas/${proxima.id}/renegociar`}
              className={buttonClass({ variant: "inverse", className: "w-full" })}
            >
              Renegociar
            </Link>
            <Link href={`/parcelas/${proxima.id}/pagar`} className={buttonClass({ className: "w-full" })}>
              Pagar
            </Link>
          </div>
        </Card>
      ) : (
        <Card variant="pale" className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-body-md font-semibold">Contrato quitado. Nada mais a receber.</span>
          <span className="text-body-sm text-positive-deep">{formatBRL(contrato.recebido)} recebidos no total</span>
        </Card>
      )}

      {contrato.observacao && (
        <Card variant="sage" className="flex flex-col gap-1.5">
          <span className="text-caption text-mute">Observação</span>
          <p className="text-body-md">{contrato.observacao}</p>
        </Card>
      )}

      <Card flush>
        <div className="flex items-baseline justify-between gap-4 px-5 pt-5 pb-3 md:px-6">
          <h2 className="text-display-xs">Parcelas</h2>
          <span className="text-body-sm text-mute">
            {contrato.totalParcelas} parcelas · {formatBRL(contrato.valor)}
          </span>
        </div>
        <ul>
          {itens.map((p) => {
            const { status, detalhe } = verParcela(p, agora);
            return (
              <InstallmentRow
                key={p.id}
                status={status}
                prazo={formatShortDate(p.vencimento)}
                cliente={`${p.numero}ª parcela`}
                contrato={contrato.numero}
                parcela={p.parcela}
                tipo={contrato.tipo}
                detalhe={detalhe ?? (p.renegociada ? "renegociada" : undefined)}
                valor={p.valor}
                actions={
                  <InstallmentActions
                    status={status}
                    parcelaId={p.id}
                    cliente={contrato.cliente}
                    mensagem={cobrancaDaParcela(p, agora)}
                  />
                }
              />
            );
          })}
        </ul>
        <Pagination
          {...paginacao}
          href={(p) => `/contratos/${id}?pagina=${p}`}
          rotulo="parcelas"
          className="px-5 pt-1 pb-5 md:px-6"
        />
      </Card>
    </>
  );
}
