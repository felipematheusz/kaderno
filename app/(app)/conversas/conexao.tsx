"use client";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

export type ConexaoProps = {
  open: boolean;
  onClose: () => void;
  conectado: boolean;
  numero?: string;
  onConectar: () => void;
  /** Desliga o número atual e mostra o QR code para ligar outro. */
  onTrocar: () => void;
};

const LADO = 25;
const OLHO = 7;

/** Os três quadrados de canto que todo QR code tem. */
const OLHOS: readonly { x: number; y: number }[] = [
  { x: 0, y: 0 },
  { x: LADO - OLHO, y: 0 },
  { x: 0, y: LADO - OLHO },
];

function dentroDeOlho(x: number, y: number): boolean {
  return OLHOS.some((o) => x >= o.x - 1 && x <= o.x + OLHO && y >= o.y - 1 && y <= o.y + OLHO);
}

/** Pontos do QR de mentira. Sequência fixa: servidor e navegador desenham igual. */
const PONTOS: readonly { x: number; y: number }[] = (() => {
  const pontos: { x: number; y: number }[] = [];
  let semente = 20260912;
  for (let y = 0; y < LADO; y++) {
    for (let x = 0; x < LADO; x++) {
      semente = (semente * 48271) % 2147483647;
      if (!dentroDeOlho(x, y) && semente % 2 === 0) pontos.push({ x, y });
    }
  }
  return pontos;
})();

/** Enquanto a uazapi não está ligada, o QR é só desenho. O de verdade vem de /instance/connect. */
function QrFalso() {
  return (
    <svg viewBox="-2 -2 29 29" role="img" aria-label="QR code para conectar o WhatsApp" className="size-52 rounded-lg bg-canvas">
      {OLHOS.map((o) => (
        <g key={`${o.x}-${o.y}`}>
          <rect x={o.x} y={o.y} width={OLHO} height={OLHO} rx={1.5} className="fill-ink" />
          <rect x={o.x + 1} y={o.y + 1} width={OLHO - 2} height={OLHO - 2} rx={1} className="fill-canvas" />
          <rect x={o.x + 2} y={o.y + 2} width={OLHO - 4} height={OLHO - 4} rx={0.75} className="fill-ink" />
        </g>
      ))}
      {PONTOS.map((p) => (
        <rect key={`${p.x}-${p.y}`} x={p.x + 0.08} y={p.y + 0.08} width={0.84} height={0.84} rx={0.2} className="fill-ink" />
      ))}
    </svg>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-3">
      <dt className="text-body-sm text-body">{rotulo}</dt>
      <dd className="text-body-sm font-semibold">{valor}</dd>
    </div>
  );
}

/** Estado da conexão do número da empresa: dados quando está ligado, QR code quando não. */
export function Conexao({ open, onClose, conectado, numero, onConectar, onTrocar }: ConexaoProps) {
  if (conectado) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title="WhatsApp conectado"
        description="As conversas do número da empresa chegam aqui em tempo real."
        footer={
          <Button variant="tertiary" onClick={onTrocar}>
            Trocar número
          </Button>
        }
      >
        <dl className="flex flex-col divide-y divide-canvas-soft">
          <Linha rotulo="Número" valor={numero ?? "Sem número no perfil"} />
          <Linha rotulo="Conectado desde" valor="02/09/2026" />
          <Linha rotulo="Mensagens hoje" valor="48" />
        </dl>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Conectar WhatsApp"
      description="Use o celular com o WhatsApp da empresa."
      footer={
        <Button
          onClick={() => {
            onConectar();
            onClose();
          }}
        >
          Já escaneei
        </Button>
      }
    >
      <div className="flex justify-center rounded-lg bg-canvas-soft p-5">
        <QrFalso />
      </div>
      <ol className="flex list-inside list-decimal flex-col gap-2 text-body-md text-body">
        <li>Abra o WhatsApp no celular.</li>
        <li>Toque em Mais opções e depois em Aparelhos conectados.</li>
        <li>Aponte a câmera para este código.</li>
      </ol>
    </Modal>
  );
}
