"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type DragEvent, type PointerEvent } from "react";
import { ClientAvatar } from "@/components/domain/client-avatar";
import { Badge } from "@/components/ui/badge";
import { fieldBoxClass } from "@/components/ui/field";
import { FilterChip, FilterChips } from "@/components/ui/filter-chips";
import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";
import { ATENDENTES, ETAPAS, ultimaMensagem, type Conversa, type Etapa } from "@/lib/conversas";
import { formatBRL, normalizeSearch } from "@/lib/format";

export type FunilProps = {
  conversas: readonly Conversa[];
};

const TODOS = "todos";

function CartaoContato({
  conversa,
  arrastando,
  onArrastar,
  onSoltar,
  onAbrir,
}: {
  conversa: Conversa;
  arrastando: boolean;
  onArrastar: () => void;
  onSoltar: () => void;
  onAbrir: () => void;
}) {
  const ultima = ultimaMensagem(conversa);
  const { ficha, situacao } = conversa;

  function iniciar(event: DragEvent<HTMLElement>) {
    event.dataTransfer.setData("text/plain", conversa.id);
    event.dataTransfer.effectAllowed = "move";
    onArrastar();
  }

  return (
    <article
      draggable
      onDragStart={iniciar}
      onDragEnd={onSoltar}
      className={cn(
        "relative flex cursor-grab flex-col gap-3 rounded-lg bg-canvas-soft p-4 transition-colors hover:bg-primary-pale active:cursor-grabbing",
        arrastando && "opacity-40",
      )}
    >
      <div className="flex items-center gap-3">
        <ClientAvatar nome={conversa.nome} score={ficha?.score} size="sm" />
        <div className="flex min-w-0 flex-1 flex-col">
          {/* O botão cobre o card inteiro: clicar em qualquer ponto abre a conversa. */}
          <button
            type="button"
            onClick={onAbrir}
            className="truncate text-left text-body-md font-semibold before:absolute before:inset-0 before:rounded-lg"
          >
            {conversa.nome}
          </button>
          <span className="truncate text-caption text-mute">
            {!ficha ? "Sem cadastro" : ficha.aReceber > 0 ? `${formatBRL(ficha.aReceber)} a receber` : "Nada a receber"}
          </span>
        </div>
        {conversa.naoLidas > 0 && (
          <Badge tone="deep" size="sm" className="shrink-0">
            {conversa.naoLidas}
            <span className="sr-only">{conversa.naoLidas === 1 ? " não lida" : " não lidas"}</span>
          </Badge>
        )}
      </div>

      {ultima && <p className="line-clamp-2 text-body-sm text-body">{ultima.texto}</p>}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {situacao ? (
          <Badge tone={situacao.tom} size="sm">
            {situacao.texto}
          </Badge>
        ) : (
          <span />
        )}
        <span className="shrink-0 text-caption text-mute">
          {conversa.atendente}
          {ultima && ` · ${ultima.quando}`}
        </span>
      </div>
    </article>
  );
}

