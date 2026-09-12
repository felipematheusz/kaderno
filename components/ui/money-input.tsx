"use client";

import { useLayoutEffect, useRef, useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Field, type FieldProps } from "./field";

const milhar = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

/**
 * Deixa o texto no formato canônico "1234,5": só dígitos, uma vírgula e até 2 casas.
 * Sem zero à esquerda na parte inteira.
 */
function canonical(texto: string): string {
  const limpo = texto.replace(/[^\d,]/g, "");
  const virgula = limpo.indexOf(",");
  let inteiro = virgula === -1 ? limpo : limpo.slice(0, virgula);
  const decimais = virgula === -1 ? null : limpo.slice(virgula + 1).replace(/,/g, "").slice(0, 2);

  inteiro = inteiro.replace(/^0+(?=\d)/, "");
  if (decimais !== null && inteiro === "") inteiro = "0";
  return decimais === null ? inteiro : `${inteiro},${decimais}`;
}

/** "1234,5" → "1.234,5" (enquanto digita: não completa os centavos). */
function formatTyping(canon: string): string {
  if (canon === "") return "";
  const [inteiro, decimais] = canon.split(",");
  const comMilhar = milhar.format(Number(inteiro));
  return decimais === undefined ? comMilhar : `${comMilhar},${decimais}`;
}

/** "1234,5" → 1234.5; vazio → null. */
function parse(canon: string): number | null {
  if (canon === "") return null;
  return Number(canon.replace(",", "."));
}

/** 1234.5 → "1.234,50" (ao sair do campo e ao receber valor de fora). */
function formatFinal(valor: number): string {
  return new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(valor);
}

/**
 * Converte o trecho recém-digitado ou colado. Ponto sozinho vira vírgula (teclado numérico
 * com ponto); "1234.56" colado de calculadora vira 1234,56; "1.234,56" fica como está.
 */
function normalizeInsert(trecho: string, jaTemVirgula: boolean): string {
  if (trecho === ".") return jaTemVirgula ? "" : ",";
  if (trecho.includes(",")) return trecho.replace(/\./g, "");
  const pontos = trecho.match(/\./g)?.length ?? 0;
  if (pontos === 1 && /\.\d{1,2}$/.test(trecho) && !jaTemVirgula) return trecho.replace(".", ",");
  return trecho.replace(/\./g, "");
}

/** Quantos dígitos/vírgula existem no texto: é o que guia o cursor após reformatar. */
function countSignificant(texto: string): number {
  return texto.replace(/[^\d,]/g, "").length;
}

function positionAfterSignificant(texto: string, quantidade: number): number {
  if (quantidade === 0) return 0;
  let vistos = 0;
  for (let i = 0; i < texto.length; i++) {
    if (/[\d,]/.test(texto[i])) vistos++;
    if (vistos === quantidade) return i + 1;
  }
  return texto.length;
}

export type MoneyInputProps = Omit<FieldProps, "value" | "defaultValue" | "onChange" | "type" | "size" | "trailing"> & {
  /** Controlado: número em reais (1234.5) ou null quando vazio. */
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (valor: number | null) => void;
};

/**
 * Campo de dinheiro. Formata em pt-BR enquanto digita, da esquerda para a direita:
 * digitar 1000 mostra 1.000 (não R$ 10,00 como no Jurex). Centavos só depois da vírgula.
 * Com `name`, envia no <form> o número com ponto decimal ("1234.5").
 */
export function MoneyInput({ value, defaultValue = null, onValueChange, name, onBlur, onKeyDown, ...props }: MoneyInputProps) {
  const inicial = value !== undefined ? value : defaultValue;
  const [texto, setTexto] = useState(() => (inicial === null ? "" : formatFinal(inicial)));
  const [valorAnterior, setValorAnterior] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const cursorPendente = useRef<number | null>(null);

  // Valor trocado por fora (ex.: escolheu "quitar tudo" e o total veio preenchido).
  if (value !== valorAnterior) {
    setValorAnterior(value);
    if (value !== undefined && value !== parse(canonical(texto))) {
      setTexto(value === null ? "" : formatFinal(value));
    }
  }

  useLayoutEffect(() => {
    const posicao = cursorPendente.current;
    if (posicao === null || !inputRef.current) return;
    inputRef.current.setSelectionRange(posicao, posicao);
    cursorPendente.current = null;
  }, [texto]);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const novo = event.target.value;
    const cursor = event.target.selectionStart ?? novo.length;

    // Descobre o trecho inserido comparando com o texto anterior (prefixo e sufixo em comum).
    let prefixo = 0;
    while (prefixo < texto.length && prefixo < cursor && texto[prefixo] === novo[prefixo]) prefixo++;
    const sufixo = novo.length - cursor;
    const inserido = novo.slice(prefixo, cursor);
    const restoAntes = novo.slice(0, prefixo);
    const restoDepois = novo.slice(novo.length - sufixo);
    const jaTemVirgula = (restoAntes + restoDepois).includes(",");

    const antesDoCursor = restoAntes + normalizeInsert(inserido, jaTemVirgula);
    const canon = canonical(antesDoCursor + restoDepois);
    const formatado = formatTyping(canon);

    cursorPendente.current = positionAfterSignificant(formatado, countSignificant(antesDoCursor));
    setTexto(formatado);
    onValueChange?.(parse(canon));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(event);
    // Apagar logo depois do ponto de milhar apaga o dígito anterior, não o ponto.
    const input = event.currentTarget;
    const { selectionStart: inicio, selectionEnd: fim } = input;
    if (event.key === "Backspace" && inicio !== null && inicio === fim && texto[inicio - 1] === ".") {
      input.setSelectionRange(inicio - 1, inicio - 1);
    }
  }

  const numero = parse(canonical(texto));

  return (
    <>
      <Field
        ref={inputRef}
        {...props}
        size="lg"
        inputMode="decimal"
        autoComplete="off"
        value={texto}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={(event) => {
          if (numero !== null) setTexto(formatFinal(numero));
          onBlur?.(event);
        }}
        trailing={<span className="text-body-sm font-semibold text-body">BRL</span>}
      />
      {name && <input type="hidden" name={name} value={numero === null ? "" : String(numero)} />}
    </>
  );
}
