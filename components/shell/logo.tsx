import { cn } from "@/lib/cn";

export type LogoProps = {
  className?: string;
  /** Classes do nome "Caderno" (ex.: esconder no menu recolhido, deixando só o símbolo). */
  wordmarkClassName?: string;
};

/** Marca provisória: círculo verde Wise com as linhas do caderno. */
export function Logo({ className, wordmarkClassName }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <svg width="32" height="32" viewBox="0 0 48 48" fill="none" aria-hidden focusable={false} className="shrink-0">
        <rect width="48" height="48" rx="24" className="fill-primary" />
        <path d="M14 18h20M14 25h20M14 32h11" className="stroke-ink" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <span className={cn("text-display-xs font-black", wordmarkClassName)}>Caderno</span>
    </span>
  );
}
