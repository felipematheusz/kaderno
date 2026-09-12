import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ReceiveForm } from "@/components/domain/receive-form";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Money } from "@/components/ui/money";
import { getContrato, getParcela } from "@/lib/dados";
import { verParcela } from "@/lib/emprestimos";
import { formatDate, isoDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Receber pagamento · Caderno",
};

export default async function PagarParcelaPage({ params }: PageProps<"/parcelas/[id]/pagar">) {
  await connection(); // o prazo da parcela muda conforme o dia
  const agora = new Date();
  const { id } = await params;
  const parcela = await getParcela(id);
  if (!parcela) notFound();
  const contrato = await getContrato(parcela.contratoId);
  if (!contrato) notFound();

  const { prazo, detalhe } = verParcela(parcela, agora);
  const voltarPara = `/contratos/${parcela.contratoId}`;

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        eyebrow={<BackLink href={voltarPara}>{`${contrato.numero} · ${parcela.cliente}`}</BackLink>}
        title={parcela.pago ? "Parcela já paga" : "Receber pagamento"}
        description={`Parcela ${parcela.parcela.numero} de ${parcela.parcela.total} · vence ${prazo}${detalhe ? ` · ${detalhe}` : ""}`}
        actions={
          <Link href={`/parcelas/${id}/renegociar`} className={buttonClass({ variant: "tertiary" })}>
            Renegociar
          </Link>
        }
      />

      <Card variant="inverse" className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-body-sm text-canvas-soft">Valor da parcela</span>
          <span className="text-body-sm text-mute-inverse">Vencimento em {formatDate(parcela.vencimento)}</span>
        </div>
        <Money valor={parcela.valor} size="md" />
      </Card>

      {parcela.pago ? (
        <Card variant="pale" className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-body-md font-semibold">Essa parcela já foi recebida.</span>
          <Link href={voltarPara} className={buttonClass({ variant: "tertiary" })}>
            Voltar ao contrato
          </Link>
        </Card>
      ) : (
        <ReceiveForm parcela={parcela} contrato={contrato} hoje={isoDate(agora)} voltarPara={voltarPara} />
      )}
    </div>
  );
}
