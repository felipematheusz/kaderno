import type { Metadata } from "next";
import { EntrarForm } from "@/components/domain/login-forms";

export const metadata: Metadata = {
  title: "Entrar · Caderno",
};

const ERROS: Record<string, string> = {
  link: "O link abriu depois de vencer ou já tinha sido usado. Entre com sua senha ou peça outro.",
  "sem-conta": "Seu login existe, mas a conta não foi encontrada. Fale com o suporte.",
};

export default async function EntrarPage({ searchParams }: PageProps<"/entrar">) {
  const { voltar, erro } = await searchParams;
  return (
    <EntrarForm
      voltar={typeof voltar === "string" ? voltar : undefined}
      erroInicial={typeof erro === "string" ? ERROS[erro] : undefined}
    />
  );
}
