-- =====================================================================
--  APP JIU-JITSU E JUDÔ — BANCO DE DADOS (Supabase)
--  Cole tudo no SQL Editor do Supabase e toque em RUN.
--  Pode rodar mais de uma vez sem problema.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- TABELAS
-- ---------------------------------------------------------------------
create table if not exists public.config (
  modalidade      text primary key check (modalidade in ('judo','jj')),
  preco           numeric(10,2) not null default 0,
  dia_vencimento  int not null default 10 check (dia_vencimento between 1 and 28),
  contrato_texto  text not null default '',
  contrato_versao int not null default 1
);

create table if not exists public.perfis (
  id        uuid primary key references auth.users(id) on delete cascade,
  nome      text not null default '',
  email     text,
  criado_em timestamptz not null default now()
);

create table if not exists public.papeis (
  user_id    uuid not null references auth.users(id) on delete cascade,
  modalidade text not null check (modalidade in ('judo','jj')),
  papel      text not null check (papel in ('resp','aux')),
  nome       text,
  primary key (user_id, modalidade)
);

create table if not exists public.convites_staff (
  email      text not null,
  modalidade text not null check (modalidade in ('judo','jj')),
  papel      text not null check (papel in ('resp','aux')),
  nome       text,
  criado_em  timestamptz not null default now(),
  primary key (email, modalidade)
);

create table if not exists public.alunos (
  id                  uuid primary key default gen_random_uuid(),
  modalidade          text not null check (modalidade in ('judo','jj')),
  user_id             uuid references auth.users(id) on delete set null,
  email_acesso        text,
  nome                text not null,
  nascimento          date,
  telefone            text,
  resp_nome           text,
  resp_parentesco     text,
  resp_telefone       text,
  acesso              text not null default 'aluno' check (acesso in ('aluno','responsavel')),
  faixa               int not null default 0 check (faixa between 0 and 8),
  grau                int not null default 0 check (grau between 0 and 4),
  status              text not null default 'pendente' check (status in ('pendente','ativo','inativo','recusado')),
  contrato_aceito_em  timestamptz,
  contrato_aceito_por text,
  contrato_versao     int,
  aluno_desde         date,
  criado_em           timestamptz not null default now()
);
create index if not exists alunos_mod_status on public.alunos(modalidade, status);
create index if not exists alunos_user on public.alunos(user_id);

create table if not exists public.graduacoes (
  id             bigserial primary key,
  aluno_id       uuid not null references public.alunos(id) on delete cascade,
  modalidade     text not null,
  faixa          int not null,
  grau           int not null default 0,
  data           date not null default current_date,
  registrado_por uuid
);

create table if not exists public.presencas (
  aluno_id       uuid not null references public.alunos(id) on delete cascade,
  data           date not null,
  modalidade     text not null check (modalidade in ('judo','jj')),
  registrado_por uuid default auth.uid(),
  primary key (aluno_id, data)
);
create index if not exists presencas_mod_data on public.presencas(modalidade, data);

create table if not exists public.competicoes (
  id             uuid primary key default gen_random_uuid(),
  aluno_id       uuid not null references public.alunos(id) on delete cascade,
  modalidade     text not null check (modalidade in ('judo','jj')),
  evento         text not null,
  data           date not null,
  categoria      text,
  colocacao      int not null check (colocacao between 0 and 3), -- 1 ouro, 2 prata, 3 bronze, 0 participação
  status         text not null default 'pendente' check (status in ('pendente','confirmado')),
  enviado_por    uuid default auth.uid(),
  confirmado_por uuid,
  criado_em      timestamptz not null default now()
);
create index if not exists comp_mod_data on public.competicoes(modalidade, data);

create table if not exists public.avisos (
  id         bigserial primary key,
  modalidade text not null check (modalidade in ('judo','jj')),
  texto      text not null,
  autor_nome text,
  autor_id   uuid default auth.uid(),
  criado_em  timestamptz not null default now()
);

