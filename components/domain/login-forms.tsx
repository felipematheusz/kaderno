"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { cadastrar, definirNovaSenha, entrar, pedirNovaSenha, type EstadoLogin } from "@/lib/login";

/*
 * Os formulários de fora da área logada. Um botão principal por tela; os caminhos
 * alternativos ficam em link logo abaixo.
 */

function Cabecalho({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-display-sm">{titulo}</h1>
      {descricao && <p className="text-body-md text-body">{descricao}</p>}
    </div>
  );
}

function Rodape({ children }: { children: React.ReactNode }) {
  return <p className="text-center text-body-sm text-body">{children}</p>;
}

const link = "font-semibold text-ink underline underline-offset-4";

/** Depois de mandar e-mail, o formulário dá lugar ao aviso. */
function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <Card className="flex flex-col gap-4">
      <Cabecalho titulo={titulo} descricao={texto} />
      <Link href="/entrar" className={link}>
        Voltar para entrar
      </Link>
    </Card>
  );
}

export function EntrarForm({ voltar, erroInicial }: { voltar?: string; erroInicial?: string }) {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(entrar, {});
  const erros = estado.erros ?? {};

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-6">
        <Cabecalho titulo="Entrar" descricao={erroInicial} />
        <form action={acao} className="flex flex-col gap-5">
          <input type="hidden" name="voltar" value={voltar ?? "/"} />
          <Field label="E-mail" name="email" type="email" autoComplete="email" required error={erros.email} />
          <Field
            label="Senha"
            name="senha"
            type="password"
            autoComplete="current-password"
            required
            error={erros.senha}
          />
          <Button type="submit" disabled={pendente} className="w-full">
            {pendente ? "Entrando…" : "Entrar"}
          </Button>
        </form>
        <Link href="/esqueci-senha" className={`self-center text-body-sm ${link}`}>
          Esqueci a senha
        </Link>
      </Card>
      <Rodape>
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className={link}>
          Criar conta
        </Link>
      </Rodape>
    </div>
  );
}

export function CadastroForm() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(cadastrar, {});
  const erros = estado.erros ?? {};

  if (estado.aviso) return <Aviso titulo="Confirme seu e-mail" texto={estado.aviso} />;

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-6">
        <Cabecalho titulo="Criar conta" descricao="Seus clientes e contratos ficam só na sua conta." />
        <form action={acao} className="flex flex-col gap-5">
          <Field label="Seu nome" name="nome" autoComplete="name" required error={erros.nome} />
          <Field label="E-mail" name="email" type="email" autoComplete="email" required error={erros.email} />
          <Field
            label="Senha"
            name="senha"
            type="password"
            autoComplete="new-password"
            hint="8 caracteres ou mais."
            required
            error={erros.senha}
          />
          <Button type="submit" disabled={pendente} className="w-full">
            {pendente ? "Criando…" : "Criar conta"}
          </Button>
        </form>
      </Card>
      <Rodape>
        Já tem conta?{" "}
        <Link href="/entrar" className={link}>
          Entrar
        </Link>
      </Rodape>
    </div>
  );
}

export function EsqueciSenhaForm() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(pedirNovaSenha, {});
  const erros = estado.erros ?? {};

  if (estado.aviso) return <Aviso titulo="Confira seu e-mail" texto={estado.aviso} />;

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-6">
        <Cabecalho titulo="Esqueci a senha" descricao="Mandamos um link para você criar uma senha nova." />
        <form action={acao} className="flex flex-col gap-5">
          <Field label="E-mail da conta" name="email" type="email" autoComplete="email" required error={erros.email} />
          <Button type="submit" disabled={pendente} className="w-full">
            {pendente ? "Enviando…" : "Enviar link"}
          </Button>
        </form>
      </Card>
      <Rodape>
        Lembrou?{" "}
        <Link href="/entrar" className={link}>
          Entrar
        </Link>
      </Rodape>
    </div>
  );
}

export function NovaSenhaForm() {
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(definirNovaSenha, {});
  const erros = estado.erros ?? {};

  return (
    <Card className="flex flex-col gap-6">
      <Cabecalho titulo="Senha nova" descricao="Escolha a senha que você vai usar daqui para frente." />
      <form action={acao} className="flex flex-col gap-5">
        <Field
          label="Senha nova"
          name="senha"
          type="password"
          autoComplete="new-password"
          hint="8 caracteres ou mais."
          required
          error={erros.senha}
        />
        <Field
          label="Repita a senha nova"
          name="confirmacao"
          type="password"
          autoComplete="new-password"
          required
          error={erros.confirmacao}
        />
        <Button type="submit" disabled={pendente} className="w-full">
          {pendente ? "Salvando…" : "Salvar e entrar"}
        </Button>
      </form>
    </Card>
  );
}
