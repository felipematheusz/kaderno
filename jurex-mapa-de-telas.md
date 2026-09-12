# Mapa de Telas do Jurex

Levantamento de todas as rotas da área do usuário de **jurexbrasil.com** — título exibido na tela e o que cada página faz.

| | |
|---|---|
| **Páginas mapeadas** | 34 |
| **Áreas** | 8 |
| **Rotas /admin** | 7 (fora do escopo) |
| **Arquitetura** | SPA React Router (bundle único) |
| **Levantado em** | 11/09/2026 |

Feito percorrendo o app em produção com um cliente e um contrato de teste (R$ 1.000 em 3x, 10% a.m.), depois removidos.

---

## Painel

### `/` — Início — "Bem-vindo(a) ao seu painel"

Visão geral da operação. Cartão principal com **Total emprestado**, **Recebido** e **A receber**, com selo de situação ("Tudo em dia") e botão de olho para ocultar os valores. Abaixo, faixa para ativar notificações push, bloco "Parcelas de hoje", atalhos rápidos e a lista de contratos ativos com progresso de pagamento.

- Totais emprestado / recebido / a receber
- Ocultar valores
- Parcelas de hoje
- Acesso rápido: Contratos, Parcelas, Histórico, Suporte
- Contratos ativos com "x de n parcelas pagas"

---

## Clientes

### `/clientes` — Clientes

Lista de todos os clientes cadastrados, com contador no topo. Cada cartão mostra inicial ou foto, nome, score de crédito, telefone e quantidade de contratos. Estado vazio convida a cadastrar o primeiro cliente.

- Contador de cadastrados
- Cartão por cliente
- Score visível na lista
- Botão Cadastrar cliente

### `/clientes/novo` — Novo cliente

Formulário de cadastro: nome completo, foto, CPF (opcional), telefone, e-mail e endereço. Permite anexar documentos do cliente e definir o score de crédito.

- Foto do cliente
- CPF opcional
- Anexo de documentos
- Score de crédito

### `/clientes/:id` — Perfil do cliente

Ficha completa: data de cadastro ("cliente desde"), score, quanto foi emprestado e quanto já foi recebido dele, dados de contato e endereço. Traz a lista de contratos vinculados, os documentos anexados e as ações de editar e excluir — a exclusão remove também todos os contratos e parcelas ligados ao cliente.

- Emprestado × recebido por cliente
- Contratos vinculados
- Documentos
- Editar / Excluir

### `/clientes/:id/editar` — Editar cliente

Mesmo formulário do cadastro, preenchido com os dados atuais e encerrado por "Salvar alterações".

- Reaproveita o formulário de cadastro
- Salvar alterações

---

## Contratos e vendas

> A mesma rota atende dois produtos: empréstimo (padrão) e venda parcelada, alternados pelas abas "Contratos" e "Vendas".

### `/contratos` — Contratos

Lista dos contratos com contador e filtros por situação. As abas no topo trocam a listagem entre empréstimos e vendas — a aba Vendas muda a URL para `?modo=venda`, o título para "Vendas" e o botão para "Nova venda".

- Abas Contratos / Vendas
- Filtros: Todos, Em dia, Atrasados, Quitados
- Novo contrato

### `/contratos/novo` — Novo contrato

Montagem do empréstimo: busca do cliente por nome ou CPF, valor emprestado, tipo (valor fixo ou com juros), taxa ao mês, número de parcelas e se o juro informado é por parcela ou sobre o total. Define ainda a cobrança de juros em atraso, a frequência (diária, semanal, quinzenal ou mensal), a data da primeira parcela e uma observação. O rodapé calcula em tempo real o valor da parcela, o total a receber e o lucro estimado.

- Busca de cliente
- Valor fixo × com juros
- Juro por parcela ou sobre o total
- Juros em atraso
- Frequência diária a mensal
- Prévia: parcela, total, lucro

### `/contratos/novo?tipo=venda` — Nova venda

Variante do formulário para venda parcelada de produto ou serviço. Acrescenta nome do produto, entrada e o campo "Quanto você pagou" — custo de aquisição usado só para calcular o lucro, sem afetar as parcelas nem aparecer para o cliente.

- Nome do produto/serviço
- Custo interno (não aparece ao cliente)
- Entrada
- Lucro estimado

### `/contratos/sucesso` — Contrato criado com sucesso

Confirmação logo após a criação, com o número gerado do contrato, cliente, valor, número de parcelas e frequência. Oferece o envio imediato ao cliente por PDF ou WhatsApp. *Acessível apenas no fluxo de criação — aberta direto, redireciona para o início.*

- Número do contrato
- Compartilhar em PDF
- Enviar via WhatsApp

### `/contratos/:id` — Detalhe do contrato

