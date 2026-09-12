"use client";

import { useRef, useState, useTransition, type ReactNode } from "react";
import { Button } from "./button";
import { Modal } from "./modal";

export type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  /** Pergunta direta: "Excluir Marcos Andrade?" */
  title: string;
  /** Consequência em linguagem simples: o que some e se dá para desfazer. */
  description: ReactNode;
  confirmLabel: string;
  /** Texto do botão enquanto executa ("Excluindo…"). */
  pendingLabel?: string;
  cancelLabel?: string;
  /** "danger" para excluir; "primary" para confirmações comuns. */
  tone?: "danger" | "primary";
  /** Pode ser assíncrono: o diálogo espera terminar e só então fecha. */
  onConfirm: () => void | Promise<void>;
};

/** Confirmação antes de uma ação sem volta. Abre com o foco em "Cancelar". */
export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  pendingLabel,
  cancelLabel = "Cancelar",
  tone = "danger",
  onConfirm,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [pendente, startTransition] = useTransition();
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setErro(null);
    onClose();
  }

  function confirmar() {
    setErro(null);
    startTransition(async () => {
      try {
        await onConfirm();
        onClose();
      } catch {
        setErro("Não deu certo. Confira sua conexão e tente de novo.");
      }
    });
  }

  return (
    <Modal
      open={open}
      onClose={fechar}
      title={title}
      description={description}
      initialFocusRef={cancelRef}
      dismissible={!pendente}
      footer={
        <>
          <Button ref={cancelRef} variant="secondary" onClick={fechar} disabled={pendente}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={confirmar} disabled={pendente}>
            {pendente ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </>
      }
    >
      {erro && (
        <p role="alert" className="text-body-sm text-negative-darkest">
          {erro}
        </p>
      )}
    </Modal>
  );
}
