import type { ReactNode } from "react";
import {
  BellIcon,
  CalendarIcon,
  ChartIcon,
  ClockIcon,
  ContractIcon,
  HomeIcon,
  ReceiptIcon,
  SendIcon,
  SlidersIcon,
  StarIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";

export type NavItem = {
  href: string;
  label: string;
  icon: ReactNode;
  /** Prefixo que marca a linha como ativa, quando difere do href (Ajustes → /ajustes). */
  match?: string;
  /** Mostra o contador de parcelas atrasadas. */
  showOverdue?: boolean;
};

const inicio: NavItem = { href: "/", label: "Início", icon: <HomeIcon /> };
const clientes: NavItem = { href: "/clientes", label: "Clientes", icon: <UsersIcon /> };
const contratos: NavItem = { href: "/contratos", label: "Contratos", icon: <ContractIcon /> };
const parcelas: NavItem = { href: "/parcelas", label: "Parcelas", icon: <ReceiptIcon />, showOverdue: true };
const calendario: NavItem = { href: "/calendario", label: "Calendário", icon: <CalendarIcon /> };
const relatorios: NavItem = { href: "/relatorios", label: "Relatórios", icon: <ChartIcon /> };
const historico: NavItem = { href: "/historico", label: "Histórico", icon: <ClockIcon /> };
const notificacoes: NavItem = { href: "/notificacoes", label: "Notificações", icon: <BellIcon /> };
const ajustes: NavItem = { href: "/ajustes/mensagens", label: "Ajustes", icon: <SlidersIcon />, match: "/ajustes" };
const planos: NavItem = { href: "/planos", label: "Planos", icon: <StarIcon /> };
const suporte: NavItem = { href: "/suporte", label: "Suporte", icon: <SendIcon /> };
const perfil: NavItem = { href: "/perfil", label: "Perfil e conta", icon: <UserIcon /> };

/** Menu lateral (desktop), bloco de cima. */
export const mainNav: readonly NavItem[] = [inicio, clientes, contratos, parcelas, calendario, relatorios, historico];

/** Menu lateral (desktop), bloco de baixo. */
export const secondaryNav: readonly NavItem[] = [ajustes, suporte];

/** Barra inferior (celular): os quatro primeiros; o quinto é "Mais". */
export const mobileNav: readonly NavItem[] = [inicio, clientes, contratos, parcelas];

/** O que abre no "Mais" do celular. */
export const moreNav: readonly NavItem[] = [
  calendario,
  relatorios,
  historico,
  notificacoes,
  ajustes,
  planos,
  suporte,
  perfil,
];

export function isActive(pathname: string, item: NavItem): boolean {
  const alvo = item.match ?? item.href;
  if (alvo === "/") return pathname === "/";
  return pathname === alvo || pathname.startsWith(`${alvo}/`);
}

/** "1 atrasada" / "3 atrasadas" — para leitor de tela e selos. */
export function overdueLabel(quantidade: number): string {
  return `${quantidade} ${quantidade === 1 ? "atrasada" : "atrasadas"}`;
}