Página central da operação. Cabeçalho com número e cliente, valor, selo de situação, juros, quantidade de parcelas e data de início; barra de progresso com parcelas pagas e total recebido; destaque do próximo vencimento. Abaixo, cada parcela vira um cartão com data, valor, status e três ações: **Cobrar** (mensagem pronta), **Renegociar** e **Pagar**.

- Progresso de pagamento
- Próximo vencimento
- Cobrar / Renegociar / Pagar por parcela
- PDF atualizado
- Enviar via WhatsApp
- Editar / Excluir

### `/contratos/:id/editar` — Editar contrato

Reabre o formulário de criação com os valores atuais e recalcula parcela, total e lucro conforme as mudanças, salvando com "Salvar alterações".

- Recalcula parcela e total
- Salvar alterações

---

## Parcelas e recebimentos

### `/parcelas` — Parcelas

Agenda de cobrança consolidada de todos os contratos, com o total de parcelas no topo e filtros por prazo e situação.

- Hoje / Amanhã / Atrasadas
- Por data
- A vencer / Pagas / Todas

### `/parcelas/:parcelaId/pagar` — Receber pagamento

Baixa de uma parcela. Mostra o total a receber, o cliente, o número da parcela e o vencimento, e oferece quatro formas de receber: pagar a parcela, só os juros, juros mais parte da dívida, ou quitar tudo. O valor recebido vem preenchido e pode ser ajustado antes de confirmar.

- Pagar a parcela
- Só os juros
- Juros + parte da dívida
- Pagar a dívida toda
- Valor recebido editável

### `/recebido` — Registrar pagamento (comprovante)

Confirmação exibida depois da baixa: número do contrato, parcela x/y, valor recebido, tipo de recebimento e data informada. Dali sai o comprovante em PDF ou o aviso de pagamento pelo WhatsApp. *Também depende do fluxo anterior; aberta direto, cai no início.*

- Comprovante em PDF
- Confirmar pagamento no WhatsApp
- Voltar ao contrato

### `/parcelas/:parcelaId/renegociar` — Renegociar parcela

Altera uma parcela específica: novo valor a receber, nova data de vencimento e um campo de observações para registrar os detalhes do acordo.

- Novo valor
- Nova data
- Observações do acordo

---

## Análise e acompanhamento

### `/relatorios` — Relatórios — visão financeira

Painel analítico em duas camadas. Em cima, os totais de emprestado, recebido, pendente e lucro, com recorte "Todos" ou "Em aberto". Embaixo, a projeção do que ainda entra — por este mês, 30 dias, 90 dias ou período personalizado, separando contratos de vendas — com total a receber, juros previstos, valor vencido e número de parcelas. Fecha com os gráficos de entrada × saída e evolução de recebimentos dos últimos 6 meses.

- Emprestado / Recebido / Pendente / Lucro
- Projeção por período
- Juros previstos e vencido
- Entrada × saída (6 meses)
- Evolução de recebimentos

### `/calendario` — Calendário

Os vencimentos distribuídos em um calendário mensal. Resumo com parcelas a vencer, vencidas e total do mês, alternando entre valor total e apenas juros e multas; clicar num dia abre as cobranças daquela data.

- A vencer / Vencidos / Total do mês
- Total × juros e multas
- Detalhe do dia selecionado

### `/historico` — Histórico financeiro

Linha do tempo de tudo que aconteceu na conta — cliente cadastrado, contrato criado (saída) e pagamento recebido (entrada) — com valor e data em cada evento.

- Entradas e saídas
- Eventos de cadastro e contrato
- Ordenado por data

### `/notificacoes` — Notificações

Central de avisos do app, com abas para todas e não lidas e a ação de marcar todas como lidas. Alimentada pelas notificações push ativadas no painel ou no perfil.

- Todas / Não lidas
- Marcar todas

---

## Conta e ajustes

### `/perfil` — Perfil

Dados e preferências do dono da conta: tema claro ou escuro, nome e telefone, troca de senha, ativação das notificações push e saída da conta.

- Tema claro / escuro
- Nome e telefone
- Trocar senha
- Notificações push
- Sair da conta

### `/planos` — Planos

Plano atual com o consumo em relação ao limite (no Free, 5 clientes e 5 contratos) e a comparação das opções: Free, Pro mensal, trimestral e anual, cada uma listando o que libera.

- Uso × limite do plano
- Free · Pro R$ 39,90/mês
- Trimestral R$ 99,90 · Anual R$ 398,90

### `/funcionarios` — Funcionários

Cadastro de funcionários com login próprio para acessar os clientes e contratos da conta. Recurso bloqueado enquanto não houver assinatura paga ativa.

- Login próprio por funcionário
- Exige assinatura paga

### `/ajustes/mensagens` — Mensagens (modelos de cobrança)

Editor dos cinco textos usados na hora de cobrar: lembrete amigável, vence hoje, cobrança de atraso, agradecimento e proposta de renegociação. As variáveis são inseridas com um toque e a pré-visualização usa os dados do primeiro contrato como exemplo; dá para voltar ao texto padrão.

