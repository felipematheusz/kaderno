type ClassValue = string | false | null | undefined;

/** Junta classes ignorando valores vazios. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}
