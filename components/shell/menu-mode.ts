/**
 * Tamanho do menu lateral.
 * - "auto": recolhido em tela média (abaixo de 1280px), aberto em tela grande. É o padrão.
 * - "aberto" / "fechado": escolha da pessoa pelo botão, vale em qualquer tamanho.
 */
export type MenuMode = "auto" | "aberto" | "fechado";

/** Cookie que guarda a escolha. Lido no servidor para a página já abrir no tamanho certo. */
export const MENU_COOKIE = "menu";

const UM_ANO = 60 * 60 * 24 * 365;

export function parseMenuMode(valor: string | undefined): MenuMode {
  return valor === "aberto" || valor === "fechado" ? valor : "auto";
}

export function saveMenuMode(modo: Exclude<MenuMode, "auto">): void {
  document.cookie = `${MENU_COOKIE}=${modo}; path=/; max-age=${UM_ANO}; samesite=lax`;
}
