"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toast";
import { salvarAvisosAcao } from "@/lib/acoes";
import { cn } from "@/lib/cn";
import type { Avisos } from "@/lib/dados";

type Aviso = { chave: keyof Avisos; label: string; description: string };

const AVISOS: readonly Aviso[] = [
  {
    chave: "vencimentos",
    label: "Parcelas que vencem hoje",
    description: "Um aviso de manhã com quem tem parcela vencendo no dia.",
  },
  {
    chave: "atrasos",
    label: "Parcelas atrasadas",
    description: "Assim que uma parcela passa do vencimento sem pagamento.",
  },
  {
    chave: "resumo",
    label: "Resumo da semana",
    description: "Toda segunda: o que entrou e o que vem pela frente.",
  },
];

/** Liga e desliga cada aviso na hora. Se o servidor recusar, a chave volta sozinha. */
export function NoticeSettings({ avisos }: { avisos: Avisos }) {
  const [estado, setEstado] = useState(avisos);
  const [, startTransition] = useTransition();
  const toast = useToast();

  function alternar(chave: keyof Avisos, ligado: boolean) {
    const proximo = { ...estado, [chave]: ligado };
    setEstado(proximo);

    startTransition(async () => {
      try {
        await salvarAvisosAcao(proximo);
      } catch {
        setEstado((atual) => ({ ...atual, [chave]: !ligado }));
        toast({
          title: "Não deu para salvar",
          description: "Confira a conexão e tente de novo.",
          tone: "negative",
        });
      }
    });
  }

  return (
    <Card flush className="flex flex-col px-6 py-3">
      {AVISOS.map((aviso, i) => (
        <Switch
          key={aviso.chave}
          label={aviso.label}
          description={aviso.description}
          checked={estado[aviso.chave]}
          onChange={(e) => alternar(aviso.chave, e.target.checked)}
          className={cn("py-3", i > 0 && "border-t border-canvas-soft")}
        />
      ))}
    </Card>
  );
}
