import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContractForm } from "@/components/domain/contract-form";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";
import { getClientes, getContrato } from "@/lib/dados";
import { isoDate } from "@/lib/format";

export async function generateMetadata({ params }: PageProps<"/contratos/[id]/editar">): Promise<Metadata> {
  const { id } = await params;
  const contrato = await getContrato(id);
  return { title: contrato?.tipo === "venda" ? "Editar venda · Caderno" : "Editar contrato · Caderno" };
}

export default async function EditarContratoPage({ params }: PageProps<"/contratos/[id]/editar">) {
  const { id } = await params;
  const [contrato, clientes] = await Promise.all([getContrato(id), getClientes()]);
  if (!contrato) notFound();

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href={`/contratos/${id}`}>{contrato.numero}</BackLink>}
        title={contrato.tipo === "venda" ? "Editar venda" : "Editar contrato"}
      />
      <ContractForm
        clientes={clientes}
        tipo={contrato.tipo}
        contrato={contrato}
        hoje={isoDate(new Date())}
        voltarPara={`/contratos/${id}`}
      />
    </>
  );
}
