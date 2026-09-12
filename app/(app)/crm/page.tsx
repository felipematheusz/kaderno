import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHeader } from "@/components/shell/page-header";
import { montarConversas } from "@/lib/conversas";
import { getClientes, getContratos, getParcelas } from "@/lib/dados";
import { Funil } from "./funil";

export const metadata: Metadata = {
  title: "CRM · Caderno",
};

export default async function CrmPage() {
  await connection(); // atraso e "vence hoje" mudam com o dia: não pode congelar no build
  const [clientes, contratos, parcelas] = await Promise.all([getClientes(), getContratos(), getParcelas()]);
  const conversas = montarConversas(clientes, contratos, parcelas, new Date());

  return (
    <>
      <PageHeader
        title="CRM"
        description={`${conversas.length} ${conversas.length === 1 ? "contato" : "contatos"} no funil.`}
      />
      <Funil conversas={conversas} />
    </>
  );
}
