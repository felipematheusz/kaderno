"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

/**
 * Sair da conta, com confirmação.
 * Enquanto o login de verdade não existe, sair só devolve a pessoa ao início.
 */
export function LogoutAction() {
  const [aberto, setAberto] = useState(false);
  const router = useRouter();

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
        onConfirm={() => {
          router.push("/");
          router.refresh();
        }}
      />
    </>
  );
}
