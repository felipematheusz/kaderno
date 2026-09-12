"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { ClientSearch, type ClientOption } from "@/components/domain/client-search";
import { Button, buttonClass } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { MoneyInput } from "@/components/ui/money-input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { salvarContrato, type EstadoForm } from "@/lib/acoes";
import { FREQUENCIAS, simular, type Frequencia, type JurosSobre } from "@/lib/contrato";
import type { Contrato } from "@/lib/dados";
import { formatBRL, somarDias } from "@/lib/format";
import { marcarEnvio } from "@/lib/envio";

export type ContractFormProps = {
  clientes: readonly ClientOption[];
  tipo: "emprestimo" | "venda";
  /** Preenchido na edição. */
  contrato?: Contrato;
  /** Cliente já escolhido (veio do perfil dele). */
  clienteInicial?: string;
  /** Hoje em ISO, vindo do servidor: evita o cliente e o servidor discordarem da data. */
  hoje: string;
  voltarPara: string;
};

/** Uma conta na tela: o rodapé recalcula a cada tecla, com a mesma função que grava o contrato. */
export function ContractForm({ clientes, tipo, contrato, clienteInicial, hoje, voltarPara }: ContractFormProps) {
  const [estado, acao, pendente] = useActionState<EstadoForm, FormData>(salvarContrato, {});
  const erros = estado.erros ?? {};
  const venda = tipo === "venda";

  const [principal, setPrincipal] = useState<number | null>(contrato?.principal ?? null);
  const [entrada, setEntrada] = useState<number | null>(contrato?.entrada ?? null);
  const [custo, setCusto] = useState<number | null>(contrato?.custo ?? null);
  const [comJuros, setComJuros] = useState(contrato === undefined || contrato.taxa > 0 ? "sim" : "nao");
  const [taxa, setTaxa] = useState(String(contrato?.taxa ?? 10));
  const [jurosSobre, setJurosSobre] = useState<JurosSobre>(contrato?.jurosSobre ?? "total");
  const [parcelas, setParcelas] = useState(String(contrato?.totalParcelas ?? 3));
  const [frequencia, setFrequencia] = useState<Frequencia>(contrato?.frequencia ?? "mensal");

  const quantas = Number(parcelas) || 0;
  const previa = simular({
    principal: principal ?? 0,
    taxa: comJuros === "sim" ? Number(taxa.replace(",", ".")) || 0 : 0,
    jurosSobre,
    parcelas: quantas,
    entrada: venda ? (entrada ?? 0) : 0,
    custo: venda ? (custo ?? 0) : undefined,
  });

  const jaPagas = contrato ? contrato.pagas : 0;

  return (
    <form action={acao} onSubmit={marcarEnvio} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={contrato?.id ?? ""} />
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="chave" />

      <Card variant="outlined" className="grid gap-5 md:grid-cols-2">
        <ClientSearch
          clients={clientes}
          name="clienteId"
          defaultValue={contrato?.clienteId ?? clienteInicial ?? null}
          error={erros.clienteId}
          hint="Busque por nome ou pelos primeiros dígitos do CPF."
          className="md:col-span-2"
          emptyAction={
            <Link href="/clientes/novo" className={buttonClass({ variant: "tertiary", size: "sm" })}>
              Cadastrar cliente
            </Link>
          }
        />

        {venda && (
          <>
            <Field
              label="Produto ou serviço"
              name="produto"
              defaultValue={contrato?.produto}
              error={erros.produto}
              placeholder="Notebook Dell"
            />
            <MoneyInput
              label="Quanto você pagou"
              name="custo"
              value={custo}
              onValueChange={setCusto}
              hint="Só entra no seu lucro. O cliente não vê."
            />
          </>
        )}

        <MoneyInput
          label={venda ? "Preço da venda" : "Valor emprestado"}
          name="principal"
          value={principal}
          onValueChange={setPrincipal}
          error={(principal ?? 0) > 0 ? undefined : erros.principal}
        />

        <SegmentedControl
          label="Tipo"
          name="comJuros"
          value={comJuros}
          onValueChange={setComJuros}
          options={[
            { value: "nao", label: "Valor fixo" },
            { value: "sim", label: "Com juros" },
          ]}
          fullWidth
        />

        {venda && (
          <MoneyInput label="Entrada" name="entrada" value={entrada} onValueChange={setEntrada} hint="Sai do parcelamento." />
        )}

        {comJuros === "sim" && (
          <>
            <Field
              label="Juros"
              name="taxa"
              inputMode="decimal"
              value={taxa}
              onChange={(event) => setTaxa(event.target.value)}
              error={erros.taxa}
              trailing={<span className="text-body-sm font-semibold text-body">% ao mês</span>}
            />
            <SegmentedControl
              label="O juro informado é"
              name="jurosSobre"
              value={jurosSobre}
              onValueChange={setJurosSobre}
              options={[
                { value: "parcela", label: "Por parcela" },
                { value: "total", label: "Sobre o total" },
              ]}
              fullWidth
            />
          </>
        )}

        <Field
          label="Número de parcelas"
          name="parcelas"
          inputMode="numeric"
          value={parcelas}
          onChange={(event) => setParcelas(event.target.value)}
          error={quantas >= 1 && quantas <= 360 ? undefined : erros.parcelas}
        />
        <Field
          label="Primeira parcela"
          name="primeiroVencimento"
          type="date"
          defaultValue={contrato?.primeiroVencimento ?? somarDias(hoje, 30)}
          error={erros.primeiroVencimento}
        />

        <SegmentedControl
          label="Frequência"
          name="frequencia"
          value={frequencia}
          onValueChange={setFrequencia}
          options={FREQUENCIAS}
          fullWidth
          className="md:col-span-2"
        />

        <Textarea
          label="Observação"
          name="observacao"
          defaultValue={contrato?.observacao}
          placeholder="Combinado na conversa de ontem..."
          hint="Só você vê."
          rows={3}
          className="md:col-span-2"
        />

        <Switch
          label="Cobrar juros em atraso"
          description="Fica registrado no contrato para você lembrar na hora de cobrar."
          name="jurosEmAtraso"
          defaultChecked={contrato?.jurosEmAtraso ?? true}
          className="md:col-span-2"
        />
      </Card>

      {jaPagas > 0 && (
        <p className="text-body-sm text-body">
          {jaPagas === 1 ? "A parcela já paga continua" : `As ${jaPagas} parcelas já pagas continuam`} como está
          {jaPagas === 1 ? "" : "m"}. O que ainda falta receber é recalculado com os novos valores.
        </p>
      )}

      {/* O rodapé acompanha a digitação e leva a ação principal: a conta e o botão no mesmo lugar. */}
      <Card variant="inverse" className="flex flex-col gap-5 md:sticky md:bottom-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          <span className="flex flex-col gap-1">
            <span className="text-body-sm text-canvas-soft">Cada parcela</span>
            <span className="text-display-xs whitespace-nowrap">{formatBRL(previa.valorParcela)}</span>
          </span>
          <span className="flex flex-col gap-1">
            <span className="text-body-sm text-canvas-soft">Total a receber</span>
            <span className="text-display-xs whitespace-nowrap">{formatBRL(previa.total)}</span>
          </span>
          <span className="flex flex-col gap-1 max-md:col-span-2">
            <span className="text-body-sm text-canvas-soft">{venda ? "Lucro estimado" : "Juros"}</span>
            <span className="text-display-xs whitespace-nowrap">{formatBRL(previa.lucro)}</span>
          </span>
        </div>

        <div className="flex flex-col-reverse gap-2.5 md:flex-row md:justify-end">
          <Link href={voltarPara} className={buttonClass({ variant: "inverse", className: "w-full md:w-auto" })}>
            Cancelar
          </Link>
          <Button type="submit" disabled={pendente} className="w-full md:w-auto">
            {pendente ? "Salvando…" : contrato ? "Salvar alterações" : venda ? "Criar venda" : "Criar contrato"}
          </Button>
        </div>
      </Card>
    </form>
  );
}
