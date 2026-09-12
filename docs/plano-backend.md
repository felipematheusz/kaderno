# Plano do backend

Decidido em 12/09/2026:

- **Agora: só o backend do app web.** Nada de WhatsApp nem de IA nesta fase.
- A base é feita **pensando no futuro**: um bot de WhatsApp (uazapi) com IA vai fazer tudo que o app faz. Quando chegar a hora, a IA precisa só "ligar" nas operações que já existem, sem reescrever regra.
- **Multi-tenant.** Cada conta (tenant) é isolada. Todo dado pertence a uma conta, não a uma pessoa, para a conta poder ter mais de um usuário depois sem refazer o banco.
- Login no web com **e-mail e senha** (Supabase Auth).
- **Envio de dinheiro é só registro.** Nada de transferência de verdade.

Já decidido para o futuro, só para orientar a base: o bot fala só com quem é da conta, um chip por conta dedicado ao bot.

---

## 1. Um núcleo, várias portas

```
   app web (hoje)                  IA / bot (futuro)
   lib/acoes.ts                    ferramentas geradas das operações
   FormData → operação             JSON da IA → operação
          │                                 │
          └──────────────┬──────────────────┘
                         │
          lib/operacoes/*  ← contrato de entrada e saída (zod)
                             + regra + validação + gravação
                         │
                  Postgres (Supabase)
```

- `lib/contrato.ts` e `lib/emprestimos.ts` continuam: são a conta pura (simulação, parcelas, situação).
- A validação que hoje mora em `lib/acoes.ts` desce para as operações. O formulário vira só uma ponte: transforma o FormData, chama a operação, mostra o erro ou redireciona.
- `lib/dados.ts` deixou de ser memória de mentira: virou a ponte de **leitura** do app web (cada função chama uma operação). `lib/acoes.ts` é a ponte de **gravação**. Os nomes ficaram iguais, então nenhuma tela precisou mudar.

## 2. Como a IA vai se conectar (pesquisa de 12/09/2026)

**Nem banco direto, nem API genérica. A IA usa operações de negócio.**

- **SQL gerado pela IA: descartado.** A IA pode ser enganada por texto dentro dos próprios dados (nome de cliente, observação) e montar consulta que vaza ou apaga dado. Num sistema multi-tenant isso é inaceitável. Instruções no prompt não bastam; o limite precisa ser da arquitetura.
- **API REST de tabelas (CRUD): fraca para IA.** A IA teria que juntar cliente + contrato + parcela sozinha, lidar com ids e repetir regra de negócio. Erra mais e gasta mais.
- **Operações de domínio: o padrão recomendado.** Em estudo recente, modelos pequenos passaram de 58% para 93% de acerto trocando SQL por ferramentas de domínio bem desenhadas, com 2 a 12 vezes menos tokens. Ferramenta genérica mal desenhada foi pior até que SQL.
- **MCP é só a "tomada".** É o protocolo padrão para expor ferramentas a qualquer modelo (Claude, GPT, Gemini). Ele não substitui as operações; ele as publica. Para um bot próprio no servidor, chamar as operações direto como ferramentas é mais simples; MCP vale quando quiser que clientes externos (Claude, ChatGPT, outro agente) usem o sistema.

Como fica aqui:

```
lib/operacoes/*  (regra + contrato zod + checagem de conta)
      ├── app web: server actions (agora)
      ├── bot WhatsApp: ferramentas chamadas no próprio servidor (futuro)
      ├── servidor MCP em /api/mcp (futuro, opcional)
      └── API REST (só se outro sistema precisar)
```

Regras de segurança que valem para qualquer porta:

- A conta e o usuário **vêm do servidor** (login ou conexão do WhatsApp), nunca de parâmetro que a IA preenche.
- Não existe ferramenta de SQL livre.
- Gravação passa por confirmação fora da IA; exclusão é "perigosa".
- Toda chamada fica registrada em `eventos`.
- Operações visíveis conforme o papel do usuário.

