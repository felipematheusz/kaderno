import type { Metadata } from "next";
import type { ReactNode } from "react";
import { LogoutAction } from "@/components/domain/logout-action";
import { NoticeSettings } from "@/components/domain/notice-settings";
import { PasswordForm } from "@/components/domain/password-form";
import { ProfileForm } from "@/components/domain/profile-form";
import { PageHeader } from "@/components/shell/page-header";
import { Card } from "@/components/ui/card";
import { getPerfil } from "@/lib/dados";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Perfil e conta · Caderno",
};

/** Um assunto da tela: título, uma linha de apoio e o bloco. */
function Secao({ titulo, descricao, children }: { titulo: string; descricao?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-display-xs">{titulo}</h2>
        {descricao && <p className="text-body-sm text-body">{descricao}</p>}
      </div>
      {children}
    </section>
  );
}

export default async function PerfilPage() {
  const perfil = await getPerfil();

  return (
    <>
      <PageHeader title="Perfil e conta" description={`No Caderno desde ${formatDate(perfil.desde)}.`} />

      <Secao titulo="Seus dados" descricao="O que aparece no menu e nos contratos que você envia.">
        <ProfileForm perfil={perfil} />
      </Secao>

      <Secao titulo="Senha" descricao="Troque de vez em quando, principalmente se alguém já usou este aparelho.">
        <PasswordForm />
      </Secao>

      <Secao titulo="Avisos" descricao="O que o Caderno manda para o seu celular.">
        <NoticeSettings avisos={perfil.avisos} />
      </Secao>

      <Secao titulo="Sair da conta">
        <Card variant="sage" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-body-md text-body">Sai só deste aparelho. Nada é apagado.</p>
          <LogoutAction />
        </Card>
      </Secao>
    </>
  );
}
