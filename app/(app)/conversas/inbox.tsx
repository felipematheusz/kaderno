"use client";

import { useState } from "react";
import { ClientAvatar } from "@/components/domain/client-avatar";
import { PageHeader } from "@/components/shell/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldBoxClass } from "@/components/ui/field";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { ChatIcon, SearchIcon } from "@/components/ui/icons";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/cn";
import { ultimaMensagem, type Balao, type Conversa, type Etapa } from "@/lib/conversas";
import { normalizeSearch } from "@/lib/format";
import { Chat } from "./chat";
import { Conexao } from "./conexao";
import { FichaDoContato } from "./ficha";

export type InboxProps = {
  conversas: readonly Conversa[];
  /** Número da empresa conectado na uazapi. */
  numero?: string;
  /** Primeiro nome de quem está usando: assina as anotações. */
  usuario: string;
  /** Conversa que abre primeiro: vem do card do CRM (`?conversa=`). */
  inicial?: string;
};

type Filtro = "todas" | "nao-lidas" | "atraso";

function horaAgora(): string {
  return new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(new Date());
}

function esperando(quantas: number): string {
  if (quantas === 0) return "Ninguém esperando resposta.";
  return `${quantas} ${quantas === 1 ? "conversa esperando" : "conversas esperando"} resposta.`;
}

function LinhaConversa({ conversa, ativa, onAbrir }: { conversa: Conversa; ativa: boolean; onAbrir: () => void }) {
  const ultima = ultimaMensagem(conversa);
  const naoLida = conversa.naoLidas > 0;

  return (
    <li>
      <button
        type="button"
        onClick={onAbrir}
        aria-current={ativa ? "true" : undefined}
        className={cn(
          "relative flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
          ativa ? "md:bg-canvas-soft" : "hover:bg-canvas-soft",
        )}
      >
        {ativa && <span aria-hidden className="absolute top-5 left-0 hidden h-6 w-1 rounded-pill bg-primary md:block" />}
        <ClientAvatar nome={conversa.nome} score={conversa.ficha?.score} size="sm" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="flex items-baseline justify-between gap-2">
            <span className="truncate text-body-md font-semibold">{conversa.nome}</span>
            {ultima && (
              <span className={cn("shrink-0 text-caption", naoLida ? "font-semibold text-ink" : "text-mute")}>
                {ultima.quando}
              </span>
            )}
          </span>
          <span className="flex items-center justify-between gap-2">
            <span className={cn("truncate text-body-sm", naoLida ? "text-ink" : "text-body")}>
              {ultima && (ultima.autor === "empresa" ? `Você: ${ultima.texto}` : ultima.texto)}
            </span>
            {naoLida && (
              <Badge tone="deep" size="sm" className="shrink-0">
                {conversa.naoLidas}
                <span className="sr-only">{conversa.naoLidas === 1 ? " não lida" : " não lidas"}</span>
              </Badge>
            )}
          </span>
          {conversa.situacao && (
            <Badge tone={conversa.situacao.tom} size="sm" className="mt-1 self-start">
              {conversa.situacao.texto}
            </Badge>
          )}
        </span>
      </button>
    </li>
  );
}

/**
 * Atendimento pelo WhatsApp: lista de conversas, a conversa aberta e a ficha do contato.
 * Tudo em memória do navegador; nada é enviado de verdade.
 */
