-- =====================================================================
--  ATUALIZAÇÃO 5 — Aluno inativo para de pagar; ao reativar, volta a pagar
-- =====================================================================
-- Inativou: apaga só as mensalidades NÃO pagas (as pagas continuam no histórico dele).
-- Ativou de novo (ou matrícula aprovada): cria a mensalidade do mês atual.
create or replace function public.tg_alunos_status() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'ativo' and new.status <> 'ativo' then
    delete from mensalidades where aluno_id = new.id and status = 'pendente';
  elsif new.status = 'ativo' and old.status is distinct from 'ativo' then
    insert into mensalidades(aluno_id, modalidade, competencia, valor)
    select new.id, new.modalidade, date_trunc('month', now() at time zone 'America/Belem')::date,
           coalesce((select va.valor from valores_alunos va where va.aluno_id = new.id limit 1),
                    (select c.preco from config c where c.modalidade = new.modalidade), 0)
    on conflict (aluno_id, competencia) do nothing;
  end if;
  return null;
end $$;
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'alunos_status' and tgrelid = 'public.alunos'::regclass) then
    create trigger alunos_status after update of status on public.alunos
      for each row execute function public.tg_alunos_status();
  end if;
end $$;
revoke execute on function public.tg_alunos_status() from anon, authenticated, public;

-- Limpeza: quem já está inativo não fica devendo mensalidade em aberto
delete from public.mensalidades m using public.alunos a
where a.id = m.aluno_id and a.status <> 'ativo' and m.status = 'pendente';
