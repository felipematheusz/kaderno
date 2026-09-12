"use client";

import { useState } from "react";
import { MessagePreview } from "@/components/domain/message-preview";
import { Button, buttonClass, type ButtonProps } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { SendIcon } from "@/components/ui/icons";
import { useToast } from "@/components/ui/toast";
import { linkWhatsApp, textoDaMensagem, type Mensagem } from "@/lib/mensagens";

export type ChargeButtonProps = {
  mensagem: Mensagem;
  /** Nome de quem vai receber, para o título do diálogo. */
  cliente: string;
  rotulo?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
};

/**
 * Abre a mensagem pronta antes de enviar: dá para ler, copiar ou mandar no WhatsApp.
 * Sem telefone cadastrado sobra o copiar — não dá para abrir a conversa certa.
 */
export function ChargeButton({
  mensagem,
  cliente,
  rotulo = "Cobrar",
  variant = "secondary",
  size = "sm",
  className,
}: ChargeButtonProps) {
  const [aberto, setAberto] = useState(false);
  const toast = useToast();
  const link = linkWhatsApp(mensagem);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(textoDaMensagem(mensagem));
      toast({ title: "Mensagem copiada", tone: "positive" });
    } catch {
      toast({ title: "Não deu para copiar", description: "Selecione o texto e copie na mão.", tone: "negative" });
    }
    setAberto(false);
  }

  return (
    <>
      <Button variant={variant} size={size} className={className} onClick={() => setAberto(true)}>
        {rotulo}
      </Button>

      <Modal
        open={aberto}
        onClose={() => setAberto(false)}
        title={`Mensagem para ${cliente.split(" ")[0]}`}
        description={link ? "Confira o texto antes de enviar." : "Esse cliente não tem telefone cadastrado, então dá só para copiar."}
        footer={
          <>
            <Button variant="tertiary" onClick={copiar}>
              Copiar
            </Button>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                onClick={() => setAberto(false)}
                className={buttonClass()}
              >
                <SendIcon size={18} />
                Enviar no WhatsApp
              </a>
            )}
          </>
        }
      >
        <MessagePreview template={mensagem.template} values={mensagem.valores} />
      </Modal>
    </>
  );
}
