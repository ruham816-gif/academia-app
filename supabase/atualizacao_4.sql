-- =====================================================================
--  ATUALIZAÇÃO 4 — Pix, pedido de link do cartão, faixas do Judô com ponteira e check-in
-- =====================================================================

-- ---------- Pix (cada professor responsável configura o seu) ----------
alter table public.config add column if not exists pix_chave  text;
alter table public.config add column if not exists pix_nome   text;
alter table public.config add column if not exists pix_cidade text;

create or replace function public.dados_pix(p_mod text)
returns table(pix_chave text, pix_nome text, pix_cidade text)
language sql stable security definer set search_path = public as $$
  select c.pix_chave, c.pix_nome, c.pix_cidade from config c
  where c.modalidade = p_mod and (public.is_aluno(p_mod) or public.is_staff(p_mod)) $$;

-- ---------- Mensalidade: pedido de link do cartão e aviso de pagamento ----------
alter table public.mensalidades add column if not exists link_pagamento     text;
alter table public.mensalidades add column if not exists link_solicitado_em timestamptz;
alter table public.mensalidades add column if not exists informado_em       timestamptz;
alter table public.mensalidades add column if not exists informado_metodo   text;

create or replace function public.solicitar_link_cartao(p_mensalidade bigint) returns void
language plpgsql security definer set search_path = public as $$
begin
  update mensalidades m set link_solicitado_em = now()
  where m.id = p_mensalidade and m.status = 'pendente'
    and exists(select 1 from alunos a where a.id = m.aluno_id and a.user_id = auth.uid());
  if not found then raise exception 'Não permitido'; end if;
end $$;

create or replace function public.informar_pagamento(p_mensalidade bigint, p_metodo text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_metodo not in ('Pix', 'Cartão') then raise exception 'Forma de pagamento inválida'; end if;
  update mensalidades m set informado_em = now(), informado_metodo = p_metodo
  where m.id = p_mensalidade and m.status = 'pendente'
    and exists(select 1 from alunos a where a.id = m.aluno_id and a.user_id = auth.uid());
  if not found then raise exception 'Não permitido'; end if;
end $$;

-- ---------- Check-in do treino ----------
create table if not exists public.checkins (
  aluno_id      uuid not null references public.alunos(id) on delete cascade,
  data          date not null,
  modalidade    text not null check (modalidade in ('judo','jj')),
  vai           boolean not null,
  atualizado_em timestamptz not null default now(),
  primary key (aluno_id, data)
);
create index if not exists checkins_mod_data on public.checkins(modalidade, data);
alter table public.checkins enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'checkins' and policyname = 'ck_sel') then
    create policy ck_sel on public.checkins for select using (public.owns_aluno(aluno_id) or public.is_staff(modalidade));
  end if;
end $$;

create or replace function public.fazer_checkin(p_aluno uuid, p_vai boolean) returns void
language plpgsql security definer set search_path = public as $$
declare v_mod text; v_dia date := (now() at time zone 'America/Belem')::date;
begin
  select modalidade into v_mod from alunos where id = p_aluno and user_id = auth.uid() and status = 'ativo';
  if v_mod is null then raise exception 'Não permitido'; end if;
  insert into checkins(aluno_id, data, modalidade, vai) values (p_aluno, v_dia, v_mod, p_vai)
  on conflict (aluno_id, data) do update set vai = excluded.vai, atualizado_em = now();
end $$;

create or replace function public.checkins_hoje(p_mod text) returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from checkins
  where modalidade = p_mod and vai and data = (now() at time zone 'America/Belem')::date and public.is_member(p_mod) $$;

-- ---------- Permissões das funções novas (só quem está logado) ----------
revoke execute on function public.dados_pix(text) from anon, public;
revoke execute on function public.solicitar_link_cartao(bigint) from anon, public;
revoke execute on function public.informar_pagamento(bigint, text) from anon, public;
revoke execute on function public.fazer_checkin(uuid, boolean) from anon, public;
revoke execute on function public.checkins_hoje(text) from anon, public;
grant execute on function public.dados_pix(text), public.solicitar_link_cartao(bigint), public.informar_pagamento(bigint, text),
  public.fazer_checkin(uuid, boolean), public.checkins_hoje(text) to authenticated;
