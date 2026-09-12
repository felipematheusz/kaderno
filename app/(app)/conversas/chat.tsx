"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ClientAvatar } from "@/components/domain/client-avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fieldBoxClass } from "@/components/ui/field";
import { ArrowLeftIcon, CheckIcon, SendIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import type { Balao, Conversa } from "@/lib/conversas";

export type ChatProps = {
  conversa: Conversa;
  conectado: boolean;
  /** Celular: volta para a lista. */
  onVoltar: () => void;
  /** Abaixo de 1280px a ficha não cabe ao lado e abre numa janela. */
  onAbrirFicha: () => void;
  onConectar: () => void;
  onEnviar: (texto: string) => void;
  className?: string;
};

type Atalho = { rotulo: string; texto: string };

/** Respostas prontas: preenchem o campo, não enviam sozinhas. */
function atalhosDe(conversa: Conversa): Atalho[] {
  const primeiroNome = conversa.nome.split(" ")[0];

  if (!conversa.ficha) {
    return [
      {
        rotulo: "Pedir documentos",
        texto: `Oi, ${primeiroNome}! Para fazer a simulação preciso de uma foto do RG ou CNH, um comprovante de residência e o valor que você precisa.`,
      },
    ];
  }

  const atalhos: Atalho[] = [];
  if (conversa.ficha.cobranca) atalhos.push({ rotulo: "Cobrar parcela", texto: conversa.ficha.cobranca });
  atalhos.push({
    rotulo: "Chave Pix",
    texto: `Oi, ${primeiroNome}! A chave Pix é o e-mail pix@caderno.com.br. Depois me manda o comprovante, por favor.`,
  });
  return atalhos;
}

function BalaoMensagem({ balao }: { balao: Balao }) {
  const daEmpresa = balao.autor === "empresa";

  return (
    <div
      className={cn(
        "flex max-w-[80%] flex-col gap-1 rounded-lg px-4 py-2.5",
        daEmpresa ? "self-end rounded-br-sm bg-primary-pale" : "self-start rounded-bl-sm bg-canvas-soft",
      )}
    >
      <p className="text-body-md break-words whitespace-pre-wrap">{balao.texto}</p>
      <span className="flex items-center gap-1 self-end text-caption text-body">
        {balao.hora}
        {daEmpresa && (
          <>
            <CheckIcon size={12} className={balao.lida ? "text-positive-deep" : "text-mute"} />
            <span className="sr-only">{balao.lida ? ", lida" : ", enviada"}</span>
          </>
        )}
      </span>
    </div>
  );
}

export function Chat({ conversa, conectado, onVoltar, onAbrirFicha, onConectar, onEnviar, className }: ChatProps) {
  const [texto, setTexto] = useState("");
  const rolagemRef = useRef<HTMLDivElement>(null);
  const campoRef = useRef<HTMLTextAreaElement>(null);
  const totalDeItens = conversa.dias.reduce((soma, dia) => soma + dia.itens.length, 0);
  const podeEnviar = texto.trim() !== "";

  // Abre sempre na mensagem mais recente e acompanha as que chegam.
  useEffect(() => {
    const rolagem = rolagemRef.current;
    if (rolagem) rolagem.scrollTop = rolagem.scrollHeight;
  }, [totalDeItens]);

  function enviar(event?: FormEvent) {
    event?.preventDefault();
    if (!podeEnviar) return;
    onEnviar(texto.trim());
    setTexto("");
  }

  // Enter envia; Shift+Enter quebra a linha, como no WhatsApp Web.
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      enviar();
    }
  }

  function usarAtalho(atalho: Atalho) {
    setTexto(atalho.texto);
    campoRef.current?.focus();
  }

  return (
    <Card flush className={cn("flex min-h-0 flex-col", className)}>
      <header className="flex items-center gap-3 border-b border-canvas-soft px-3 py-3 md:px-6">
        <Button variant="ghost" size="icon-sm" aria-label="Voltar para conversas" onClick={onVoltar} className="md:hidden">
          <ArrowLeftIcon />
        </Button>
        <ClientAvatar nome={conversa.nome} score={conversa.ficha?.score} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h2 className="truncate text-body-md font-semibold">{conversa.nome}</h2>
          <p className="truncate text-caption text-mute">{conversa.telefone ?? "Sem telefone"}</p>
        </div>
        <Button variant="tertiary" size="sm" onClick={onAbrirFicha} className="xl:hidden">
          Ficha
        </Button>
      </header>

      <div
        ref={rolagemRef}
        role="log"
        aria-label={`Mensagens com ${conversa.nome}`}
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-5 md:px-6"
      >
        {conversa.dias.map((dia) => (
          <section key={dia.rotulo} aria-label={dia.rotulo} className="flex flex-col gap-2">
            <p className="my-2 self-center rounded-pill bg-canvas-soft px-3 py-1 text-caption text-body">{dia.rotulo}</p>
            {dia.itens.map((item) =>
              item.tipo === "evento" ? (
                <Badge key={item.id} tone={item.tom} size="sm" className="my-1 self-center">
                  {item.texto}
                </Badge>
              ) : (
                <BalaoMensagem key={item.id} balao={item} />
              ),
            )}
          </section>
        ))}
      </div>

      {conectado ? (
        <form
          onSubmit={enviar}
          className="flex flex-col gap-3 border-t border-canvas-soft p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:p-4"
        >
          <div className="flex gap-2 overflow-x-auto">
            {atalhosDe(conversa).map((atalho) => (
              <Button key={atalho.rotulo} variant="secondary" size="sm" onClick={() => usarAtalho(atalho)}>
                {atalho.rotulo}
              </Button>
            ))}
          </div>
          <div className="flex items-end gap-2">
            <div className={cn(fieldBoxClass({ size: "auto" }), "flex-1 py-3")}>
              <textarea
                ref={campoRef}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label={`Mensagem para ${conversa.nome}`}
                placeholder="Escreva uma mensagem"
                className="field-sizing-content max-h-40 min-h-6 w-full resize-none bg-transparent text-body-md outline-none placeholder:text-mute"
              />
            </div>
            <Button type="submit" size="icon" aria-label="Enviar" disabled={!podeEnviar}>
              <SendIcon />
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-canvas-soft p-4">
          <p className="text-body-sm text-body">O WhatsApp da empresa está desconectado. Conecte para responder.</p>
          <Button variant="tertiary" size="sm" onClick={onConectar}>
            Conectar
          </Button>
        </div>
      )}
    </Card>
  );
}