Fontes: [Domain-Oriented Tooling Pattern (arXiv)](https://arxiv.org/html/2608.22063v1), [Anthropic: Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), [NCSC: prompt injection is not SQL injection](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection), [Prompt-to-SQL injections (ICSE)](https://syssec.dpss.inesc-id.pt/papers/pedro_icse25.pdf), [MCP vs REST para agentes](https://gingerlabs.ai/blog/mcp-vs-rest-api), [vercel/mcp-handler](https://github.com/vercel/mcp-handler).

## 3. O que deixa a base pronta para a IA

Isso tudo serve ao app hoje e evita retrabalho quando a IA chegar.

1. **Toda operação é uma função com contrato declarado.** Nome, descrição em português, schema de entrada e de saída em zod, com descrição em cada campo. Dessas definições sai, no futuro, a lista de ferramentas da IA (JSON Schema), qualquer que seja o modelo, sem escrever nada à mão.
2. **Entrada em dados simples, não em FormData.** Número é número, data é `"2026-09-20"`, enum é texto conhecido. Um formulário e uma IA mandam a mesma coisa.
3. **Resultado estruturado, nunca redirect nem exceção solta.** `{ ok: true, dados }` ou `{ ok: false, erros: { campo: "mensagem clara" } }`. O formulário mostra no campo; a IA lê e pergunta de novo ao usuário.
4. **Separar "calcular" de "gravar".** Existe `simularContrato` (não grava nada) além de `criarContrato`. Vale também para baixa (`previaRecebimento`) e edição. É o que permite mostrar o resumo antes de confirmar, no app e no bot.
5. **Busca por texto solto.** `buscarClientes("joao")` sem acento, por nome, apelido, telefone ou CPF parcial, devolvendo candidatos. A IA quase nunca recebe um id; recebe um nome.
6. **Leituras pensadas como pergunta.** "O que vence hoje", "quem está atrasado", "quanto o cliente X me deve", "resumo do contrato #0042". Hoje as telas já precisam disso; ficam como operações próprias, não espalhadas pelas páginas.
7. **Referências humanas aceitas.** Contrato por número (`#0042`) além do id; parcela por "contrato + número da parcela".
8. **Toda gravação registra quem fez e por onde** (`origem: web | whatsapp | ia`). O histórico e a auditoria já nascem prontos.
9. **Chave de idempotência nas gravações.** Uma mesma requisição repetida (clique duplo hoje, reenvio do WhatsApp amanhã) não cria duas vezes.
10. **Operações classificadas** em `leitura`, `gravação` e `perigosa` (excluir). O bot futuro usa isso para decidir o que roda direto e o que pede confirmação; hoje o app usa para pedir confirmação ao excluir.
11. **Poucas operações fortes, não muitas pequenas.** `registrarPagamento` acha a parcela certa pelo contrato, em vez de a IA ter de listar parcelas e escolher.
12. **Respostas legíveis e enxutas.** Nome do cliente e `#0042` junto com o id; listas paginadas com limite padrão; erro que diz o que fazer ("Existem 2 clientes João: João Silva e João Prado. Qual?").

O que **não** entra agora: webhook, uazapi, conversas, modelo de IA, fila de mensagens, tabelas do bot.

## 4. Como o código fala com o banco

**Recomendação: Drizzle ORM com conexão direta ao Postgres do Supabase, só no servidor.**

Por quê:

- O bot futuro chega por webhook, **sem sessão de usuário**. Com supabase-js ele precisaria da chave secreta, que ignora o RLS. Com conexão direta, web e bot usam o mesmo caminho.
- Criar contrato, dar baixa e editar mexem em várias linhas. Com conexão direta dá para usar **transação**: grava tudo ou nada, reaproveitando a conta que já existe em TypeScript.
- Tipagem forte a partir do schema, sem `any`.

Sendo multi-tenant, **vazar dado entre contas é o pior erro possível**. Por isso a proteção fica em camadas:

- **Contexto obrigatório.** Toda operação recebe `{ contaId, usuarioId, origem }` como primeiro argumento. No web, sai do login (`getClaims`) + tabela `membros`. No futuro bot, sai da conexão do WhatsApp.
- **RLS por conta dentro da transação.** Cada operação abre transação, grava a conta em `app.conta_id` e troca para o papel `kaderno_app` (`set local role`), que **não** ignora RLS. As políticas comparam `conta_id` com esse valor. Se uma operação esquecer o filtro, o banco não devolve linha de outra conta. Sem conta gravada, não devolve nada. (Implementado assim em vez de um segundo usuário de banco com senha: uma conexão só, nenhum segredo a mais.)
- **Chaves estrangeiras compostas** `(conta_id, id)`: uma parcela não aponta para contrato de outra conta nem por engano.
- Tabelas **sem acesso pela Data API**. Ninguém lê nada direto do navegador.
- Teste automático: usuário da conta A nunca lê nem grava dado da conta B.

Alternativa descartada: supabase-js com RLS no web. Funciona hoje, mas o bot precisaria de outro caminho de acesso e as gravações de várias linhas virariam funções SQL.

## 5. Tabelas

Dinheiro em `numeric(12,2)`, vencimentos em `date`, ids `uuid`. Toda tabela de dados tem `conta_id` (primeira coluna dos índices).

| Tabela | O que guarda |
|---|---|
| `contas` | O tenant: nome, plano, próximo número de contrato. |
| `usuarios` | Perfil ligado ao usuário do Auth: nome, telefone, avisos. |
| `membros` | Quem é de qual conta e com qual papel (`dono` por enquanto). Ao se cadastrar, a pessoa cria a conta e vira dona dela. |
| `clientes` | Nome, apelido, CPF, telefone, e-mail, endereço, score, desde. |
| `contratos` | O que já existe + **repasse**: `repassado_em`, `canal_repasse`. Número `#0042` único por conta. |
| `parcelas` | Número, vencimento, valor, pago, pago_em, valor_recebido, detalhe, observação, renegociada, recebimento. |
| `recebimentos` | Os recibos: valor, forma, canal, data, parcela e contrato. |
| `eventos` | Tudo que foi gravado: operação, quem fez, origem, antes/depois. Base do histórico. |
| `idempotencia` | Chave e resultado das gravações recentes, para não repetir. |

Anexos (documentos do cliente, comprovantes) vão para o Supabase Storage, em pasta privada por conta.

Excluir cliente apaga contratos, parcelas e recebimentos dele em cascata. Hoje a versão de mentira esquece os recibos.

### Envio de dinheiro (registro)

Hoje o dinheiro "sai" na data de criação do contrato. Proposta:

- Ao criar o contrato, o repasse é registrado junto (data e canal), podendo mudar depois.
- Operação própria `registrarRepasse`, para o futuro "mandei os 1.000 do João por Pix".
- O relatório de fluxo passa a usar `repassado_em` como saída.

## 6. Ordem de trabalho

**Situação em 12/09/2026:** passos 1 a 5 feitos. O teste `pnpm testar:operacoes` roda contra o banco e confere as operações principais e o isolamento entre contas. Pendências no fim desta seção.

1. Instalar: `@supabase/ssr`, `@supabase/supabase-js`, `drizzle-orm`, `postgres`, `drizzle-kit`, `zod` (versões fixas).
2. Schema Drizzle + migração, aplicada no projeto Supabase.
3. Login, cadastro, sair e esqueci a senha; `proxy.ts` renovando a sessão; área `(app)` protegida.
4. Operações com contrato zod, na ordem: clientes → contratos (simular/criar/editar/excluir) → parcelas (prévia/receber/renegociar) → repasse → leituras de painel, relatório e histórico.
5. `lib/acoes.ts` vira ponte; telas lendo do banco; `lib/dados.ts` removido. Dados de exemplo viram script de semente opcional.
6. Conferir: criar, editar, receber, renegociar e excluir pelo app; teste de isolamento entre contas; advisors do Supabase sem alerta.

Pendências da etapa 1:

- Prévia de recebimento (`previaRecebimento`) como operação. Hoje a tela calcula a prévia sozinha; a IA vai precisar dela no servidor.
- Campo de envio do dinheiro (data e canal) no formulário de contrato. A operação já aceita; sem o campo, o relatório usa o dia do contrato.
- Script de semente com dados de exemplo para conta nova.
- Leituras carregam a carteira inteira por pedido. Bom para centenas de contratos; filtrar no banco quando crescer.
- Modelo dos e-mails do Supabase em português e a URL do site configurada no painel.

## 7. Futuro (não fazer agora)

Detalhado em [`plano-ia.md`](./plano-ia.md). Quando for a hora do WhatsApp, a base acima já cobre as regras. Vai faltar: conexão com a uazapi por conta, webhook, números autorizados, estado da conversa com ação aguardando confirmação, registro de mensagens recebidas e a escolha do modelo de IA.

## 8. Em aberto

- **Projeto Supabase:** as chamadas ao banco dão tempo esgotado (projeto `dlpdyzyyxjgywmzxgycu`). Pode estar pausado.
- **Limite do plano** ("Plano Pro, 25 contratos") hoje é fixo na tela. Continua fixo por enquanto?
- **Painel da plataforma** (ver todas as contas, bloquear, planos)? Não entra agora.
