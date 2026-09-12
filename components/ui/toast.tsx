"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "./button";
import { AlertIcon, CheckIcon, CloseIcon } from "./icons";

type ToastTone = "neutral" | "positive" | "negative";

export type ToastInput = {
  /** O que aconteceu, curto: "Pagamento registrado". */
  title: string;
  description?: string;
  tone?: ToastTone;
  /** Ação rápida, ex.: "Desfazer". */
  action?: { label: string; onClick: () => void };
  /** Em milissegundos. Padrão 5s (7s com ação). */
  duration?: number;
};

type ToastEntry = ToastInput & { id: number };

const ToastContext = createContext<((toast: ToastInput) => void) | null>(null);

/** Dispara um aviso: `const toast = useToast(); toast({ title: "Cliente salvo" })`. */
export function useToast(): (toast: ToastInput) => void {
  const push = useContext(ToastContext);
  if (!push) throw new Error("useToast precisa de <ToastProvider> acima na árvore.");
  return push;
}

const MAXIMO = 3;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const proximoId = useRef(0);

  const push = useCallback((toast: ToastInput) => {
    const id = proximoId.current++;
    setToasts((atuais) => [...atuais, { ...toast, id }].slice(-MAXIMO));
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((atuais) => atuais.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext value={push}>
      {children}
      {/* Acima da barra inferior no celular. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
        ))}
      </div>
    </ToastContext>
  );
}

function ToneIcon({ tone }: { tone: ToastTone }) {
  if (tone === "positive") {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-primary-pale text-positive-deep">
        <CheckIcon size={16} />
      </span>
    );
  }
  if (tone === "negative") {
    return (
      <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-negative-bg text-canvas">
        <AlertIcon size={18} />
      </span>
    );
  }
  return null;
}

function ToastItem({ toast, onDismiss }: { toast: ToastEntry; onDismiss: () => void }) {
  const { title, description, tone = "neutral", action, duration } = toast;
  const tempo = duration ?? (action ? 7000 : 5000);

  useEffect(() => {
    const timer = window.setTimeout(onDismiss, tempo);
    return () => window.clearTimeout(timer);
  }, [onDismiss, tempo]);

  return (
    <div
      role={tone === "negative" ? "alert" : "status"}
      className={cn("pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-xl bg-canvas p-4 shadow-overlay")}
    >
      <ToneIcon tone={tone} />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-body-md font-semibold">{title}</span>
        {description && <span className="text-body-sm text-body">{description}</span>}
      </div>
      {action && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            action.onClick();
            onDismiss();
          }}
        >
          {action.label}
        </Button>
      )}
      <Button variant="ghost" size="icon-sm" aria-label="Fechar aviso" onClick={onDismiss}>
        <CloseIcon size={18} />
      </Button>
    </div>
  );
}
