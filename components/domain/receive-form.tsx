"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { RadioCard, RadioCardGroup } from "@/components/ui/radio-card";
import { Select } from "@/components/ui/select";
import { receberParcelaAcao, type EstadoForm } from "@/lib/acoes";
import { arredondar } from "@/lib/contrato";
import type { Contrato, FormaRecebimento, Parcela } from "@/lib/dados";
import { marcarEnvio } from "@/lib/envio";
import { formatBRL } from "@/lib/format";

export type ReceiveFormProps = {
  parcela: Parcela;
  contrato: Contrato;
  hoje: string;
  voltarPara: string;
};

const CANAIS = [
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
  { value: "transferencia", label: "Transferência" },
  { value: "cartao", label: "Cartão" },
];

/** Baixa da parcela: a forma escolhida já preenche o valor, e dá para ajustar antes de confirmar. */
export function ReceiveForm({ parcela, contrato, hoje, voltarPara }: ReceiveFormProps) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(receberParcelaAcao, {});
  const erros = estado.erros ?? {};

  const jurosDaParcela = contrato.totalParcelas === 0 ? 0 : arredondar(contrato.juros / contrato.totalParcelas);
  const opcoes: readonly { valor: FormaRecebimento; titulo: string; descricao: string; total: number }[] = [
    {
      valor: "parcela",
      titulo: "Pagar a parcela",
      descricao: `Quita a parcela ${parcela.parcela.numero} de ${parcela.parcela.total}`,
      total: parcela.valor,
    },
    {
      valor: "juros",
      titulo: "Só os juros",
      descricao: "A parcela continua em aberto e vai para o próximo vencimento",
      total: jurosDaParcela,
    },
    {
      valor: "parcial",
      titulo: "Juros + parte da dívida",
      descricao: "Abate o que entrou e o resto continua devendo",
      total: parcela.valor,
    },
    {
      valor: "quitacao",
      titulo: "Pagar a dívida toda",
      descricao: "Quita todas as parcelas em aberto e encerra o contrato",
      total: contrato.aReceber,
    },
  ];

  const [forma, setForma] = useState<FormaRecebimento>("parcela");
  const [valor, setValor] = useState<number | null>(parcela.valor);

  return (
    <form action={acao} onSubmit={marcarEnvio} className="flex flex-col gap-5">
      <input type="hidden" name="parcelaId" value={parcela.id} />
      <input type="hidden" name="chave" />

      <Card variant="outlined" className="grid gap-5 md:grid-cols-2">
        <RadioCardGroup label="Como o cliente pagou?" className="md:col-span-2">
          {opcoes.map((opcao) => (
            <RadioCard
              key={opcao.valor}
              name="forma"
              value={opcao.valor}
              title={opcao.titulo}
              description={opcao.descricao}
              trailing={formatBRL(opcao.total)}
              checked={forma === opcao.valor}
              disabled={opcao.total <= 0}
              onChange={() => {
                setForma(opcao.valor);
                setValor(opcao.total);
              }}
            />
          ))}
        </RadioCardGroup>

        <MoneyInput
          label="Valor recebido"
          name="valor"
          value={valor}
          onValueChange={setValor}
          error={erros.valor}
          hint="Vem preenchido pela opção escolhida. Dá para ajustar."
        />
        <Field label="Recebido em" name="data" type="date" defaultValue={hoje} error={erros.data} />
        <Select label="Como recebeu" name="canal" defaultValue="pix" options={CANAIS} className="md:col-span-2" />
      </Card>

      <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
        <Link href={voltarPara} className={buttonClass({ variant: "tertiary", className: "w-full md:w-auto" })}>
          Cancelar
        </Link>
        <Button type="submit" disabled={pendente} className="w-full md:w-auto">
          {pendente ? "Registrando…" : "Confirmar recebimento"}
        </Button>
      </div>
    </form>
  );
}
