import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import { ClientCard } from "@/components/domain/client-card";
import { PageHeader } from "@/components/shell/page-header";
import { buttonClass } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { PlusIcon, SearchIcon, UsersIcon } from "@/components/ui/icons";
import { Pagination } from "@/components/ui/pagination";
import { getClientes } from "@/lib/dados";
import { clienteCombina } from "@/lib/emprestimos";
import { lerPagina, paginar } from "@/lib/paginacao";

export const metadata: Metadata = {
  title: "Clientes · Caderno",
};

/** A grade tem até 3 colunas: 24 fecha as linhas certinho. */
const POR_PAGINA_CLIENTES = 24;

/** Mantém a busca ao trocar de página. */
function link(busca: string, pagina: number): string {
  const params = new URLSearchParams();
  if (busca !== "") params.set("busca", busca);
  if (pagina > 1) params.set("pagina", String(pagina));
  const query = params.toString();
  return query === "" ? "/clientes" : `/clientes?${query}`;
}

export default async function ClientesPage({ searchParams }: PageProps<"/clientes">) {
  const { busca, pagina } = await searchParams;
  const termo = typeof busca === "string" ? busca : "";
  const clientes = await getClientes();
  const lista = clientes.filter((c) => clienteCombina(c, termo));
  const { itens, paginacao } = paginar(lista, lerPagina(pagina), POR_PAGINA_CLIENTES);

  return (
    <>
      <PageHeader
        title="Clientes"
        description={`${clientes.length} ${clientes.length === 1 ? "cadastrado" : "cadastrados"}`}
        actions={
          <Link href="/clientes/novo" className={buttonClass()}>
            <PlusIcon size={18} />
            Novo cliente
          </Link>
        }
      />

      {/* A busca vai para a URL: dá para voltar, recarregar e compartilhar o resultado. */}
      <Form action="/clientes" className="w-full md:max-w-sm">
        <Field
          label="Buscar cliente"
          name="busca"
          type="search"
          defaultValue={termo}
          placeholder="Nome ou CPF"
          leading={<SearchIcon className="shrink-0 text-body" />}
        />
      </Form>

      {lista.length === 0 ? (
        <EmptyState
          icon={<UsersIcon size={24} />}
          title={termo === "" ? "Nenhum cliente ainda" : "Nenhum cliente com esse nome ou CPF"}
          description={
            termo === ""
              ? "Cadastre o primeiro para começar a registrar empréstimos."
              : "Confira o que você digitou ou cadastre esse cliente."
          }
          action={
            <Link href="/clientes/novo" className={buttonClass({ variant: "tertiary" })}>
              Cadastrar cliente
            </Link>
          }
        />
      ) : (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {itens.map((cliente) => (
              <li key={cliente.id} className="flex">
                <ClientCard
                  nome={cliente.nome}
                  telefone={cliente.telefone}
                  score={cliente.score}
                  contratosAtivos={cliente.contratosAtivos}
                  emprestado={cliente.emprestado}
                  recebido={cliente.recebido}
                  alerta={cliente.alerta}
                  href={`/clientes/${cliente.id}`}
                  className="flex-1"
                />
              </li>
            ))}
          </ul>
          <Pagination {...paginacao} href={(p) => link(termo, p)} rotulo="clientes" />
        </>
      )}
    </>
  );
}
