"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { trocarSenhaAcao, type EstadoForm } from "@/lib/acoes";

/** Troca de senha. Os campos se limpam a cada envio: é o React que zera o formulário. */
export function PasswordForm() {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(trocarSenhaAcao, {});
  const erros = estado.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-5">
      <Card variant="outlined" className="grid gap-5 md:grid-cols-2">
        <Field
          label="Senha de hoje"
          name="atual"
          type="password"
          error={erros.atual}
          autoComplete="current-password"
          className="md:col-span-2"
        />
        <Field
          label="Senha nova"
          name="nova"
          type="password"
          error={erros.nova}
          autoComplete="new-password"
          hint="Pelo menos 8 caracteres."
        />
        <Field
          label="Repita a senha nova"
          name="confirmacao"
          type="password"
          error={erros.confirmacao}
          autoComplete="new-password"
        />
      </Card>

      <div className="flex flex-col-reverse items-center gap-2.5 md:flex-row md:justify-end">
        {estado.sucesso && !pendente && (
          <p role="status" className="text-body-sm text-positive-deep">
            {estado.sucesso}
          </p>
        )}
        <Button type="submit" variant="tertiary" disabled={pendente} className="w-full md:w-auto">
          {pendente ? "Trocando…" : "Trocar senha"}
        </Button>
      </div>
    </form>
  );
}