- 5 modelos de cobrança
- Variáveis: `{nome}`, `{valor}`, `{vencimento}`, `{diasAtraso}`, `{total}`, `{acrescimo}`, entre outras
- Pré-visualização com dados reais
- Restaurar padrão

### `/ajustes/mensagens-contrato` — Modelos de contrato

Mensagens usadas no envio do contrato ou da venda ao cliente, já com resumo de valores, juros, frequência, parcelas e cronograma de vencimentos. Permite criar, editar e excluir modelos próprios.

- Resumo do contrato
- Resumo da venda
- Variável de cronograma
- Criar / Editar / Excluir modelo

### `/ajustes/backup` — Backup de dados

Exportação em PDF de contratos e clientes, filtrando por situação (todos, ativos ou quitados) e, opcionalmente, por período. Antes de gerar, informa quantos registros entram no arquivo.

- Exportar contratos
- Exportar clientes
- Filtro por status e período
- Prévia da contagem

---

## Ajuda e institucional

### `/suporte` — Suporte

Canais diretos de atendimento: e-mail e WhatsApp da equipe, com a promessa de resposta em poucos minutos.

- E-mail
- WhatsApp

### `/central-de-ajuda` — Central de ajuda

Página de apoio anunciando suporte 24/7 para dúvidas sobre contratos, cobranças e pagamentos. Hoje é só a chamada — ainda sem base de artigos.

- Suporte 24/7
- Sem artigos ainda

### `/sobre` — Sobre o Jurex

Apresentação do produto e da versão instalada — marcada como MVP 1.0.

- Versão MVP 1.0
- Descrição do produto

---

## Públicas e autenticação

> Ficam fora do layout com menu lateral. Login e redefinição de senha não puderam ser abertas durante o levantamento porque a sessão estava autenticada — nesse estado elas redirecionam para o painel.

### `/login` — Acesso à conta

Entrada no sistema, protegida por Cloudflare Turnstile (o script de verificação é carregado no site). *Redireciona para o painel quando já existe sessão ativa.*

- Login
- Verificação anti-bot

### `/reset-password` — Redefinir senha

Fluxo de recuperação de senha, aberto pelo link enviado por e-mail. *Também redireciona com a sessão ativa.*

- Nova senha por link

### `/privacidade` — Política de Privacidade do Jurex

Documento legal atualizado em 31/08/2026. Separa os dados da conta do usuário (nome, e-mail, telefone e senha criptografada) dos dados que o usuário insere sobre os próprios clientes, e explica como são coletados, usados e protegidos.

- Dados da conta × dados dos clientes
- Uso e proteção
- Atualizada em 31/08/2026

### `/termos-de-uso` — Termos de Uso do Jurex

Condições de uso do serviço, com a ressalva central de que o Jurex é ferramenta de apoio à gestão e não é parte nem fiador dos empréstimos registrados nele.

- Aceite dos termos
- Descrição do serviço
- Isenção de responsabilidade

### `/excluir-conta` — Como excluir sua conta do Jurex

Instruções para solicitar a exclusão da conta por e-mail, a partir do endereço cadastrado, e o detalhamento do que é apagado depois da confirmação. Página exigida pelas lojas de aplicativos.

- Solicitação por e-mail
- O que é excluído

### `*` (rota inexistente) — 404, Página não encontrada

Captura qualquer endereço fora da lista, com a mensagem "a rota que você buscou não existe" e o caminho de volta ao início.

- Fallback de rota
- Voltar ao início

---

## Notas técnicas

- **Aplicação de página única.** Todas as rotas são resolvidas no navegador por React Router a partir de um único bundle — não existe uma página por URL no servidor.
- **Três telas dependem do fluxo anterior.** `/contratos/sucesso` e `/recebido` só aparecem logo após criar um contrato ou dar baixa numa parcela; abertas diretamente, redirecionam para o início.
- **Área administrativa fora do escopo.** O sistema também tem `/admin/login`, `/admin`, `/admin/usuarios`, `/admin/usuarios/:id`, `/admin/planos`, `/admin/contratos` e `/admin/configuracoes` — não mapeadas aqui por não fazerem parte da área do usuário.
- **O histórico é imutável.** Depois de excluir o contrato e o cliente de teste, os três eventos correspondentes continuaram em `/historico`. Vale conferir se esse é o comportamento desejado.
- **Campos de dinheiro usam máscara da direita para a esquerda.** Digitar "1000" resulta em R$ 10,00 — é preciso digitar os centavos. Pode confundir na primeira vez.

---

*Levantado em 11/09/2026 percorrendo o app em produção, na conta de Felipe Matheus Santos de Moura. Os registros de teste criados para abrir as telas de detalhe foram excluídos ao final.*
