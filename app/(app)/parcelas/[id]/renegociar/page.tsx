import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenegotiateForm } from "@/components/domain/renegotiate-form";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";
import { getContrato, getParcela } from "@/lib/dados";
import { formatBRL, formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Renegociar parcela · Caderno",
};

export default async function RenegociarParcelaPage({ params }: PageProps<"/parcelas/[id]/renegociar">) {
  const { id } = await params;
  const parcela = await getParcela(id);
  if (!parcela) notFound();
  const contrato = await getContrato(parcela.contratoId);
  if (!contrato) notFound();

  return (
    <div className="flex w-full flex-col gap-5">
      <PageHeader
        eyebrow={<BackLink href={`/contratos/${parcela.contratoId}`}>{`${contrato.numero} · ${parcela.cliente}`}</BackLink>}
        title="Renegociar parcela"
        description={`Hoje a parcela ${parcela.parcela.numero} de ${parcela.parcela.total} é ${formatBRL(parcela.valor)} e vence em ${formatDate(parcela.vencimento)}.`}
      />
      <RenegotiateForm parcela={parcela} voltarPara={`/contratos/${parcela.contratoId}`} />
    </div>
  );
}
