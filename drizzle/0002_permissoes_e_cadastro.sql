-- O app conecta como postgres e troca para kaderno_app dentro de cada transação.
grant kaderno_app to postgres;
--> statement-breakpoint
grant usage on schema public, privado to kaderno_app;
--> statement-breakpoint
grant execute on function privado.conta_atual(), privado.usuario_atual() to kaderno_app;
--> statement-breakpoint
grant select, insert, update, delete on
  contas, usuarios, membros, clientes, contratos, recebimentos, parcelas, eventos, idempotencia
to kaderno_app;
--> statement-breakpoint
grant usage on sequence eventos_id_seq to kaderno_app;
--> statement-breakpoint

-- Nada disso é lido pelo navegador: a Data API não enxerga estas tabelas.
revoke all on
  contas, usuarios, membros, clientes, contratos, recebimentos, parcelas, eventos, idempotencia
from anon, authenticated;
--> statement-breakpoint

-- Usuário apagado no Supabase Auth leva o perfil junto (e, pela cascata, a participação na conta).
alter table usuarios
  add constraint usuarios_id_auth_users_fk foreign key (id) references auth.users (id) on delete cascade;
--> statement-breakpoint

-- Cadastro: quem cria login ganha perfil, uma conta própria e vira dono dela, na mesma transação.
-- O nome vem do formulário de cadastro; serve só para exibir, nunca para dar permissão.
create or replace function privado.criar_conta_do_usuario() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  nome_usuario text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'nome'), ''), split_part(new.email, '@', 1));
  nova_conta uuid;
begin
  insert into public.usuarios (id, nome, email) values (new.id, nome_usuario, new.email);
  insert into public.contas (nome) values (nome_usuario) returning id into nova_conta;
  insert into public.membros (conta_id, usuario_id, papel) values (nova_conta, new.id, 'dono');
  return new;
end;
$$;
--> statement-breakpoint
revoke all on function privado.criar_conta_do_usuario() from public, anon, authenticated;
--> statement-breakpoint
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function privado.criar_conta_do_usuario();
