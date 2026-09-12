import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type DataTableColumn<T> = {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
  className?: string;
};

export type DataTableProps<T> = {
  columns: readonly DataTableColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Descrição da tabela para leitor de tela. */
  caption: string;
  /** Mostrado quando não há linhas. */
  empty?: ReactNode;
  className?: string;
};

/**
 * Tabela simples: cabeçalho sálvia em legenda, linhas 14px, divisória sálvia, recuo 12×16.
 * Coloque dentro de `<Card flush>`. Rola na horizontal no celular.
 */
export function DataTable<T>({ columns, rows, rowKey, caption, empty, className }: DataTableProps<T>) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-canvas-soft">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={cn(
                  "px-4 py-3 text-caption font-normal whitespace-nowrap text-body",
                  col.align === "right" && "text-right",
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && empty !== undefined ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-body-sm text-body">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-canvas-soft last:border-b-0">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn("px-4 py-3 text-body-sm", col.align === "right" && "text-right", col.className)}
                  >
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