export function Inbox({ conversas, numero, usuario, inicial }: InboxProps) {
  const primeira = conversas.find((c) => c.id === inicial) ?? conversas[0];
  // A conversa que abre já aparece na tela: começa como lida.
  const [lista, setLista] = useState<readonly Conversa[]>(() =>
    conversas.map((c) => (c.id === primeira?.id ? { ...c, naoLidas: 0 } : c)),
  );
  const [selecionadaId, setSelecionadaId] = useState(primeira?.id);
  // Veio de um card do CRM: no celular já abre direto na conversa.
  const [abertaNoCelular, setAbertaNoCelular] = useState(primeira !== undefined && primeira.id === inicial);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [busca, setBusca] = useState("");
  const [fichaAberta, setFichaAberta] = useState(false);
  const [conexaoAberta, setConexaoAberta] = useState(false);
  const [conectado, setConectado] = useState(true);

  const selecionada = lista.find((c) => c.id === selecionadaId) ?? lista[0];
  const naoLidas = lista.filter((c) => c.naoLidas > 0).length;
  const emAtraso = lista.filter((c) => c.situacao?.tom === "negative").length;
  const termo = normalizeSearch(busca);
  const visiveis = lista
    .filter((c) => filtro === "todas" || (filtro === "nao-lidas" ? c.naoLidas > 0 : c.situacao?.tom === "negative"))
    .filter((c) => termo === "" || normalizeSearch(c.nome).includes(termo));

  function atualizar(id: string, mudar: (conversa: Conversa) => Conversa) {
    setLista((atual) => atual.map((c) => (c.id === id ? mudar(c) : c)));
  }

  function abrir(id: string) {
    setSelecionadaId(id);
    setAbertaNoCelular(true);
    atualizar(id, (c) => (c.naoLidas === 0 ? c : { ...c, naoLidas: 0 }));
  }

  /** Mensagem nova vai para o fim do dia de hoje e a conversa sobe para o topo. */
  function enviar(id: string, texto: string) {
    const balao: Balao = { tipo: "texto", id: crypto.randomUUID(), autor: "empresa", texto, hora: horaAgora() };
    setLista((atual) => {
      const alvo = atual.find((c) => c.id === id);
      if (!alvo) return atual;
      const ultimo = alvo.dias.at(-1);
      const dias =
        ultimo?.rotulo === "Hoje"
          ? [...alvo.dias.slice(0, -1), { ...ultimo, itens: [...ultimo.itens, balao] }]
          : [...alvo.dias, { rotulo: "Hoje", itens: [balao] }];
      return [{ ...alvo, dias }, ...atual.filter((c) => c.id !== id)];
    });
  }

  function anotar(id: string, texto: string) {
    atualizar(id, (c) => ({
      ...c,
      anotacoes: [{ id: crypto.randomUUID(), texto, autor: usuario, quando: "agora" }, ...c.anotacoes],
    }));
  }

  const acoesDaFicha = selecionada && {
    onEtapa: (etapa: Etapa) => atualizar(selecionada.id, (c) => ({ ...c, etapa })),
    onAtendente: (atendente: string) => atualizar(selecionada.id, (c) => ({ ...c, atendente })),
    onAnotar: (texto: string) => anotar(selecionada.id, texto),
  };

  return (
    <>
      <PageHeader
        title="Conversas"
        description={esperando(naoLidas)}
        actions={
          <Button variant="tertiary" onClick={() => setConexaoAberta(true)}>
            <span aria-hidden className={cn("size-2.5 rounded-pill", conectado ? "bg-positive" : "bg-negative")} />
            {conectado ? "WhatsApp conectado" : "Conectar WhatsApp"}
          </Button>
        }
      />

      {!selecionada || !acoesDaFicha ? (
        <EmptyState
          icon={<ChatIcon size={24} />}
          title="Nenhuma conversa ainda"
          description="Quando um cliente mandar mensagem no WhatsApp da empresa, ela aparece aqui."
        />
      ) : (
        <div className="grid gap-4 md:h-[calc(100dvh-12rem)] md:min-h-[36rem] md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)_minmax(0,20rem)]">
          <Card flush className="flex min-h-0 flex-col">
            <div className="flex flex-col gap-3 p-4">
              <div className={fieldBoxClass({})}>
                <SearchIcon className="shrink-0 text-body" />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  aria-label="Buscar conversa"
                  placeholder="Buscar por nome"
                  className="min-w-0 flex-1 bg-transparent text-body-md outline-none placeholder:text-mute"
                />
              </div>
              <FilterChips aria-label="Filtrar conversas">
                <FilterChip on="canvas" selected={filtro === "todas"} onClick={() => setFiltro("todas")}>
                  Todas
                </FilterChip>
                <FilterChip
                  on="canvas"
                  selected={filtro === "nao-lidas"}
                  count={naoLidas}
                  onClick={() => setFiltro("nao-lidas")}
                >
                  Não lidas
                </FilterChip>
                <FilterChip
                  on="canvas"
                  selected={filtro === "atraso"}
                  count={emAtraso}
                  onClick={() => setFiltro("atraso")}
                >
                  Atraso
                </FilterChip>
              </FilterChips>
            </div>

            {visiveis.length === 0 ? (
              <p className="px-6 pb-6 text-body-sm text-mute">Nenhuma conversa com esse filtro.</p>
            ) : (
              <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
                {visiveis.map((conversa) => (
                  <LinhaConversa
                    key={conversa.id}
                    conversa={conversa}
                    ativa={conversa.id === selecionada.id}
                    onAbrir={() => abrir(conversa.id)}
                  />
                ))}
              </ul>
            )}
          </Card>

          <Chat
            key={selecionada.id}
            conversa={selecionada}
            conectado={conectado}
            onVoltar={() => setAbertaNoCelular(false)}
            onAbrirFicha={() => setFichaAberta(true)}
            onConectar={() => setConexaoAberta(true)}
            onEnviar={(texto) => enviar(selecionada.id, texto)}
            className={cn(
              "max-md:fixed max-md:inset-0 max-md:z-50 max-md:rounded-none",
              !abertaNoCelular && "max-md:hidden",
            )}
          />

          <Card className="hidden min-h-0 overflow-y-auto xl:block">
            <FichaDoContato key={selecionada.id} conversa={selecionada} {...acoesDaFicha} />
          </Card>
        </div>
      )}

      {selecionada && acoesDaFicha && (
        <Modal open={fichaAberta} onClose={() => setFichaAberta(false)} title={selecionada.nome}>
          <FichaDoContato key={selecionada.id} conversa={selecionada} semCabecalho {...acoesDaFicha} />
        </Modal>
      )}

      <Conexao
        open={conexaoAberta}
        onClose={() => setConexaoAberta(false)}
        conectado={conectado}
        numero={numero}
        onConectar={() => setConectado(true)}
        onTrocar={() => setConectado(false)}
      />
    </>
  );
}
