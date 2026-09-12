import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChargeButton } from "@/components/domain/charge-dialog";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckIcon } from "@/components/ui/icons";
import { getContrato, getRecibo, type FormaRecebimento } from "@/lib/dados";
import { formatBRL, formatDate } from "@/lib/format";
import { avisoDeRecebimento } from "@/lib/mensagens";

export const metadata: Metadata = {
  title: "Pagamento registrado · Caderno",
};

const rotuloForma: Record<FormaRecebimento, string> = {
  parcela: "Parcela paga",
  juros: "Só os juros",
  parcial: "Juros + parte da dívida",
  quitacao: "Dívida quitada",
};

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-canvas-soft py-3 last:border-b-0">
      <span className="text-body-sm text-body">{rotulo}</span>
      <span className="text-body-md font-semibold">{valor}</span>
    </div>
  );
}

/** Comprovante depois da baixa. Aberta fora do fluxo, cai no início. */
export default async function RecebidoPage({ searchParams }: PageProps<"/recebido">) {
  const { recibo: id } = await searchParams;
  const recibo = typeof id === "string" ? await getRecibo(id) : undefined;
  if (!recibo) redirect("/");

  const contrato = await getContrato(recibo.contratoId);
  const mensagem = avisoDeRecebimento(recibo, contrato?.telefone);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
      <PageHeader
        eyebrow={
          <span className="inline-flex items-center gap-2 text-positive-deep">
            <CheckIcon size={16} />
            Pagamento registrado
          </span>
        }
        title={formatBRL(recibo.valor)}
        description={`${recibo.cliente} · ${recibo.numeroContrato}`}
      />

      <Card variant="pale" className="flex flex-col">
        <Linha rotulo="Parcela" valor={`${recibo.parcela.numero} de ${recibo.parcela.total}`} />
        <Linha rotulo="Tipo de recebimento" valor={rotuloForma[recibo.forma]} />
        <Linha rotulo="Recebido em" valor={formatDate(recibo.data)} />
        {contrato && <Linha rotulo="Falta receber" valor={formatBRL(contrato.aReceber)} />}
      </Card>

      <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
        <Link
          href={`/contratos/${recibo.contratoId}`}
          className={buttonClass({ variant: "tertiary", className: "w-full md:w-auto" })}
        >
          Voltar ao contrato
        </Link>
        <ChargeButton
          mensagem={mensagem}
          cliente={recibo.cliente}
          rotulo="Avisar no WhatsApp"
          variant="primary"
          size="md"
          className="w-full md:w-auto"
        />
      </div>
    </div>
  );
}
