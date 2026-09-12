import type { Metadata } from "next";
import { connection } from "next/server";
import { montarConversas } from "@/lib/conversas";
import { getClientes, getContratos, getParcelas, getPerfil } from "@/lib/dados";
import { Inbox } from "./inbox";

export const metadata: Metadata = {
  title: "Conversas · Caderno",
};

export default async function ConversasPage({ searchParams }: PageProps<"/conversas">) {
  await connection(); // atraso e "vence hoje" mudam com o dia: não pode congelar no build
  const { conversa } = await searchParams;
  const [clientes, contratos, parcelas, perfil] = await Promise.all([
    getClientes(),
    getContratos(),
    getParcelas(),
    getPerfil(),
  ]);

  return (
    <Inbox
      conversas={montarConversas(clientes, contratos, parcelas, new Date())}
      numero={perfil.telefone}
      usuario={perfil.nome.split(" ")[0]}
      inicial={typeof conversa === "string" ? conversa : undefined}
    />
  );
}
