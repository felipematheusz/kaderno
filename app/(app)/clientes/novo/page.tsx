import type { Metadata } from "next";
import { ClientForm } from "@/components/domain/client-form";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";

export const metadata: Metadata = {
  title: "Novo cliente · Caderno",
};

export default function NovoClientePage() {
  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/clientes">Clientes</BackLink>}
        title="Novo cliente"
        description="Só o nome é obrigatório. O telefone é o que faz a cobrança sair no WhatsApp."
      />
      <ClientForm voltarPara="/clientes" />
    </>
  );
}