create table if not exists public.feed (
  id         bigserial primary key,
  modalidade text not null check (modalidade in ('judo','jj')),
  foto_path  text not null,
  legenda    text,
  autor_nome text,
  autor_id   uuid default auth.uid(),
  criado_em  timestamptz not null default now()
);

create table if not exists public.mensalidades (
  id             bigserial primary key,
  aluno_id       uuid not null references public.alunos(id) on delete cascade,
  modalidade     text not null check (modalidade in ('judo','jj')),
  competencia    date not null,          -- sempre o dia 1 do mês
  valor          numeric(10,2) not null,
  status         text not null default 'pendente' check (status in ('pendente','pago')),
  metodo         text check (metodo in ('Cartão','Pix','Espécie')),
  pago_em        timestamptz,
  registrado_por uuid,
  criado_em      timestamptz not null default now(),
  unique (aluno_id, competencia)
);

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
alter table public.config add column if not exists infinitepay_handle text;

-- ---------------------------------------------------------------------
-- FUNÇÕES DE PERMISSÃO
-- ---------------------------------------------------------------------
create or replace function public.is_staff(m text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from papeis where user_id = auth.uid() and modalidade = m) $$;

create or replace function public.is_resp(m text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from papeis where user_id = auth.uid() and modalidade = m and papel = 'resp') $$;

create or replace function public.is_aluno(m text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from alunos where user_id = auth.uid() and modalidade = m and status = 'ativo') $$;

