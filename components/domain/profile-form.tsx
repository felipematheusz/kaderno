"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { salvarPerfil, type EstadoForm } from "@/lib/acoes";
import type { Perfil } from "@/lib/dados";

/** Nome, telefone e e-mail do dono da conta. O nome é o que aparece no menu. */
export function ProfileForm({ perfil }: { perfil: Perfil }) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(salvarPerfil, {});
  const erros = estado.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-5">
      <Card variant="outlined" className="grid gap-5 md:grid-cols-2">
        <Field
          label="Seu nome"
          name="nome"
          defaultValue={perfil.nome}
          error={erros.nome}
          autoComplete="name"
          hint="É o nome que aparece no menu e nos contratos."
        />
        <Field
          label="Telefone"
          name="telefone"
          type="tel"
          placeholder="(11) 90000-0000"
          defaultValue={perfil.telefone}
          autoComplete="tel"
        />
        <Field
          label="E-mail"
          name="email"
          type="email"
          defaultValue={perfil.email}
          error={erros.email}
          autoComplete="email"
          hint="É por ele que você entra no Caderno."
          className="md:col-span-2"
        />
      </Card>

      <div className="flex flex-col-reverse items-center gap-2.5 md:flex-row md:justify-end">
        {estado.sucesso && !pendente && (
          <p role="status" className="text-body-sm text-positive-deep">
            {estado.sucesso}
          </p>
        )}
        <Button type="submit" disabled={pendente} className="w-full md:w-auto">
          {pendente ? "Salvando…" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}
