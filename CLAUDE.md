@AGENTS.md

# Identidade visual

Toda interface segue o `DESIGN.md` da raiz (estilo Wise). Leia antes de criar ou mudar qualquer tela ou componente.

- Use só os tokens do `@theme` em `app/globals.css`. As cores, raios, sombras e tamanhos de texto padrão do Tailwind estão desligados; não use `#hex` solto nem valores arbitrários de cor (`bg-[#...]`).
- Reutilize `components/ui/` (Button, Badge, Card, Field, Money, InstallmentBar) antes de criar algo novo. Componente novo segue o mesmo padrão e entra na vitrine `app/design/page.tsx`.
- Verde Wise (`primary`) só na ação principal, uma por tela, com texto `ink`. Nunca em selo ou como cor de sucesso.
- Destaque em `text-display-*` (peso 900). Cartão e botão com canto de 24px. Sem sombra, sem caixa alta, sem fonte mono, sem tema escuro.
- Situação do produto → `Badge` tone: em dia/pago `positive`, vence hoje `warning`, atrasado `negative`, a vencer `neutral`, quitado `ink`, renegociada `soft`.