create or replace function public.is_member(m text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff(m) or public.is_aluno(m) $$;

create or replace function public.owns_aluno(a uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from alunos where id = a and user_id = auth.uid()) $$;

-- ---------------------------------------------------------------------
-- GATILHOS (automações)
-- ---------------------------------------------------------------------
-- Novo usuário: cria perfil, aplica convites de professor e liga matrículas pelo e-mail
create or replace function public.tg_novo_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfis(id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome',''), lower(new.email))
  on conflict (id) do nothing;

  insert into papeis(user_id, modalidade, papel, nome)
  select new.id, c.modalidade, c.papel, coalesce(c.nome, new.raw_user_meta_data->>'nome')
  from convites_staff c where lower(c.email) = lower(new.email)
  on conflict (user_id, modalidade) do update set papel = excluded.papel, nome = excluded.nome
    where papeis.papel <> 'resp';
  delete from convites_staff where lower(email) = lower(new.email);  -- convite usado

  perform set_config('app.vinculando', 'sim', true);
  update alunos set user_id = new.id
  where lower(email_acesso) = lower(new.email) and user_id is null;
  perform set_config('app.vinculando', '', true);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.tg_novo_usuario();

-- Convite de professor: se a pessoa já tem conta, recebe o acesso na hora
create or replace function public.tg_convite() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.email := lower(trim(new.email));
  if exists(select 1 from auth.users u where lower(u.email) = new.email) then
    insert into papeis(user_id, modalidade, papel, nome)
    select u.id, new.modalidade, new.papel, new.nome from auth.users u where lower(u.email) = new.email
    on conflict (user_id, modalidade) do update set papel = excluded.papel, nome = excluded.nome
      where papeis.papel <> 'resp';
    return null;  -- a pessoa já tem conta: acesso liberado na hora, convite não precisa ficar guardado
  end if;
  return new;
end $$;
drop trigger if exists convite_ins on public.convites_staff;
create trigger convite_ins before insert on public.convites_staff
  for each row execute function public.tg_convite();

-- Aluno: liga a conta pelo e-mail de acesso e marca data de entrada
create or replace function public.tg_alunos_before() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.email_acesso is not null then new.email_acesso := nullif(lower(trim(new.email_acesso)), ''); end if;
  if coalesce(current_setting('app.vinculando', true), '') = 'sim' then
    null;  -- vínculo automático feito pelo sistema
  elsif tg_op = 'UPDATE' and new.email_acesso is not distinct from old.email_acesso then
    new.user_id := old.user_id;  -- a conta só muda trocando o e-mail de acesso
  elsif new.email_acesso is null then
    if tg_op = 'UPDATE' then new.user_id := null; end if;
  else
    new.user_id := coalesce((select id from auth.users where lower(email) = new.email_acesso limit 1),
                            case when tg_op = 'INSERT' then new.user_id end);
  end if;
  if new.status = 'ativo' and new.aluno_desde is null then new.aluno_desde := current_date; end if;
  return new;
end $$;
drop trigger if exists alunos_before on public.alunos;
create trigger alunos_before before insert or update on public.alunos
  for each row execute function public.tg_alunos_before();

-- Aluno: toda mudança de faixa/grau entra no histórico de graduações
create or replace function public.tg_alunos_after() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.faixa <> old.faixa or new.grau <> old.grau then
    insert into graduacoes(aluno_id, modalidade, faixa, grau, registrado_por)
    values (new.id, new.modalidade, new.faixa, new.grau, auth.uid());
  end if;
  return null;
end $$;
drop trigger if exists alunos_after on public.alunos;
create trigger alunos_after after insert or update on public.alunos
  for each row execute function public.tg_alunos_after();

-- Contrato: se o texto mudar, sobe a versão (alunos precisam aceitar de novo)
create or replace function public.tg_config() returns trigger
language plpgsql as $$
begin
  if new.contrato_texto is distinct from old.contrato_texto then
    new.contrato_versao := old.contrato_versao + 1;
  end if;
  return new;
end $$;
drop trigger if exists config_upd on public.config;
create trigger config_upd before update on public.config
  for each row execute function public.tg_config();

-- ---------------------------------------------------------------------
-- FUNÇÕES CHAMADAS PELO APP
-- ---------------------------------------------------------------------
create or replace function public.solicitar_matricula(
  p_mod text, p_nome text, p_nascimento date, p_telefone text,
  p_resp_nome text default null, p_resp_parentesco text default null, p_resp_telefone text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_email text; v_ver int; v_menor boolean;
begin
  if auth.uid() is null then raise exception 'Faça login primeiro'; end if;
  if p_mod not in ('judo','jj') then raise exception 'Modalidade inválida'; end if;
  if coalesce(trim(p_nome),'') = '' or p_nascimento is null then raise exception 'Preencha nome e nascimento'; end if;
  select email into v_email from auth.users where id = auth.uid();
  select contrato_versao into v_ver from config where modalidade = p_mod;
  v_menor := p_nascimento > (current_date - interval '18 years');
  if v_menor and coalesce(trim(p_resp_nome),'') = '' then raise exception 'Informe o responsável'; end if;
  insert into alunos(modalidade, user_id, email_acesso, nome, nascimento, telefone,
                     resp_nome, resp_parentesco, resp_telefone, acesso, status,
                     contrato_aceito_em, contrato_aceito_por, contrato_versao)
  values (p_mod, auth.uid(), v_email, trim(p_nome), p_nascimento, p_telefone,
          nullif(trim(p_resp_nome),''), p_resp_parentesco, p_resp_telefone,
          case when v_menor then 'responsavel' else 'aluno' end, 'pendente',
          now(), case when v_menor then trim(p_resp_nome) else trim(p_nome) end, v_ver)
  returning id into v_id;
  return v_id;
end $$;

create or replace function public.aceitar_contrato(p_aluno uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update alunos a set contrato_aceito_em = now(),
         contrato_aceito_por = case when a.acesso = 'responsavel' and a.resp_nome is not null then a.resp_nome else a.nome end,
         contrato_versao = (select c.contrato_versao from config c where c.modalidade = a.modalidade)
  where a.id = p_aluno and a.user_id = auth.uid();
  if not found then raise exception 'Não permitido'; end if;
end $$;

create or replace function public.contrato_publico(p_mod text)
returns table(texto text, versao int)
language sql stable security definer set search_path = public as $$
  select contrato_texto, contrato_versao from config where modalidade = p_mod $$;

create or replace function public.ranking_mes(p_mod text, p_mes date)
returns table(aluno_id uuid, nome text, pts int, ouros int, comps int, freq int)
language sql stable security definer set search_path = public as $$
  select a.id, a.nome,
    coalesce((select sum(case c.colocacao when 1 then 3 when 2 then 2 else 1 end) from competicoes c
              where c.aluno_id = a.id and c.status = 'confirmado'
                and date_trunc('month', c.data) = date_trunc('month', p_mes)), 0)::int,
    (select count(*) from competicoes c where c.aluno_id = a.id and c.status = 'confirmado' and c.colocacao = 1
       and date_trunc('month', c.data) = date_trunc('month', p_mes))::int,
    (select count(*) from competicoes c where c.aluno_id = a.id and c.status = 'confirmado'
       and date_trunc('month', c.data) = date_trunc('month', p_mes))::int,
    (select count(*) from presencas p where p.aluno_id = a.id
       and date_trunc('month', p.data) = date_trunc('month', p_mes))::int
  from alunos a
  where a.modalidade = p_mod and a.status = 'ativo' and public.is_member(p_mod) $$;

create or replace function public.gerar_mensalidades(p_mod text, p_comp date) returns int
language plpgsql security definer set search_path = public as $$
declare n int; v numeric;
begin
  if not public.is_resp(p_mod) then raise exception 'Sem permissão'; end if;
  select preco into v from config where modalidade = p_mod;
  insert into mensalidades(aluno_id, modalidade, competencia, valor)
  select a.id, p_mod, date_trunc('month', p_comp)::date, coalesce(v, 0)
  from alunos a where a.modalidade = p_mod and a.status = 'ativo'
  on conflict (aluno_id, competencia) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------------
-- SEGURANÇA (quem pode ver e mexer em quê)
-- ---------------------------------------------------------------------
alter table public.config         enable row level security;
alter table public.perfis         enable row level security;
alter table public.papeis         enable row level security;
alter table public.convites_staff enable row level security;
alter table public.alunos         enable row level security;
alter table public.graduacoes     enable row level security;
alter table public.presencas      enable row level security;
alter table public.competicoes    enable row level security;
alter table public.avisos         enable row level security;
alter table public.feed           enable row level security;
alter table public.mensalidades   enable row level security;
alter table public.pagamentos_online enable row level security;

do $$ declare r record; begin
  for r in select policyname, tablename from pg_policies where schemaname = 'public' loop
    execute format('drop policy %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Configuração (valor da mensalidade e contrato): responsável edita; aluno vê; auxiliar não vê
create policy cfg_sel on public.config for select using (public.is_resp(modalidade) or public.is_aluno(modalidade));
create policy cfg_upd on public.config for update using (public.is_resp(modalidade)) with check (public.is_resp(modalidade));

create policy perf_sel on public.perfis for select using (id = auth.uid());
create policy perf_upd on public.perfis for update using (id = auth.uid()) with check (id = auth.uid());

create policy pap_sel on public.papeis for select using (user_id = auth.uid() or public.is_resp(modalidade));
create policy pap_del on public.papeis for delete using (public.is_resp(modalidade) and papel = 'aux');

create policy conv_sel on public.convites_staff for select using (public.is_resp(modalidade));
create policy conv_ins on public.convites_staff for insert with check (public.is_resp(modalidade) and papel = 'aux');
create policy conv_del on public.convites_staff for delete using (public.is_resp(modalidade) and papel = 'aux');

-- Alunos: o próprio aluno vê o seu cadastro; professores veem os da modalidade; só o responsável altera
create policy al_sel on public.alunos for select using (user_id = auth.uid() or public.is_staff(modalidade));
create policy al_ins on public.alunos for insert with check (public.is_resp(modalidade));
create policy al_upd on public.alunos for update using (public.is_resp(modalidade)) with check (public.is_resp(modalidade));

create policy grad_sel on public.graduacoes for select using (public.owns_aluno(aluno_id) or public.is_resp(modalidade));

create policy pres_sel on public.presencas for select using (public.owns_aluno(aluno_id) or public.is_staff(modalidade));
create policy pres_ins on public.presencas for insert with check (public.is_staff(modalidade)
  and exists(select 1 from public.alunos a where a.id = aluno_id and a.modalidade = presencas.modalidade));
create policy pres_del on public.presencas for delete using (public.is_staff(modalidade));

create policy comp_sel on public.competicoes for select using (public.owns_aluno(aluno_id) or public.is_staff(modalidade));
create policy comp_ins on public.competicoes for insert with check (
  exists(select 1 from public.alunos a where a.id = aluno_id and a.modalidade = competicoes.modalidade)
  and (public.is_staff(modalidade) or (public.owns_aluno(aluno_id) and status = 'pendente')));
create policy comp_upd on public.competicoes for update using (public.is_staff(modalidade)) with check (public.is_staff(modalidade));
create policy comp_del on public.competicoes for delete using (public.is_staff(modalidade));

create policy av_sel on public.avisos for select using (public.is_member(modalidade));
create policy av_ins on public.avisos for insert with check (public.is_staff(modalidade));
create policy av_del on public.avisos for delete using (public.is_staff(modalidade));

create policy feed_sel on public.feed for select using (public.is_member(modalidade));
create policy feed_ins on public.feed for insert with check (public.is_staff(modalidade));
create policy feed_del on public.feed for delete using (public.is_staff(modalidade));

-- Mensalidades: só o responsável e o próprio aluno (auxiliar não vê valores)
create policy men_sel on public.mensalidades for select using (public.is_resp(modalidade) or public.owns_aluno(aluno_id));
create policy men_ins on public.mensalidades for insert with check (public.is_resp(modalidade));
create policy men_upd on public.mensalidades for update using (public.is_resp(modalidade)) with check (public.is_resp(modalidade));
create policy men_del on public.mensalidades for delete using (public.is_resp(modalidade));

-- Pagamentos online: responsável e o próprio aluno veem; só o servidor registra
create policy po_sel on public.pagamentos_online for select using (public.is_resp(modalidade) or public.owns_aluno(aluno_id));

grant execute on function public.contrato_publico(text) to anon, authenticated;
grant execute on function public.solicitar_matricula(text,text,date,text,text,text,text) to authenticated;
grant execute on function public.aceitar_contrato(uuid) to authenticated;
grant execute on function public.ranking_mes(text,date) to authenticated;
grant execute on function public.gerar_mensalidades(text,date) to authenticated;

-- ---------------------------------------------------------------------
-- FOTOS DO FEED (privadas: só membros da modalidade veem)
-- ---------------------------------------------------------------------
insert into storage.buckets(id, name, public) values ('feed', 'feed', false) on conflict (id) do nothing;
drop policy if exists feed_obj_sel on storage.objects;
drop policy if exists feed_obj_ins on storage.objects;
drop policy if exists feed_obj_del on storage.objects;
create policy feed_obj_sel on storage.objects for select
  using (bucket_id = 'feed' and public.is_member((storage.foldername(name))[1]));
create policy feed_obj_ins on storage.objects for insert
  with check (bucket_id = 'feed' and public.is_staff((storage.foldername(name))[1]));
create policy feed_obj_del on storage.objects for delete
  using (bucket_id = 'feed' and public.is_staff((storage.foldername(name))[1]));

-- ---------------------------------------------------------------------
-- DADOS INICIAIS
-- ---------------------------------------------------------------------
-- Contas criadas antes deste código rodar também ganham perfil
insert into public.perfis(id, nome, email)
select id, coalesce(raw_user_meta_data->>'nome',''), lower(email) from auth.users
on conflict (id) do nothing;

insert into public.config(modalidade, preco, dia_vencimento, contrato_texto) values
('judo', 120, 10, $c$MODELO DE CONTRATO — revise o texto antes de usar.

1. OBJETO
Prestação de aulas de Judô sob responsabilidade do Prof. Ruhan Silva.

2. MENSALIDADE
A mensalidade vence todo dia 10 e pode ser paga por cartão, Pix ou em espécie diretamente ao professor responsável.

3. SAÚDE E SEGURANÇA
O aluno declara estar apto à prática esportiva e se compromete a informar qualquer condição de saúde relevante.

4. USO DE IMAGEM
O aluno autoriza o uso de fotos dos treinos no feed interno do aplicativo.

5. CANCELAMENTO
O contrato pode ser cancelado a qualquer momento, mediante aviso com 30 dias de antecedência.

6. MENORES DE IDADE
Para alunos menores de 18 anos, este contrato é aceito pelo responsável legal.$c$),
('jj', 150, 10, $c$MODELO DE CONTRATO — revise o texto antes de usar.

1. OBJETO
Prestação de aulas de Jiu-Jitsu sob responsabilidade do Prof. Renan Pinheiro.

2. MENSALIDADE
A mensalidade vence todo dia 10 e pode ser paga por cartão, Pix ou em espécie diretamente ao professor responsável.

3. SAÚDE E SEGURANÇA
O aluno declara estar apto à prática esportiva e se compromete a informar qualquer condição de saúde relevante.

4. USO DE IMAGEM
O aluno autoriza o uso de fotos dos treinos no feed interno do aplicativo.

5. CANCELAMENTO
O contrato pode ser cancelado a qualquer momento, mediante aviso com 30 dias de antecedência.

6. MENORES DE IDADE
Para alunos menores de 18 anos, este contrato é aceito pelo responsável legal.$c$)
on conflict (modalidade) do nothing;

-- Professores responsáveis (recebem o acesso ao criar a conta com este e-mail)
insert into public.convites_staff(email, modalidade, papel, nome) values
('ruhansilva92@gmail.com', 'judo', 'resp', 'Ruhan Silva'),
('renanjiujitsu@gmail.com', 'jj',   'resp', 'Renan Pinheiro')
on conflict (email, modalidade) do nothing;

-- >>> ATUALIZAÇÃO 3 (incluída) <<<
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

-- >>> REFORÇO DE PERMISSÕES <<<
-- Visitantes sem login não precisam chamar nenhuma função do app
revoke execute on function public.aceitar_contrato(uuid) from anon, public;
revoke execute on function public.config_aluno(text) from anon, public;
revoke execute on function public.contrato_publico(text) from anon, public;
revoke execute on function public.gerar_mensalidades(text,date) from anon, public;
revoke execute on function public.is_aluno(text) from anon, public;
revoke execute on function public.is_member(text) from anon, public;
revoke execute on function public.is_resp(text) from anon, public;
revoke execute on function public.is_staff(text) from anon, public;
revoke execute on function public.owns_aluno(uuid) from anon, public;
revoke execute on function public.ranking_mes(text,date) from anon, public;
revoke execute on function public.remover_inscricao(text) from anon, public;
revoke execute on function public.salvar_inscricao(text,text,text) from anon, public;
revoke execute on function public.solicitar_matricula(text,text,date,text,text,text,text) from anon, public;
grant execute on function public.aceitar_contrato(uuid), public.config_aluno(text), public.contrato_publico(text),
  public.gerar_mensalidades(text,date), public.is_aluno(text), public.is_member(text), public.is_resp(text),
  public.is_staff(text), public.owns_aluno(uuid), public.ranking_mes(text,date), public.remover_inscricao(text),
  public.salvar_inscricao(text,text,text), public.solicitar_matricula(text,text,date,text,text,text,text) to authenticated;
-- Funções de gatilho não são chamadas pelo app
revoke execute on function public.tg_alunos_after() from anon, authenticated, public;
revoke execute on function public.tg_alunos_before() from anon, authenticated, public;
revoke execute on function public.tg_convite() from anon, authenticated, public;
revoke execute on function public.tg_novo_usuario() from anon, authenticated, public;
alter function public.tg_config() set search_path = public;
