import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChargeButton } from "@/components/domain/charge-dialog";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { rotuloFrequencia } from "@/lib/contrato";
import { getContrato, getParcelasDoContrato } from "@/lib/dados";
import { formatBRL, formatDate } from "@/lib/format";
import { resumoDoContrato } from "@/lib/mensagens";

export const metadata: Metadata = {
  title: "Contrato criado · Caderno",
};

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-canvas-soft py-3 last:border-b-0">
      <span className="text-body-sm text-body">{rotulo}</span>
      <span className="text-body-md font-semibold">{valor}</span>
    </div>
  );
}

/** Confirmação logo depois de criar. Aberta fora do fluxo, cai no início. */
export default async function ContratoCriadoPage({ searchParams }: PageProps<"/contratos/sucesso">) {
  const { contrato: id } = await searchParams;
  const contrato = typeof id === "string" ? await getContrato(id) : undefined;
  if (!contrato) redirect("/");

  const parcelas = await getParcelasDoContrato(contrato.id);
  const mensagem = resumoDoContrato(contrato, parcelas[0]?.valor ?? 0);
  const venda = contrato.tipo === "venda";

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 text-positive-deep">
            <CheckIcon size={16} />
            {venda ? "Venda registrada" : "Contrato criado"}
          </span>
        }
        title={contrato.numero}
        description={`${contrato.cliente} já pode receber o combinado por escrito.`}
      />

      <Card variant="pale" className="flex flex-col">
        <Linha rotulo="Cliente" valor={contrato.cliente} />
        {contrato.produto && <Linha rotulo="Produto" valor={contrato.produto} />}
        <Linha rotulo={venda ? "Preço" : "Emprestado"} valor={formatBRL(contrato.principal)} />
        <Linha rotulo="Total a receber" valor={formatBRL(contrato.valor)} />
        <Linha
          rotulo="Parcelas"
          valor={`${contrato.totalParcelas}x de ${formatBRL(parcelas[0]?.valor ?? 0)} · ${rotuloFrequencia[contrato.frequencia]}`}
        />
        <Linha rotulo="Primeira em" valor={formatDate(contrato.primeiroVencimento)} />
      </Card>

      <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
        <Link
          href={`/contratos/${contrato.id}`}
          className={buttonClass({ variant: "tertiary", className: "w-full md:w-auto" })}
        >
          Ver contrato
        </Link>
        <ChargeButton
          mensagem={mensagem}
          cliente={contrato.cliente}
          rotulo="Enviar no WhatsApp"
          variant="primary"
          size="md"
          className="w-full md:w-auto"
        />
      </div>
    </div>
  );
}
