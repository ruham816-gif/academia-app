-- =====================================================================
--  ATUALIZAÇÃO 3 — pagamentos online, valor por aluno e notificações
--  Pode rodar mais de uma vez sem problema.
-- =====================================================================

-- ---------- Pagamento online (InfinitePay) ----------
alter table public.config add column if not exists infinitepay_handle text;

create table if not exists public.pagamentos_online (
  id                  bigserial primary key,
  order_nsu           text unique not null,
  mensalidade_id      bigint references public.mensalidades(id) on delete cascade,
  aluno_id            uuid references public.alunos(id) on delete cascade,
  modalidade          text not null,
  url                 text,
  valor_centavos      int,
  status              text not null default 'aberto',
  capture_method      text,
  valor_pago_centavos int,
  parcelas            int,
  transaction_nsu     text,
  slug                text,
  receipt_url         text,
  criado_por          uuid,
  criado_em           timestamptz not null default now(),
  pago_em             timestamptz
);
alter table public.pagamentos_online enable row level security;
drop policy if exists po_sel on public.pagamentos_online;
create policy po_sel on public.pagamentos_online for select
  using (public.is_resp(modalidade) or public.owns_aluno(aluno_id));

-- ---------- Valor da mensalidade por aluno (só o professor responsável vê e altera) ----------
create table if not exists public.valores_alunos (
  aluno_id      uuid primary key references public.alunos(id) on delete cascade,
  modalidade    text not null check (modalidade in ('judo','jj')),
  valor         numeric(10,2) not null check (valor >= 0),
  obs           text,
  atualizado_em timestamptz not null default now()
);
alter table public.valores_alunos enable row level security;
drop policy if exists va_all on public.valores_alunos;
create policy va_all on public.valores_alunos for all
  using (public.is_resp(modalidade))
  with check (public.is_resp(modalidade)
    and exists(select 1 from public.alunos a where a.id = aluno_id and a.modalidade = valores_alunos.modalidade));

-- O valor padrão da mensalidade fica só com o responsável; o aluno recebe o resto por esta função
drop policy if exists cfg_sel on public.config;
create policy cfg_sel on public.config for select using (public.is_resp(modalidade));

create or replace function public.config_aluno(p_mod text)
returns table(dia_vencimento int, contrato_texto text, contrato_versao int, infinitepay_handle text)
language sql stable security definer set search_path = public as $$
  select c.dia_vencimento, c.contrato_texto, c.contrato_versao, c.infinitepay_handle
  from config c where c.modalidade = p_mod and (public.is_aluno(p_mod) or public.is_staff(p_mod)) $$;
grant execute on function public.config_aluno(text) to authenticated;

-- Mensalidades usam o valor do aluno (se houver) ou o padrão
create or replace function public.gerar_mensalidades(p_mod text, p_comp date) returns int
language plpgsql security definer set search_path = public as $$
declare n int; v numeric;
begin
  if not public.is_resp(p_mod) then raise exception 'Sem permissão'; end if;
  select preco into v from config where modalidade = p_mod;
  insert into mensalidades(aluno_id, modalidade, competencia, valor)
  select a.id, p_mod, date_trunc('month', p_comp)::date, coalesce(va.valor, v, 0)
  from alunos a left join valores_alunos va on va.aluno_id = a.id
  where a.modalidade = p_mod and a.status = 'ativo'
  on conflict (aluno_id, competencia) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------- Notificações no celular ----------
create table if not exists public.push_inscricoes (
  endpoint      text primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  p256dh        text not null,
  auth          text not null,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists push_user on public.push_inscricoes(user_id);
alter table public.push_inscricoes enable row level security;
drop policy if exists push_sel on public.push_inscricoes;
create policy push_sel on public.push_inscricoes for select using (user_id = auth.uid());

create table if not exists public.notificacoes_log (
  chave     text primary key,
  user_id   uuid,
  enviado_em timestamptz not null default now()
);
alter table public.notificacoes_log enable row level security;   -- só o servidor usa

create table if not exists public.app_segredos (
  nome  text primary key,
  valor text not null
);
alter table public.app_segredos enable row level security;       -- só o servidor usa (nenhuma política = ninguém lê pelo app)

create or replace function public.salvar_inscricao(p_endpoint text, p_p256dh text, p_auth text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  insert into push_inscricoes(endpoint, user_id, p256dh, auth) values (p_endpoint, auth.uid(), p_p256dh, p_auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, atualizado_em = now();
end $$;

create or replace function public.remover_inscricao(p_endpoint text) returns void
language sql security definer set search_path = public as $$
  delete from push_inscricoes where endpoint = p_endpoint and user_id = auth.uid() $$;

grant execute on function public.salvar_inscricao(text,text,text) to authenticated;
grant execute on function public.remover_inscricao(text) to authenticated;
