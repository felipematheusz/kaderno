"use client";

import Link from "next/link";
import { buttonClass } from "@/components/ui/button";
import type { Mensagem } from "@/lib/mensagens";
import { ChargeButton } from "./charge-dialog";
import type { InstallmentRowStatus } from "./installment-row";

export type InstallmentActionsProps = {
  status: InstallmentRowStatus;
  parcelaId: string;
  cliente: string;
  /** Texto pronto de cobrança, montado no servidor. */
  mensagem: Mensagem;
};

/**
 * Ações da linha de parcela: Cobrar e Pagar no que já venceu, só Lembrar no que ainda vai vencer.
 * Na parcela paga não sai nada — o selo Pago toma o lugar.
 */
export function InstallmentActions({ parcelaId, cliente, mensagem, status }: InstallmentActionsProps) {
  if (status === "paga") return null;

  if (status === "futura") {
    return <ChargeButton mensagem={mensagem} cliente={cliente} rotulo="Lembrar" />;
  }

  return (
    <>
      <ChargeButton mensagem={mensagem} cliente={cliente} />
      <Link href={`/parcelas/${parcelaId}/pagar`} className={buttonClass({ size: "sm" })}>
        Pagar
      </Link>
    </>
  );
}
