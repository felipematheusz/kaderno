"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { sair } from "@/lib/login";

/** Sair da conta, com confirmação. Encerra a sessão deste aparelho e volta para a tela de entrar. */
export function LogoutAction() {
  const [aberto, setAberto] = useState(false);

  return (
    <>
      <Button variant="danger" onClick={() => setAberto(true)}>
        Sair da conta
      </Button>
      <ConfirmDialog
        open={aberto}
        onClose={() => setAberto(false)}
        title="Sair da conta?"
        description="Seus clientes, contratos e parcelas continuam guardados. Para voltar, é só entrar de novo."
        confirmLabel="Sair"
        pendingLabel="Saindo…"
        onConfirm={() => sair()}
      />
    </>
  );
}
