import * as z from "zod";
import { onlyDigits } from "@/lib/format";

/*
 * Os campos que se repetem nas operações, com a mensagem que a pessoa lê quando erra.
 * As descrições servem para a IA entender o campo; as mensagens, para quem preenche.
 */

export const dia = (erro: string) => z.iso.date({ error: erro });

export const id = (erro: string) => z.uuid({ error: erro });

export const dinheiro = (erro: string) =>
  z
    .number({ error: erro })
    .positive({ error: erro })
    .max(99_999_999.99, { error: "Valor alto demais. Confira o que você digitou." });

/** Texto opcional: vazio vira "não informado". */
export const textoOpcional = () =>
  z
    .string()
    .trim()
    .optional()
    .transform((valor) => (valor === "" ? undefined : valor));

export const tipoContrato = z.enum(["emprestimo", "venda"]).describe("empréstimo de dinheiro ou venda parcelada");

export const frequencia = z
  .enum(["diaria", "semanal", "quinzenal", "mensal"])
  .describe("de quanto em quanto tempo vence cada parcela");

export const jurosSobre = z
  .enum(["parcela", "total"])
  .describe("parcela: a taxa vale para cada parcela (10% em 3x = 30%); total: a taxa entra uma vez só");

export const canal = z.enum(["pix", "dinheiro", "transferencia", "cartao"]).describe("como o dinheiro foi pago ou enviado");

export const forma = z
  .enum(["parcela", "juros", "parcial", "quitacao"])
  .describe(
    "parcela: quitou a parcela; juros: pagou só o juro e a parcela vai para o próximo vencimento; parcial: pagou parte; quitacao: pagou tudo o que falta do contrato",
  );

export const cpf = () =>
  textoOpcional()
    .transform((valor) => (valor === undefined ? undefined : onlyDigits(valor)))
    .refine((valor) => valor === undefined || valor === "" || valor.length === 11, {
      error: "CPF tem 11 dígitos. Confira o que você digitou.",
    })
    .transform((valor) => (valor === "" ? undefined : valor));
