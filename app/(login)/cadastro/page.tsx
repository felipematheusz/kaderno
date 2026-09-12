import type { Metadata } from "next";
import { CadastroForm } from "@/components/domain/login-forms";

export const metadata: Metadata = {
  title: "Criar conta · Caderno",
};

export default function CadastroPage() {
  return <CadastroForm />;
}
