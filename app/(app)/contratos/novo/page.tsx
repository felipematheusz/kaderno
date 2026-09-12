import type { Metadata } from "next";
import { ContractForm } from "@/components/domain/contract-form";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";
import { getClientes } from "@/lib/dados";
import { isoDate } from "@/lib/format";

export async function generateMetadata({ searchParams }: PageProps<"/contratos/novo">): Promise<Metadata> {
  const { tipo } = await searchParams;
  return { title: tipo === "venda" ? "Nova venda · Caderno" : "Novo contrato · Caderno" };
}

export default async function NovoContratoPage({ searchParams }: PageProps<"/contratos/novo">) {
  const { tipo, cliente } = await searchParams;
  const venda = tipo === "venda";
  const clientes = await getClientes();
  const voltarPara = venda ? "/contratos?modo=venda" : "/contratos";

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href={voltarPara}>{venda ? "Vendas" : "Contratos"}</BackLink>}
        title={venda ? "Nova venda" : "Novo contrato"}
        description="O rodapé refaz a conta a cada mudança: parcela, total e o que sobra para você."
      />
      <ContractForm
        clientes={clientes}
        tipo={venda ? "venda" : "emprestimo"}
        clienteInicial={typeof cliente === "string" ? cliente : undefined}
        hoje={isoDate(new Date())}
        voltarPara={voltarPara}
      />
    </>
  );
}
