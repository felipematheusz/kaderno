import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/domain/client-form";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";
import { getCliente } from "@/lib/dados";

export const metadata: Metadata = {
  title: "Editar cliente · Caderno",
};

export default async function EditarClientePage({ params }: PageProps<"/clientes/[id]/editar">) {
  const { id } = await params;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  return (
    <>
      <PageHeader eyebrow={<BackLink href={`/clientes/${id}`}>{cliente.nome}</BackLink>} title="Editar cliente" />
      <ClientForm cliente={cliente} voltarPara={`/clientes/${id}`} />
    </>
  );
}
