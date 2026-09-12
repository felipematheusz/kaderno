"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ClientAvatar } from "@/components/domain/client-avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClass } from "@/components/ui/button";
import { fieldBoxClass } from "@/components/ui/field";
import { InstallmentBar } from "@/components/ui/installment-bar";
import { Money } from "@/components/ui/money";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/cn";
import { ATENDENTES, ETAPAS, type Conversa, type Etapa } from "@/lib/conversas";
import { formatBRL } from "@/lib/format";

export type FichaDoContatoProps = {
  conversa: Conversa;
  /** Na janela o nome já está no título. */
  semCabecalho?: boolean;
  onEtapa: (etapa: Etapa) => void;
  onAtendente: (atendente: string) => void;
  onAnotar: (texto: string) => void;
};

const opcoesAtendente = ATENDENTES.map((nome) => ({ value: nome, label: nome }));

/** O lado CRM da conversa: em que pé está, com quem, quanto deve e o que já se sabe. */
export function FichaDoContato({ conversa, semCabecalho = false, onEtapa, onAtendente, onAnotar }: FichaDoContatoProps) {
  const [anotacao, setAnotacao] = useState("");
  const { ficha } = conversa;

  function anotar(event: FormEvent) {
    event.preventDefault();
    const texto = anotacao.trim();
    if (texto === "") return;
    onAnotar(texto);
    setAnotacao("");
  }

  return (
    <div className="flex flex-col gap-6">
      {!semCabecalho && (
        <div className="flex flex-col items-center gap-3 text-center">
          <ClientAvatar nome={conversa.nome} score={ficha?.score} size="lg" />
          <div className="flex flex-col gap-1">
            <h2 className="text-display-xs">{conversa.nome}</h2>
            <p className="text-body-sm text-mute">{conversa.telefone ?? "Sem telefone"}</p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Select
          label="Etapa"
          options={ETAPAS}
          value={conversa.etapa}
          onChange={(e) => {
            const etapa = ETAPAS.find((o) => o.value === e.target.value)?.value;
            if (etapa) onEtapa(etapa);
          }}
        />
        <Select
          label="Atendente"
          options={opcoesAtendente}
          value={conversa.atendente}
          onChange={(e) => onAtendente(e.target.value)}
        />
      </div>

      {ficha ? (
        <div className="flex flex-col gap-4 rounded-lg bg-canvas-soft p-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-body-sm text-body">A receber</span>
            <Money
              valor={ficha.aReceber}
              size="md"
              className={conversa.situacao?.tom === "negative" ? "text-negative-darkest" : undefined}
            />
          </div>

          {ficha.contrato && (
            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-2 text-caption text-body">
                <span>Contrato {ficha.contrato.numero}</span>
                <span>
                  {ficha.contrato.pagas} de {ficha.contrato.total} pagas
                </span>
              </div>
              <InstallmentBar parcelas={ficha.contrato.parcelas} size="sm" />
            </div>
          )}

          {ficha.proxima && (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-body-sm">
                Próxima: <strong className="font-semibold">{ficha.proxima.prazo}</strong> ·{" "}
                {formatBRL(ficha.proxima.valor)}
              </span>
              {conversa.situacao && (
                <Badge tone={conversa.situacao.tom} size="sm">
                  {conversa.situacao.texto}
                </Badge>
              )}
            </div>
          )}

          <Link href={`/clientes/${ficha.clienteId}`} className={buttonClass({ variant: "tertiary", size: "sm" })}>
            Abrir cliente
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg bg-canvas-soft p-4">
          <p className="text-body-sm text-body">Ainda não é cliente. Cadastre para registrar o empréstimo.</p>
          <Link href="/clientes/novo" className={buttonClass({ variant: "tertiary", size: "sm" })}>
            Cadastrar cliente
          </Link>
        </div>
      )}

      <section aria-labelledby="anotacoes" className="flex flex-col gap-3">
        <h3 id="anotacoes" className="text-body-sm font-semibold">
          Anotações
        </h3>
        <form onSubmit={anotar} className="flex gap-2">
          <div className={cn(fieldBoxClass({ size: "auto" }), "h-10 min-w-0 flex-1")}>
            <input
              value={anotacao}
              onChange={(e) => setAnotacao(e.target.value)}
              aria-label="Nova anotação"
              placeholder="Anotar algo"
              className="min-w-0 flex-1 bg-transparent text-body-sm outline-none placeholder:text-mute"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm" disabled={anotacao.trim() === ""}>
            Anotar
          </Button>
        </form>
        {conversa.anotacoes.length > 0 && (
          <ul className="flex flex-col gap-3">
            {conversa.anotacoes.map((nota) => (
              <li key={nota.id} className="flex flex-col gap-0.5">
                <p className="text-body-sm">{nota.texto}</p>
                <span className="text-caption text-mute">
                  {nota.autor} · {nota.quando}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
