-- PARTE 2 — PAGAMENTO PELA INFINITEPAY
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
