import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { formatBRL } from "@/lib/format";
import { ClientAvatar } from "./client-avatar";

export type ClientCardProps = {
  nome: string;
  telefone?: string;
  /** Score de crédito: vira o anel do avatar. */
  score?: number;
  contratosAtivos: number;
  emprestado: number;
  recebido: number;
  /** Selo de atraso: "1 parcela atrasada". */
  alerta?: string;
  href?: string;
  className?: string;
};

/** Cliente em cartão: avatar com score, contato, contratos em aberto e o dinheiro dele. */
export function ClientCard({
  nome,
  telefone,
  score,
  contratosAtivos,
  emprestado,
  recebido,
  alerta,
  href,
  className,
}: ClientCardProps) {
  const contratos =
    contratosAtivos === 0 ? "sem contrato ativo" : `${contratosAtivos} ${contratosAtivos === 1 ? "contrato" : "contratos"}`;

  return (
    <Card
      className={cn(
        "relative flex flex-col gap-4 transition-colors",
        href && "hover:bg-primary-pale",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <ClientAvatar nome={nome} score={score} />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          {/* O link cobre o cartão inteiro, mas só o nome fica no caminho do teclado. */}
          {href ? (
            <Link href={href} className="truncate text-body-md font-semibold before:absolute before:inset-0">
              {nome}
            </Link>
          ) : (
            <span className="truncate text-body-md font-semibold">{nome}</span>
          )}
          <span className="truncate text-caption text-mute">
            {[telefone, contratos].filter(Boolean).join(" · ")}
          </span>
        </span>
        {alerta && (
          <Badge tone="negative" size="sm">
            {alerta}
          </Badge>
        )}
      </div>

      <Card variant="sage" className="grid grid-cols-2 gap-3 rounded-lg p-4">
        <span className="flex flex-col gap-1">
          <span className="text-caption text-mute">Emprestado</span>
          <span className="text-body-sm font-semibold">{formatBRL(emprestado)}</span>
        </span>
        <span className="flex flex-col gap-1">
          <span className="text-caption text-mute">Recebido</span>
          <span className="text-body-sm font-semibold">{formatBRL(recebido)}</span>
        </span>
      </Card>
    </Card>
  );
}
