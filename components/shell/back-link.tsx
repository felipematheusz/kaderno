import Link from "next/link";
import { ArrowLeftIcon } from "@/components/ui/icons";

export type BackLinkProps = {
  href: string;
  children: string;
};

/** Volta uma tela. Vai no `eyebrow` do PageHeader das subtelas. */
export function BackLink({ href, children }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-body-sm font-semibold text-body transition-colors hover:text-ink"
    >
      <ArrowLeftIcon size={16} />
      {children}
    </Link>
  );
}
