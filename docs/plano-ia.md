# Plano da IA e do WhatsApp

Documento de referência para quando formos ligar a IA e o bot de WhatsApp. **Nada daqui é feito agora.** Hoje só construímos a base descrita em [`plano-backend.md`](./plano-backend.md), no formato que este plano precisa.

Escrito em 12/09/2026.

---

## 1. O que o bot faz

O dono da conta conversa com um número de WhatsApp dedicado e faz **tudo que faz no app**, principalmente:

- criar contrato ("emprestei 1.000 pro João em 3x, 10% ao mês, começa dia 20");
- lançar pagamento ("o João pagou a parcela de hoje no Pix", foto do comprovante);
- registrar envio do dinheiro ("mandei os 1.000 do João");
- consultar ("quem vence hoje?", "quanto a Juliana me deve?", "como foi o mês?");
- cadastrar e editar cliente, renegociar parcela.

Decisões já tomadas:

- O bot fala **só com usuários da conta**, nunca com os clientes finais (a não ser para enviar cobrança, quando pedido).
- **Um chip por conta**, conectado na uazapi por QR code.
- Envio de dinheiro é **só registro**.
- O sistema é **multi-tenant**.

## 2. Princípios

1. **A IA não acessa o banco.** Ela só chama as operações de negócio que o app web já usa. Não existe ferramenta de SQL.
2. **A IA não decide de quem é o dado.** Conta e usuário vêm do servidor (qual chip recebeu, qual número mandou). Nenhum parâmetro de ferramenta aceita `contaId`.
3. **A IA não grava sozinha.** Ela prepara; quem grava é o botão Confirmar, executado pelo servidor sem passar pela IA.
4. **Tudo que vem de fora é dado, não ordem.** Nome de cliente, observação, texto de comprovante e mensagens encaminhadas podem conter instruções escondidas. O limite de segurança é a arquitetura (itens 1 a 3), não o prompt.
5. **Independente de modelo.** As ferramentas saem do contrato zod das operações. Trocar de modelo muda o adaptador, não as regras.

## 3. Visão geral

```
WhatsApp do dono
      │ mensagem (texto, áudio, imagem, clique em botão)
      ▼
uazapi ── webhook ──► /api/whatsapp/webhook/[conexao]
                          │ 1. confere segredo e conexão → contaId
                          │ 2. confere número autorizado → usuarioId
                          │ 3. descarta repetida (id da mensagem)
                          │ 4. responde 200 rápido e enfileira
                          ▼
                    processador da mensagem
                          │ clique em Confirmar/Cancelar? ──► executa ação pendente (sem IA)
                          │ áudio → transcrição   imagem → anexo
                          ▼
                    agente (modelo de IA + ferramentas)
                          │ leitura  → roda na hora, resultado volta pro modelo
                          │ gravação → vira "ação pendente" + resumo com botões
                          ▼
                    lib/operacoes/*  (as mesmas do app web)
                          │
                    Postgres (RLS por conta)  +  eventos (origem: whatsapp)
                          ▼
uazapi ◄── resposta (texto ou menu com botões)
```

## 4. As peças

### 4.1 Registro de operações (já vem da base)

Cada operação em `lib/operacoes/` declara: nome, descrição, tipo (`leitura` · `gravacao` · `perigosa`), schema de entrada e de saída em zod, e a função. Um índice único junta todas.

É a única peça que cresce a cada módulo do app. As demais são escritas uma vez.

### 4.2 Adaptador de ferramentas

Lê o registro e entrega ao modelo a lista de ferramentas (nome, descrição, JSON Schema gerado do zod).

- Não expõe operações que o papel do usuário não pode usar.
- Não expõe parâmetros de contexto (`contaId`, `usuarioId`, `origem`); o adaptador injeta.
- Ferramenta `perigosa` pode ficar fora do bot no começo (excluir só pelo app).
- Lista em ordem fixa, para aproveitar cache de prompt.

Exemplo com Claude: o SDK TypeScript aceita ferramentas definidas direto com zod (`betaZodTool`) e roda o laço de chamadas (Tool Runner), com ganchos por turno para interceptar gravações. Outro modelo usaria o JSON Schema gerado.

### 4.3 Agente

- Prompt de sistema estável: quem é o bot, tom (curto, português do dia a dia), data e fuso de hoje, regras (sempre confirmar antes de gravar, perguntar quando houver ambiguidade, nunca inventar valor ou cliente).
- Histórico curto da conversa (últimas mensagens + ação pendente), não a vida inteira.
- Limite de voltas por mensagem (ex.: 8 chamadas de ferramenta) e tempo máximo.
- Quando a ferramenta devolve erro de validação, o modelo repassa em linguagem simples e pergunta de novo.

