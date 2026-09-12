"use client";

import { useId, useMemo, useState, type KeyboardEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { FieldFrame, fieldBoxClass } from "@/components/ui/field";
import { CheckIcon, CloseIcon, SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { clienteCombina } from "@/lib/emprestimos";
import { formatCPF } from "@/lib/format";
import { ClientAvatar } from "./client-avatar";

export type ClientOption = {
  id: string;
  nome: string;
  cpf?: string;
  telefone?: string;
  score?: number;
};

export type ClientSearchProps = {
  clients: readonly ClientOption[];
  label?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  /** Id do cliente escolhido (controlado). */
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (client: ClientOption | null) => void;
  /** Envia o id do cliente escolhido no <form>. */
  name?: string;
  /** Mostrado quando a busca não acha ninguém, ex.: link "Cadastrar cliente". */
  emptyAction?: ReactNode;
  maxResults?: number;
  className?: string;
};

/**
 * Busca de cliente por nome ou CPF (combobox WAI-ARIA): setas navegam, Enter escolhe, Esc fecha.
 * Filtra a lista recebida; para bases grandes, trocar por busca no servidor.
 */
export function ClientSearch({
  clients,
  label = "Cliente",
  placeholder = "Buscar por nome ou CPF",
  hint,
  error,
  value,
  defaultValue = null,
  onValueChange,
  name,
  emptyAction,
  maxResults = 8,
  className,
}: ClientSearchProps) {
  const listId = useId();
  const [idInterno, setIdInterno] = useState(defaultValue);
  const selecionadoId = value !== undefined ? value : idInterno;
  const selecionado = clients.find((c) => c.id === selecionadoId) ?? null;

  const [busca, setBusca] = useState(selecionado?.nome ?? "");
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(0);

  // Escolha trocada por fora: o texto acompanha.
  const [idAnterior, setIdAnterior] = useState(selecionadoId);
  if (selecionadoId !== idAnterior) {
    setIdAnterior(selecionadoId);
    setBusca(selecionado?.nome ?? "");
  }

  const resultados = useMemo(
    () => clients.filter((c) => clienteCombina(c, busca)).slice(0, maxResults),
    [busca, clients, maxResults],
  );

  function escolher(client: ClientOption | null) {
    if (value === undefined) setIdInterno(client?.id ?? null);
    setIdAnterior(client?.id ?? null);
    setBusca(client?.nome ?? "");
    setAberto(false);
    onValueChange?.(client);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!aberto) {
        setAberto(true);
        setAtivo(0);
        return;
      }
      const passo = event.key === "ArrowDown" ? 1 : -1;
      setAtivo((i) => (resultados.length === 0 ? 0 : (i + passo + resultados.length) % resultados.length));
    } else if (event.key === "Enter" && aberto && resultados[ativo]) {
      event.preventDefault();
      escolher(resultados[ativo]);
    } else if (event.key === "Escape") {
      if (aberto) setAberto(false);
      else if (busca !== "") escolher(null);
    }
  }

  const mostrarLista = aberto && (resultados.length > 0 || busca.trim() !== "");
  const optionId = (i: number) => `${listId}-opt-${i}`;

  return (
    <FieldFrame label={label} hint={hint} error={error} className={className}>
      {(control) => (
        <div className="relative">
          <div className={fieldBoxClass({ error })}>
            <SearchIcon className="shrink-0 text-body" />
            <input
              {...control}
              type="text"
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={mostrarLista}
              aria-controls={listId}
              aria-activedescendant={mostrarLista && resultados[ativo] ? optionId(ativo) : undefined}
              autoComplete="off"
              placeholder={placeholder}
              value={busca}
              onChange={(event) => {
                setBusca(event.target.value);
                setAberto(true);
                setAtivo(0);
                if (selecionado) {
                  if (value === undefined) setIdInterno(null);
                  setIdAnterior(null);
                  onValueChange?.(null);
                }
              }}
              onFocus={() => setAberto(true)}
              onBlur={() => setAberto(false)}
              onKeyDown={handleKeyDown}
              className="min-w-0 flex-1 bg-transparent text-body-md outline-none placeholder:text-mute"
            />
            {busca !== "" && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Limpar busca"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => escolher(null)}
                className="-mr-2"
              >
                <CloseIcon size={18} />
              </Button>
            )}
          </div>

          <div
            hidden={!mostrarLista}
            className="absolute inset-x-0 top-full z-10 mt-2 max-h-80 overflow-y-auto rounded-md border border-ink bg-canvas py-2"
          >
            <ul id={listId} role="listbox" aria-label={label}>
              {resultados.map((client, i) => (
                <li
                  key={client.id}
                  id={optionId(i)}
                  role="option"
                  aria-selected={i === ativo}
                  // Evita o blur do campo antes do clique registrar.
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => escolher(client)}
                  onMouseEnter={() => setAtivo(i)}
                  className={cn(
                    "flex min-h-14 cursor-pointer items-center gap-3 px-4 py-2",
                    i === ativo && "bg-canvas-soft",
                  )}
                >
                  <ClientAvatar nome={client.nome} score={client.score} size="sm" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-body-md font-semibold">{client.nome}</span>
                    {(client.cpf || client.telefone) && (
                      <span className="text-caption text-mute">
                        {[client.cpf && formatCPF(client.cpf), client.telefone].filter(Boolean).join(" · ")}
                      </span>
                    )}
                  </span>
                  {client.id === selecionadoId && <CheckIcon size={16} className="text-ink" />}
                </li>
              ))}
            </ul>
            {resultados.length === 0 && (
              <div className="flex flex-col items-start gap-2 px-4 py-2">
                <p className="text-body-sm text-body">Nenhum cliente com esse nome ou CPF.</p>
                {emptyAction}
              </div>
            )}
          </div>

          {name && <input type="hidden" name={name} value={selecionadoId ?? ""} />}
        </div>
      )}
    </FieldFrame>
  );
}
