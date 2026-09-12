"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { Textarea } from "@/components/ui/textarea";
import { renegociarParcelaAcao, type EstadoForm } from "@/lib/acoes";
import type { Parcela } from "@/lib/dados";

export type RenegotiateFormProps = {
  parcela: Parcela;
  voltarPara: string;
};

/** Muda valor e data de uma parcela só, com o combinado registrado por escrito. */
export function RenegotiateForm({ parcela, voltarPara }: RenegotiateFormProps) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(renegociarParcelaAcao, {});
  const erros = estado.erros ?? {};
  const [valor, setValor] = useState<number | null>(parcela.valor);

  return (
    <form action={acao} className="flex flex-col gap-5">
      <input type="hidden" name="parcelaId" value={parcela.id} />
      <input type="hidden" name="contratoId" value={parcela.contratoId} />

      <Card variant="outlined" className="grid gap-5 md:grid-cols-2">
        <MoneyInput label="Novo valor" name="valor" value={valor} onValueChange={setValor} error={erros.valor} />
        <Field
          label="Novo vencimento"
          name="vencimento"
          type="date"
          defaultValue={parcela.vencimento}
          error={erros.vencimento}
        />
        <Textarea
          label="Observações do acordo"
          name="observacao"
          defaultValue={parcela.observacao}
          placeholder="Cliente pediu mais 15 dias e aceitou pagar R$ 50 a mais."
          rows={3}
          hint="Fica na parcela, para você lembrar do combinado."
          className="md:col-span-2"
        />
      </Card>

      <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
        <Link href={voltarPara} className={buttonClass({ variant: "tertiary", className: "w-full md:w-auto" })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pendente} className="w-full md:w-auto">
          {pendente ? "Salvando…" : "Salvar renegociação"}
        </Button>
      </div>
    </form>
  );
}
