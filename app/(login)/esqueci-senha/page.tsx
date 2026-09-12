import type { Metadata } from "next";
import { EsqueciSenhaForm } from "@/components/domain/login-forms";

export const metadata: Metadata = {
  title: "Esqueci a senha · Caderno",
};

export default function EsqueciSenhaPage() {
  return <EsqueciSenhaForm />;
}
