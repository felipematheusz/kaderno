import { Logo } from "@/components/shell/logo";

/** Fora da área logada: só a marca e o cartão do formulário, no meio da tela. */
export default function LoginLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center gap-8 bg-canvas-soft px-4 py-10">
      <Logo />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
