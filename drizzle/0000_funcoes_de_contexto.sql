-- Esquema privado: fica fora da Data API do Supabase e guarda as funções internas.
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
--> statement-breakpoint

-- A conta e o usuário da transação atual, gravados por lib/db/conexao.ts (comConta).
-- Sem valor gravado, devolvem null e nenhuma política deixa linha passar.
create or replace function privado.conta_atual() returns uuid
language sql stable
set search_path = ''
as $$ select nullif(current_setting('app.conta_id', true), '')::uuid $$;
--> statement-breakpoint

create or replace function privado.usuario_atual() returns uuid
language sql stable
set search_path = ''
as $$ select nullif(current_setting('app.usuario_id', true), '')::uuid $$;