/** Quadro do funil: uma coluna por etapa, card de cada contato, arrastar muda a etapa. */
export function Funil({ conversas: iniciais }: FunilProps) {
  const router = useRouter();
  const [conversas, setConversas] = useState<readonly Conversa[]>(iniciais);
  const [atendente, setAtendente] = useState<string>(TODOS);
  const [busca, setBusca] = useState("");
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [colunaAlvo, setColunaAlvo] = useState<Etapa | null>(null);
  const quadroRef = useRef<HTMLDivElement>(null);
  /** Onde o arraste do quadro começou: posição do mouse e da rolagem. */
  const inicioDoArraste = useRef<{ x: number; scroll: number } | null>(null);
  const [rolavel, setRolavel] = useState(false);
  const [movendoQuadro, setMovendoQuadro] = useState(false);

  /** Só dá para arrastar o quadro quando alguma coluna ficou escondida para o lado. Mede na hora. */
  function medirRolagem(): boolean {
    const quadro = quadroRef.current;
    const pode = quadro !== null && quadro.scrollWidth > quadro.clientWidth;
    setRolavel(pode);
    return pode;
  }

  function iniciarArrasteDoQuadro(event: PointerEvent<HTMLDivElement>) {
    const quadro = quadroRef.current;
    if (!quadro || event.pointerType !== "mouse" || event.button !== 0 || !medirRolagem()) return;
    // Em cima de card, botão ou campo, o clique é deles (o card tem o próprio arrastar).
    if (event.target instanceof Element && event.target.closest("article, button, input, a")) return;

    event.preventDefault(); // não seleciona texto enquanto arrasta
    quadro.setPointerCapture(event.pointerId);
    inicioDoArraste.current = { x: event.clientX, scroll: quadro.scrollLeft };
    setMovendoQuadro(true);
  }

  function arrastarQuadro(event: PointerEvent<HTMLDivElement>) {
    const inicio = inicioDoArraste.current;
    const quadro = quadroRef.current;
    if (!inicio || !quadro) return;
    quadro.scrollLeft = inicio.scroll - (event.clientX - inicio.x);
  }

  function soltarQuadro(event: PointerEvent<HTMLDivElement>) {
    if (!inicioDoArraste.current) return;
    inicioDoArraste.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setMovendoQuadro(false);
  }

  const termo = normalizeSearch(busca);
  const visiveis = conversas
    .filter((c) => atendente === TODOS || c.atendente === atendente)
    .filter((c) => termo === "" || normalizeSearch(c.nome).includes(termo));

  function soltar(event: DragEvent<HTMLElement>, etapa: Etapa) {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/plain");
    if (id !== "") setConversas((atual) => atual.map((c) => (c.id === id && c.etapa !== etapa ? { ...c, etapa } : c)));
    setArrastandoId(null);
    setColunaAlvo(null);
  }

  function sair(event: DragEvent<HTMLElement>) {
    // Passar por cima de um card da própria coluna também dispara "saiu": só limpa quando sai de verdade.
    if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
    setColunaAlvo(null);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips aria-label="Filtrar por atendente">
          <FilterChip selected={atendente === TODOS} onClick={() => setAtendente(TODOS)}>
            Todos
          </FilterChip>
          {ATENDENTES.map((nome) => (
            <FilterChip
              key={nome}
              selected={atendente === nome}
              count={conversas.filter((c) => c.atendente === nome).length}
              onClick={() => setAtendente(nome)}
            >
              {nome}
            </FilterChip>
          ))}
        </FilterChips>
        <div className={cn(fieldBoxClass({}), "w-full md:max-w-xs")}>
          <SearchIcon className="shrink-0 text-body" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar no funil"
            placeholder="Buscar por nome"
            className="min-w-0 flex-1 bg-transparent text-body-md outline-none placeholder:text-mute"
          />
        </div>
      </div>

      {/* Coluna nunca fica mais estreita que 16rem: quando as cinco não cabem, o quadro rola para o lado,
          pela barra ou clicando no fundo e arrastando com o mouse. */}
      <div
        ref={quadroRef}
        onPointerEnter={medirRolagem}
        onPointerDown={iniciarArrasteDoQuadro}
        onPointerMove={arrastarQuadro}
        onPointerUp={soltarQuadro}
        onPointerCancel={soltarQuadro}
        className={cn(
          "-mx-4 overflow-x-auto px-4 pb-2 md:mx-0 md:px-0",
          rolavel && (movendoQuadro ? "cursor-grabbing select-none" : "cursor-grab"),
        )}
      >
        <div className="grid auto-cols-[minmax(16rem,1fr)] grid-flow-col gap-4">
          {ETAPAS.map((etapa) => {
            const cards = visiveis.filter((c) => c.etapa === etapa.value);
            const aReceber = cards.reduce((soma, c) => soma + (c.ficha?.aReceber ?? 0), 0);
            const alvo = colunaAlvo === etapa.value;

            return (
              <section
                key={etapa.value}
                aria-label={`${etapa.label}, ${cards.length} ${cards.length === 1 ? "contato" : "contatos"}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = "move";
                  if (!alvo) setColunaAlvo(etapa.value);
                }}
                onDragLeave={sair}
                onDrop={(e) => soltar(e, etapa.value)}
                className={cn(
                  // Vai até o pé da tela: cabeçalho, filtros e o respiro de baixo somam uns 15rem.
                  // Com muito card, a coluna cresce e a página rola.
                  "flex min-h-96 flex-col gap-3 rounded-xl p-3 transition-colors md:min-h-[calc(100dvh-15rem)]",
                  alvo ? "bg-primary-pale" : "bg-canvas",
                )}
              >
                <header className="flex flex-col gap-0.5 px-2 pt-2">
                  <div className="flex items-baseline justify-between gap-2">
                    <h2 className="text-body-md font-semibold">{etapa.label}</h2>
                    <span className="text-caption text-body">{cards.length}</span>
                  </div>
                  <span className="text-caption text-mute">
                    {aReceber > 0 ? `${formatBRL(aReceber)} a receber` : "Nada a receber"}
                  </span>
                </header>

                {cards.length === 0 ? (
                  <p className="grid flex-1 place-items-center rounded-xl px-4 py-8 text-center text-caption text-mute">
                    Arraste um card para cá
                  </p>
                ) : (
                  cards.map((conversa) => (
                    <CartaoContato
                      key={conversa.id}
                      conversa={conversa}
                      arrastando={arrastandoId === conversa.id}
                      onArrastar={() => setArrastandoId(conversa.id)}
                      onSoltar={() => {
                        setArrastandoId(null);
                        setColunaAlvo(null);
                      }}
                      onAbrir={() => router.push(`/conversas?conversa=${conversa.id}`)}
                    />
                  ))
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
