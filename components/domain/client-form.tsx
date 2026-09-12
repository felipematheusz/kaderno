"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { salvarCliente, type EstadoForm } from "@/lib/acoes";
import type { Cliente } from "@/lib/dados";
import { formatCPF } from "@/lib/format";

export type ClientFormProps = {
  /** Preenchido na edição; vazio no cadastro. */
  cliente?: Cliente;
  /** Para onde o Cancelar volta. */
  voltarPara: string;
};

/** Cadastro e edição de cliente: o mesmo formulário, mudando só o botão do fim. */
export function ClientForm({ cliente, voltarPara }: ClientFormProps) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(salvarCliente, {});
  const erros = estado.erros ?? {};

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={cliente?.id ?? ""} />

      <Card variant="outlined" className="grid gap-5 md:grid-cols-2">
        <Field
          label="Nome completo"
          name="nome"
          defaultValue={cliente?.nome}
          error={erros.nome}
          autoComplete="name"
          autoFocus={cliente === undefined}
          className="md:col-span-2"
        />
        <Field
          label="Telefone"
          name="telefone"
          type="tel"
          placeholder="(11) 90000-0000"
          defaultValue={cliente?.telefone}
          hint="É por aqui que sai a cobrança no WhatsApp."
        />
        <Field
          label="CPF"
          name="cpf"
          inputMode="numeric"
          placeholder="000.000.000-00"
          defaultValue={cliente?.cpf ? formatCPF(cliente.cpf) : undefined}
          error={erros.cpf}
          hint="Opcional."
        />
        <Field label="E-mail" name="email" type="email" defaultValue={cliente?.email} />
        <Field label="Endereço" name="endereco" defaultValue={cliente?.endereco} />
        <Field
          label="Score de crédito"
          name="score"
          type="number"
          min={0}
          max={100}
          defaultValue={cliente?.score}
          error={erros.score}
          hint="De 0 a 100. Vira o anel em volta das iniciais."
        />
      </Card>

      <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
        <Link href={voltarPara} className={buttonClass({ variant: "tertiary", className: "w-full md:w-auto" })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pendente} className="w-full md:w-auto">
          {pendente ? "Salvando…" : cliente ? "Salvar alterações" : "Cadastrar cliente"}
        </Button>
      </div>
    </form>
  );
}
