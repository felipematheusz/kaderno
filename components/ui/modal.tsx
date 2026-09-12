"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { CloseIcon } from "./icons";

export type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  /** Botões do rodapé. No celular empilham, a principal por cima. */
  footer?: ReactNode;
  /** "sheet" encosta embaixo (menu Mais do celular). */
  placement?: "center" | "sheet";
  /** Elemento que recebe o foco ao abrir. Padrão: o botão de fechar. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Impede fechar por Esc, clique fora e botão de fechar (ex.: enquanto salva). */
  dismissible?: boolean;
};

/**
 * Janela sobre a tela com `<dialog>` nativo: prende o foco, fecha no Esc e trava a rolagem.
 * Única superfície (com o Toast) que pode ter sombra.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  placement = "center",
  initialFocusRef,
  dismissible = true,
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressionouFora = useRef(false);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      initialFocusRef?.current?.focus();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open, initialFocusRef]);

  function fechar() {
    if (dismissible) onClose();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      onCancel={(event) => {
        event.preventDefault();
        fechar();
      }}
      // Clique no fundo: só fecha se o clique começou E terminou fora da caixa (evita fechar ao arrastar seleção).
      onPointerDown={(event) => {
        pressionouFora.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (pressionouFora.current && event.target === event.currentTarget) fechar();
      }}
      className={cn(
        "bg-canvas p-0 text-ink shadow-overlay backdrop:bg-ink/40",
        placement === "center" && "m-auto w-[calc(100%-2rem)] max-w-md rounded-xl",
        placement === "sheet" && "mx-0 mt-auto mb-0 w-full max-w-none rounded-t-xl",
      )}
    >
      <div className="flex max-h-[calc(100dvh-2rem)] flex-col gap-5 overflow-y-auto p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="text-display-xs">
              {title}
            </h2>
            {description && (
              <div id={descId} className="text-body-md text-body">
                {description}
              </div>
            )}
          </div>
          {dismissible && (
            <Button variant="ghost" size="icon-sm" aria-label="Fechar" onClick={onClose} className="-mt-1 -mr-2">
              <CloseIcon />
            </Button>
          )}
        </div>
        {children}
        {footer && <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </dialog>
  );
}
