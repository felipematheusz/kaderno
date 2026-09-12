"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { excluirClienteAcao, excluirContratoAcao } from "@/lib/acoes";

export type DeleteActionProps = {
  tipo: "cliente" | "contrato";
  id: string;
  /** Pergunta direta: "Excluir Marcos Andrade?" */
  titulo: string;
  /** O que some junto, em linguagem simples. */
  descricao: ReactNode;
  rotulo: string;
  /** Para onde ir depois de excluir. */
  destino: string;
  aviso: string;
};

/** Botão de excluir com confirmação. Só sai daqui depois que o servidor confirma. */
export function DeleteAction({ tipo, id, titulo, descricao, rotulo, destino, aviso }: DeleteActionProps) {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();
  const toast = useToast();

  return (
    <>
      <Button variant="danger" onClick={() => setAberto(true)}>
        {rotulo}
      </Button>
      <ConfirmDialog
        open={aberto}
        onClose={() => setAberto(false)}
        title={titulo}
        description={descricao}
        confirmLabel={rotulo}
        pendingLabel="Excluindo…"
        onConfirm={async () => {
          await (tipo === "cliente" ? excluirClienteAcao(id) : excluirContratoAcao(id));
          router.push(destino);
          router.refresh();
          toast({ title: aviso });
        }}
      />
    </>
  );
}
