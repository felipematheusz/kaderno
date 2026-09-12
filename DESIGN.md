# DESIGN.md — Caderno

Identidade visual do sistema de controle de empréstimos. Segue a linguagem da **Wise**, token por token, a partir de [`design-md/wise/DESIGN.md`](https://github.com/VoltAgent/awesome-design-md/tree/main/design-md/wise). "Caderno" é nome provisório.

Onde cada coisa vive:

| O quê | Onde |
|---|---|
| Tokens (cores, tipo, raios, sombra) | `app/globals.css` — bloco `@theme` |
| Fonte | `app/layout.tsx` — Geist via `next/font` |
| Componentes base | `components/ui/` |
| Vitrine viva | rota `/design` |
| Pranchas de referência | `design/identidade/` e o [canvas](https://claude.ai/code/artifact/32511471-6b76-4a14-aa36-1d098f506111) |

As paletas, raios, sombras e tamanhos de texto padrão do Tailwind estão **desligados**. Se `bg-zinc-100`, `rounded-lg` ou `text-sm` não funcionam, é de propósito: use o token daqui.

---

## 1. Cores

| Token (classe Tailwind) | Hex | Papel |
|---|---|---|
| `primary` | `#9FE870` | Verde Wise. **Só** a ação principal. |
| `primary-active` | `#CDFFAD` | Hover e pressionado do botão principal. |
| `primary-neutral` | `#C5EDAB` | Seleção suave, próxima parcela, renegociada. |
| `primary-pale` | `#E2F6D5` | Fundo do selo positivo, cartão de momento positivo. |
| `canvas-soft` | `#E8EBE6` | Sálvia. Fundo da página, botão secundário, cabeçalho de tabela, divisórias. |
| `canvas` | `#FFFFFF` | Cartões. |
| `ink` | `#0E0F0C` | Texto padrão, contorno de campo, selo quitado. |
| `ink-soft` | `#2A2C27` | Divisória e hover dentro de superfície invertida. |
| `ink-deep` | `#163300` | Verde-floresta. Cartão invertido, parcela paga, avatar do usuário. |
| `body` | `#454745` | Texto secundário. |
| `mute` | `#868685` | Legenda, placeholder, texto de menor prioridade. |
| `mute-inverse` | `#B7C4B0` | O mesmo papel dentro do cartão invertido. |
| `positive` / `positive-deep` | `#2EAD4B` / `#054D28` | Situação positiva / texto sobre `primary-pale`. |
| `warning` / `warning-content` | `#FFD11A` / `#4A3B1C` | Vence hoje: fundo / texto. |
| `negative` | `#D03238` | Erro, borda de campo inválido, parcela atrasada. |
| `negative-darkest` | `#A7000D` | Texto de erro e de atraso. |
| `negative-bg` | `#320707` | Vinho. Fundo do selo negativo, com texto branco. |
| `accent-orange` / `accent-cyan` | `#FFC091` / `#38C8FF` | Só dentro de ilustração. Nunca em interface. |

## 2. Tipografia

Uma família só: **Geist**, a substituta que o DESIGN.md da Wise indica para a Wise Sans. Peso **900** no destaque, **600** no resto, **400** em texto corrido. Números sempre tabulares (já está no `body`). Sem fonte mono, sem caixa alta.

| Classe | Tamanho | Peso | Altura | Uso |
|---|---|---|---|---|
| `text-display-mega` | 126 | 900 | 0,85 | Herói de marketing. |
| `text-display-xxl` | 96 | 900 | 0,85 | Sub-herói. |
| `text-display-xl` | 64 | 900 | 0,85 | Manchete, valor principal da tela. |
| `text-display-lg` | 48 | 900 | 0,85 | Título de tela, saudação, totais. |
| `text-display-md` | 40 | 900 | 0,85 | Título de seção, nome no detalhe. |
| `text-display-sm` | 32 | 600 | 1,2 | Cabeçalho de seção. |
| `text-display-xs` | 24 | 600 | 1,3 | Título de cartão. |
| `text-body-lg` | 20 | 400 | 1,5 | Parágrafo de abertura. |
| `text-body-md` | 16 | 400 | 1,5 | Texto padrão, nome em lista (com `font-semibold`). |
| `text-body-sm` | 14 | 400 | 1,43 | Secundário, menu e botão pequeno (com `font-semibold`). |
| `text-caption` | 12 | 400 | 1,33 | Legenda, cabeçalho de tabela. |
| `text-button` | 16 | 600 | 1,5 | Rótulo de botão. |

Os tamanhos `display-*` já trazem peso e entreletra; não é preciso somar `font-black`.

## 3. Forma e espaço

| Raio | Valor | Uso |
|---|---|---|
| `rounded-sm` | 8px | Linha de menu. |
| `rounded-md` | 12px | Campo de formulário. |
| `rounded-lg` | 16px | Bloco dentro de cartão. |
| `rounded-xl` | 24px | **Botão e cartão.** A assinatura da marca. |
| `rounded-pill` | total | Selo, filtro, botão (os botões usam pílula). |

Espaçamento na grade de 4px padrão do Tailwind. Recuo de cartão `p-6` (24px). Botão 48px de altura com 24px nas laterais; pequeno 40px. Alvo de toque mínimo 44px.

**Elevação sem sombra.** Profundidade vem da troca de superfície: sálvia embaixo, branco em cima. A única borda é a do campo (1px tinta) e a do cartão com contorno. A única sombra existente é `shadow-overlay`, só para modal e toast.

## 4. Superfícies

| Componente | Visual | Quando usar |
|---|---|---|
| `<Card>` | Branco sobre sálvia | O padrão de qualquer bloco. |
| `<Card variant="sage">` | Sálvia | Bloco dentro de área branca. |
| `<Card variant="pale">` | Verde-pálido | Momento positivo (recebido no mês). |
| `<Card variant="inverse">` | Verde-floresta com texto verde Wise | **Um destaque por tela**: "A receber", "Próximo vencimento". |
| `<Card variant="outlined">` | Branco com contorno tinta | Onde se digita: simulador, formulário principal. É o equivalente ao conversor de moedas da Wise. |

## 5. Componentes

**Botão** (`components/ui/button.tsx`)

| Variante | Visual | Uso |
|---|---|---|
| `primary` | Verde, texto tinta | Uma por tela. Novo contrato, Pagar, Confirmar. |
| `secondary` | Sálvia | Ações de apoio: Cobrar, Renegociar, Lembrar. |
| `tertiary` | Branco com contorno tinta | Alternativa neutra: Novo cliente, PDF, Ver planos. |
| `inverse` | Contorno claro | Ação secundária dentro de cartão invertido. |
| `danger` | Contorno vermelho | Excluir. Sempre com confirmação. |

Tamanhos `md` (48), `sm` (40), `icon` e `icon-sm` (circulares). O texto sobre o verde é **tinta, nunca branco**.

**Selo** (`components/ui/badge.tsx`) — mapeamento das situações do produto:

| Situação | `tone` |
|---|---|
| Em dia, Pago | `positive` (verde-pálido + verde-profundo) |
| Vence hoje | `warning` (amarelo + marrom) |
| Atrasado | `negative` (vinho + branco) |
| A vencer | `neutral` |
| Quitado | `ink` |
| Contador de atraso na barra lateral | `deep` (verde-floresta + verde claro) |
| Renegociada | `soft` |

**Campo** (`components/ui/field.tsx`) — rótulo 14/600 acima, contorno 1px tinta, canto 12, 48px (ou 56px com `size="lg"` para dinheiro). Foco: contorno de 2px tinta, sem halo. Erro: borda vermelha e uma frase que diz o que fazer ("Essa data não existe. Confira o dia e o mês.").

**Dinheiro** (`components/ui/money.tsx`) — valor em destaque com "R$" pequeno e apagado, inteiro em 900 e centavos em 600. Em listas e tabelas, use `formatBRL()` de `lib/format.ts` em texto normal.

**Parcelas** (`components/ui/installment-bar.tsx`) — cada parcela é um segmento: `paga` verde-floresta, `proxima` verde-neutro, `atrasada` vermelho, `futura` sálvia. Não usar barra lisa de porcentagem. Contrato longo (diário, semanal) vira um segmento por sequência do mesmo tipo, com a largura proporcional; passando de 24 sequências, o contrato é fatiado em blocos iguais e a cor do bloco prioriza atrasada e próxima.

**Andamento na lista de contratos** — não é a barra. A coluna **Parcelas** traz a fração em `text-display-xs` ("30/72", com o total em 14/600 apagado) e a coluna **Situação**, ao lado, traz o `Badge`: atraso em `negative` dizendo os dias, `positive` "Em dia", `ink` "Quitado". No celular as duas descem juntas para a linha de baixo do nome. A barra fica para o detalhe do contrato, onde há largura para ler parcela a parcela.

`ghost` (sem fundo) existe só para ícone de fechar e limpar busca.

**Demais componentes** — todos na vitrine `/design`, com seus estados.

| Onde | Componentes |
|---|---|
| `components/shell/` | `AppShell` (menu lateral no desktop, barra inferior no celular), `Sidebar`, `BottomNav`, `PageHeader`. Itens do menu em `nav.tsx`. |
| `components/ui/` | `Tabs` (troca conteúdo), `NavTabs` (troca a URL), `SegmentedControl` (escolha única em formulário), `FilterChip(s)`, `DataTable`, `Pagination` (páginas na URL), `EmptyState`, `MoneyInput`, `Select`, `Textarea`, `Switch`, `RadioCard`, `Modal`, `ConfirmDialog`, `Toast` (`useToast`), ícones em `icons.tsx`. |
| `components/domain/` | `StatCard` (número em destaque, em linha no topo da tela), `BalanceBar`, `InstallmentRow`, `ContractRow`, `ClientAvatar` (anel de score), `ClientSearch`, `MessagePreview`, `MonthlyFlow` (entrou × saiu por mês), `TimelineRow` (linha do histórico). |

**Paginação** (`Pagination`) fica logo abaixo da lista, some sozinha quando tudo cabe numa página e guarda a página na URL (`?pagina=`), junto com a busca e os filtros da tela. No celular, só as setas e "3 de 6"; da largura `sm` em diante, os números com reticências.

**Dinheiro digitado** (`MoneyInput`) formata da esquerda para a direita: 1000 vira 1.000, e os centavos só entram depois da vírgula. Não usar a máscara de centavos do Jurex.

## 6. Padrões de tela

- **Menu lateral** branco, solto da borda como cartão (`rounded-xl`, 16px de folga), linhas de 44px com `rounded-sm`, indicador verde de 4px na linha ativa, texto 14/600. Contador de atraso em selo vinho.
- **Menu recolhido** (72px, só ícones): automático abaixo de 1280px; o botão ao lado do logo força aberto ou fechado e a escolha fica no cookie `menu`. Recolhido, o nome aparece ao passar o mouse, o atraso vai para cima do ícone e o cartão do plano some. Use a variante `compacto:` para o que muda nesse estado.
- **Tabela** com cabeçalho em sálvia e `text-caption`, linhas em `text-body-sm`, divisória `canvas-soft`, recuo 12×16.
- **Abas** em trilho sálvia com a peça ativa branca, tudo em pílula. **Filtros** em pílula; o selecionado fica em tinta.
- **Linha de parcela**: prazo à esquerda, nome e contrato, valor, ações à direita (Cobrar sálvia + Pagar verde). Parcela paga fica com o valor riscado e o selo Pago.
- **Rodapé fixo no celular** com a ação principal em largura cheia.
- **Texto** escrito como gente: "Vence hoje", "4 dias atrasada", "Tudo em dia". Nada de "status: pending".

## 7. Regras

**Faça**

1. Reserve o verde Wise para a ação principal. Um botão verde por tela.
2. Manchetes e números grandes em peso 900, altura 0,85. Nunca mais leve.
3. Canto de 24px em botão e cartão.
4. Sálvia embaixo, branco em cima. A troca de superfície é a elevação.
5. Situação com a paleta própria (positivo, alerta, negativo). Pago é verde-pálido com texto verde-profundo.

**Não faça**

1. Segunda cor de marca. Pêssego e ciano só em ilustração.
2. Título em peso 700 ou mais leve.
3. Botão retangular ou de canto pequeno.
4. Verde sobre verde. O verde Wise fica sobre sálvia, branco ou tinta.
5. Sombra em cartão, texto em caixa alta, fonte mono, cor fora dos tokens (`#hex` solto ou `bg-[...]`).
6. Tema escuro. A identidade é clara; o escuro aparece só como superfície invertida pontual.
