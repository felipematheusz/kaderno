import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { EstadoPaginacao } from "@/lib/paginacao";
import { buttonClass } from "./button";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export type PaginationProps = EstadoPaginacao & {
  /** Monta o endereço de cada página, preservando busca e filtros da tela. */
  href: (pagina: number) => string;
  /** Nome do que está listado, no plural: "134 clientes". */
  rotulo: string;
  className?: string;
};

const numeroClass =
  "inline-flex size-10 items-center justify-center rounded-pill text-body-sm font-semibold transition-colors";

/** Janela de páginas com reticências: 1 … 5 6 7 … 12. Até 7 páginas, mostra todas. */
function janela(pagina: number, paginas: number): readonly (number | "gap")[] {
  if (paginas <= 7) return Array.from({ length: paginas }, (_, i) => i + 1);

  const inicio = Math.min(Math.max(2, pagina - 1), paginas - 3);
  const numeros = [1, inicio, inicio + 1, inicio + 2, paginas];

  const saida: (number | "gap")[] = [];
  let anterior = 0;
  for (const numero of numeros) {
    if (anterior !== 0 && numero - anterior > 1) saida.push("gap");
    saida.push(numero);
    anterior = numero;
  }
  return saida;
}

function Passo({ para, rotulo, children }: { para?: string; rotulo: string; children: ReactNode }) {
  if (para === undefined) {
    return (
      <span aria-hidden="true" className={buttonClass({ variant: "ghost", size: "icon-sm", className: "opacity-30" })}>
        {children}
      </span>
    );
  }
  return (
    <Link href={para} aria-label={rotulo} className={buttonClass({ variant: "ghost", size: "icon-sm" })}>
      {children}
    </Link>
  );
}

/**
 * Paginação por URL: cada página é um link, então dá para voltar, recarregar e compartilhar.
 * Some sozinha quando tudo cabe numa página. Coloque logo abaixo da lista.
 */
export function Pagination({ pagina, paginas, total, primeiro, ultimo, href, rotulo, className }: PaginationProps) {
  if (paginas <= 1) return null;

  return (
    <nav
      aria-label="Paginação"
      className={cn("flex flex-wrap items-center justify-between gap-3", className)}
    >
      <p className="text-body-sm text-body">
        {primeiro}–{ultimo} de {total} {rotulo}
      </p>

      <div className="flex items-center gap-1">
        <Passo para={pagina > 1 ? href(pagina - 1) : undefined} rotulo="Página anterior">
          <ChevronLeftIcon />
        </Passo>

        {/* No celular só o contador; da largura sm em diante, os números. */}
        <span aria-hidden="true" className="px-2 text-body-sm font-semibold sm:hidden">
          {pagina} de {paginas}
        </span>

        <ul className="hidden items-center gap-1 sm:flex">
          {janela(pagina, paginas).map((item, i) =>
            item === "gap" ? (
              <li key={`gap-${i}`} aria-hidden="true" className="px-1 text-body-sm text-mute">
                …
              </li>
            ) : (
              <li key={item}>
                <Link
                  href={href(item)}
                  aria-label={`Página ${item}`}
                  aria-current={item === pagina ? "page" : undefined}
                  className={cn(
                    numeroClass,
                    item === pagina ? "bg-ink-deep text-primary" : "text-ink hover:bg-primary-pale",
                  )}
                >
                  {item}
                </Link>
              </li>
            ),
          )}
        </ul>

        <Passo para={pagina < paginas ? href(pagina + 1) : undefined} rotulo="Próxima página">
          <ChevronRightIcon />
        </Passo>
      </div>
    </nav>
  );
}
