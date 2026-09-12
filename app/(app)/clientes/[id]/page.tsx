import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientAvatar } from "@/components/domain/client-avatar";
import { ContractListHeader, ContractRow } from "@/components/domain/contract-row";
import { DeleteAction } from "@/components/domain/delete-action";
import { StatCard } from "@/components/domain/stat-card";
import { BackLink } from "@/components/shell/back-link";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { CheckIcon, ClockIcon, ContractIcon, PlusIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { getCliente, getContratos } from "@/lib/dados";
import { formatCPF, formatDate } from "@/lib/format";
import { lerPagina, paginar } from "@/lib/paginacao";

export async function generateMetadata({ params }: PageProps<"/clientes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const cliente = await getCliente(id);
  return { title: cliente ? `${cliente.nome} · Caderno` : "Cliente · Caderno" };
}

/** Uma linha da ficha do cliente. Campo vazio não aparece. */
function Dado({ rotulo, valor }: { rotulo: string; valor?: string }) {
  if (!valor) return null;
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-caption text-mute">{rotulo}</dt>
      <dd className="text-body-sm font-semibold">{valor}</dd>
    </div>
  );
}

export default async function PerfilClientePage({ params, searchParams }: PageProps<"/clientes/[id]">) {
  const { id } = await params;
  const { pagina } = await searchParams;
  const cliente = await getCliente(id);
  if (!cliente) notFound();

  const contratos = (await getContratos()).filter((c) => c.clienteId === id);
  const { itens, paginacao } = paginar(contratos, lerPagina(pagina));
  const quantos = cliente.contratosAtivos;

  return (
    <>
      <PageHeader
        eyebrow={<BackLink href="/clientes">Clientes</BackLink>}
        title={cliente.nome}
        description={
          cliente.alerta ??
          (quantos === 0 ? "Nenhum contrato em aberto." : `${quantos} ${quantos === 1 ? "contrato" : "contratos"} em dia.`)
        }
        actions={
          <>
            <Link href={`/clientes/${id}/editar`} className={buttonClass({ variant: "tertiary" })}>
              Editar
            </Link>
            <DeleteAction
              tipo="cliente"
              id={id}
              titulo={`Excluir ${cliente.nome}?`}
              descricao={
                contratos.length === 0
                  ? "O cadastro some da lista. Não dá para desfazer."
                  : contratos.length === 1
                    ? "O contrato dele e todas as parcelas somem junto. Não dá para desfazer."
                    : `Os ${contratos.length} contratos dele e todas as parcelas somem junto. Não dá para desfazer.`
              }
              rotulo="Excluir"
              destino="/clientes"
              aviso="Cliente excluído"
            />
            <Link href={`/contratos/novo?cliente=${id}`} className={buttonClass()}>
              <PlusIcon size={18} />
              Novo contrato
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
        <StatCard rotulo="Emprestado" valor={cliente.emprestado} icon={<ContractIcon />} />
        <StatCard rotulo="Recebido" valor={cliente.recebido} icon={<CheckIcon />} />
        <StatCard
          rotulo="A receber"
          valor={cliente.aReceber}
          detalhe={cliente.alerta}
          icon={<ClockIcon />}
          tone={cliente.alerta ? "negative" : "default"}
          className="max-xl:col-span-2"
        />
      </div>

      <Card className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
        <ClientAvatar nome={cliente.nome} score={cliente.score} size="lg" />
        <dl className="grid flex-1 grid-cols-2 gap-5 lg:grid-cols-4">
          <Dado rotulo="Telefone" valor={cliente.telefone} />
          <Dado rotulo="CPF" valor={cliente.cpf && formatCPF(cliente.cpf)} />
          <Dado rotulo="E-mail" valor={cliente.email} />
          <Dado rotulo="Endereço" valor={cliente.endereco} />
          <Dado rotulo="Score de crédito" valor={cliente.score === undefined ? "sem score" : `${cliente.score} de 100`} />
          <Dado rotulo="Cliente desde" valor={formatDate(cliente.desde)} />
        </dl>
      </Card>

      {contratos.length === 0 ? (
        <EmptyState
          icon={<ContractIcon size={24} />}
          title="Nenhum contrato com esse cliente"
          description="Crie o primeiro para acompanhar as parcelas por aqui."
          action={
            <Link href={`/contratos/novo?cliente=${id}`} className={buttonClass({ variant: "tertiary" })}>
              Novo contrato
            </Link>
          }
        />
      ) : (
        <>
          <Card flush>
            <ContractListHeader />
            <ul>
              {itens.map((c) => (
                <ContractRow
                  key={c.id}
                  cliente={c.cliente}
                  produto={c.produto}
                  numero={c.numero}
                  tipo={c.tipo}
                  valor={c.valor}
                  parcelas={c.parcelas}
                  alerta={c.alerta}
                  href={`/contratos/${c.id}`}
                />
              ))}
            </ul>
          </Card>
          <Pagination {...paginacao} href={(p) => `/clientes/${id}?pagina=${p}`} rotulo="contratos" />
        </>
      )}
    </>
  );
}
