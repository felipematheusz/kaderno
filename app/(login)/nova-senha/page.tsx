import type { Metadata } from "next";
import { NovaSenhaForm } from "@/components/domain/login-forms";
import { contextoWeb } from "@/lib/sessao";

export const metadata: Metadata = {
  title: "Senha nova · Caderno",
};

/** Aberta pelo link de recuperação: o link já abriu a sessão, então só falta a senha. */
export default async function NovaSenhaPage() {
  await contextoWeb();
  return <NovaSenhaForm />;
}