### 4.4 Ações pendentes e confirmação

Quando o modelo chama uma operação de `gravacao`:

1. O adaptador **não executa**. Roda a prévia (`simularContrato`, `previaRecebimento`…) para validar e calcular.
2. Grava em `bot_acoes_pendentes`: operação, entrada já validada, resumo, validade (10 min), quem pediu.
3. Envia o resumo com botões **Confirmar** / **Cancelar** (menu interativo da uazapi).
4. No clique, o servidor carrega a ação pelo id, confere que é do mesmo usuário e ainda vale, e executa a operação com chave de idempotência. A IA não participa.
5. Responde com o resultado ("Contrato #0043 criado. Primeira parcela dia 20/09.").

Uma ação pendente por conversa; um novo pedido de gravação substitui a anterior, avisando.

### 4.5 Canal WhatsApp (uazapi)

- Uma conexão por conta, criada pelo app (tela de perfil: gerar QR, ver situação, desconectar).
- Webhook com segredo por conexão; token da instância guardado criptografado.
- Mensagens do próprio bot e de números não autorizados são ignoradas (sem resposta, para não revelar que é um bot).
- Envio com fila e ritmo controlado. A uazapi não é a API oficial do WhatsApp: evitar disparo em massa reduz o risco de bloqueio do chip.

### 4.6 Áudio e imagem

- **Áudio:** baixar da uazapi, transcrever, tratar como texto. Guardar a transcrição junto da mensagem.
- **Comprovante (imagem ou PDF):** enviar ao modelo com visão. Ele extrai valor, data, pagador e sugere a parcela. O arquivo vai para o Storage da conta e fica ligado ao recebimento quando confirmado.
- O que foi lido do comprovante é **sugestão**; sempre passa pela confirmação.

### 4.7 Avisos que partem do bot

Sem conversa: tarefas agendadas por conta.

- Resumo da manhã para o dono: vence hoje, atrasados, recebido ontem.
- Cobrança aos clientes finais (lembrete, vence hoje, atraso) com os modelos de `lib/mensagens.ts`, **só se o dono ligar** e com limite diário.

Não usam IA: são textos prontos preenchidos por operações de leitura.

### 4.8 MCP (opcional, depois)

Se quiser que o sistema seja usado de dentro do Claude, ChatGPT ou outro agente, publicar o mesmo registro de operações como servidor MCP em `/api/mcp`, com login OAuth da conta. Mesmas regras de confirmação e contexto. Não é necessário para o bot.

## 5. Fluxos principais

**Criar contrato**
1. "emprestei 1000 pro joão em 3x 10% começa dia 20"
2. `buscarClientes("joão")` → dois candidatos → bot pergunta qual.
3. `simularContrato(...)` → valores.
4. Chamada a `criarContrato` vira ação pendente → "R$ 1.000 para João Silva, 3x de R$ 366,67 (juros sobre o total), mensal, 1ª em 20/09. Registrar também que o dinheiro saiu hoje por Pix? [Confirmar] [Cancelar]"
5. Confirmar → contrato criado, repasse registrado, evento com origem `whatsapp`.

**Lançar pagamento**
1. Foto do comprovante + "joão pagou"
2. Modelo lê R$ 366,67, 12/09. `parcelasEmAberto("João Silva")` → sugere parcela 1 do #0043.
3. `previaRecebimento` → ação pendente → "Baixa da parcela 1/3 do #0043, R$ 366,67 via Pix em 12/09? [Confirmar] [Cancelar]"
4. Confirmar → recebimento gravado, comprovante anexado.

**Registrar envio do dinheiro**
1. "mandei os 1000 do joão"
2. Acha contrato do João sem repasse registrado. Se houver mais de um, pergunta. Se não houver, oferece criar contrato.
3. Ação pendente → Confirmar → `registrarRepasse`.

**Consulta**
"quem tá atrasado?" → `parcelasAtrasadas()` → resposta curta, com no máximo 10 itens e oferta de mandar o resto.

## 6. Segurança

| Risco | Proteção |
|---|---|
| Uma conta ver dado de outra | Contexto vem do servidor; RLS por conta; FKs compostas; teste de isolamento rodando também pelo caminho do bot. |
| Instrução escondida em dado ou comprovante | IA sem SQL; gravação só via confirmação fora da IA; ferramentas perigosas fora do bot. |
| Estranho mandando mensagem pro chip | Só números autorizados da conta; resto ignorado. |
| Celular do dono na mão de outro | Excluir só pelo app; limite de valor por confirmação configurável; histórico com origem; desconectar número pelo app. |
| Webhook falso | Segredo por conexão; conferir que a instância bate com a conexão. |
| Mensagem processada duas vezes | Id da mensagem único; idempotência nas gravações. |
| Bloqueio do chip | Fila com ritmo; cobrança só ligada pelo dono; limite diário. |
| Custo descontrolado | Limite de voltas e de mensagens por conta por dia; registro de tokens por conversa. |

## 7. Tabelas novas (só quando for implementar)

| Tabela | O que guarda |
|---|---|
| `whatsapp_conexoes` | Conta, instância da uazapi, token criptografado, segredo do webhook, número do chip, situação. |
| `whatsapp_numeros_autorizados` | Número → usuário da conta. |
| `bot_mensagens` | Id da mensagem (único), direção, tipo, texto/transcrição, anexo, quando. |
| `bot_conversas` | Histórico curto por usuário, última atividade. |
| `bot_acoes_pendentes` | Operação, entrada validada, resumo, validade, situação (pendente, confirmada, cancelada, expirada). |
| `bot_uso` | Tokens e custo por conta/dia, para limite e cobrança. |

## 8. Modelo de IA

A arquitetura não depende do modelo. Critérios para escolher na hora:

- Chamada de ferramentas confiável em português, com visão (comprovantes).
- Custo por conversa concluída, não por requisição.
- Latência aceitável no WhatsApp (resposta em poucos segundos).

Se for Claude: começar com Claude Opus 5 (`claude-opus-5`) e medir; baixar o nível de esforço (`effort`) para conversas rotineiras antes de pensar em trocar de modelo. Usar cache de prompt no prompt de sistema e na lista de ferramentas, que são fixos. Confirmar modelos, preços e parâmetros na documentação do dia; isso muda rápido.

**Avaliação antes de ligar para clientes reais:** uma planilha com 50 a 100 frases reais ("o zé pagou metade", "joga a parcela pro mês que vem") e o que deveria acontecer. Rodar a cada mudança de prompt, ferramenta ou modelo.

## 9. Ordem de implementação

1. **Conexão:** tela de conectar chip (QR), webhook recebendo e registrando mensagens, número autorizado. Sem IA; responde "recebido".
2. **Consultas:** agente com ferramentas só de leitura. Avaliação com frases de consulta.
3. **Gravações com confirmação:** ações pendentes, botões, criar cliente, contrato, pagamento, repasse, renegociação.
4. **Mídia:** áudio e comprovante.
5. **Avisos:** resumo da manhã e cobrança automática opcional.
6. **MCP** (se fizer sentido).

## 10. O que a base precisa ter para isso funcionar

Checklist para cada módulo do app, verificado por teste automático:

- [ ] Operação no registro, com nome, descrição e tipo.
- [ ] Entrada e saída em zod, com descrição nos campos; gera JSON Schema válido.
- [ ] Recebe dados simples (não FormData) e devolve `{ ok, dados }` ou `{ ok: false, erros }` com mensagens claras.
- [ ] Contexto (`contaId`, `usuarioId`, `origem`) recebido do servidor, fora da entrada.
- [ ] Gravação tem prévia sem efeito colateral e aceita chave de idempotência.
- [ ] Busca por texto solto e referência humana (nome, `#0042`, "parcela 2").
- [ ] Resposta com nomes legíveis e lista paginada.
- [ ] Gera evento com origem.
- [ ] Dá para fazer tudo do módulo só chamando operações, sem abrir a tela.

## 11. Em aberto

- Quem paga a IA: incluso no plano, pacote de mensagens ou cobrança por uso?
- Limite de valor para confirmar pelo WhatsApp sem passar pelo app?
- O bot pode excluir alguma coisa, ou exclusão fica só no app?
- Cobrança automática aos clientes finais entra no produto ou fica manual?

Fontes: [Domain-Oriented Tooling Pattern (arXiv)](https://arxiv.org/html/2608.22063v1), [Anthropic: Writing effective tools for agents](https://www.anthropic.com/engineering/writing-tools-for-agents), [NCSC: prompt injection](https://www.ncsc.gov.uk/blog-post/prompt-injection-is-not-sql-injection), [uazapi: enviar mensagem](https://docs.uazapi.com/tag/Enviar%20Mensagem), [vercel/mcp-handler](https://github.com/vercel/mcp-handler).
