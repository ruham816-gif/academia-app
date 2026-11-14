-- =====================================================================
--  ATIVAR NOTIFICAÇÕES — chaves e agendamento diário (9h de Belém)
--  As chaves reais NÃO ficam no GitHub: o Claude manda a versão preenchida no chat.
-- =====================================================================
insert into public.app_segredos(nome, valor) values
  ('vapid_public',  '__VAPID_PUBLIC__'),
  ('vapid_private', '__VAPID_PRIVATE__'),
  ('cron_token',    '__CRON_TOKEN__')
on conflict (nome) do update set valor = excluded.valor;

create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

select cron.unschedule(jobid) from cron.job where jobname = 'lembretes-mensalidade';
select cron.schedule('lembretes-mensalidade', '0 12 * * *', $job$
  select net.http_post(
    url     := 'https://sdtrqktlqaojhohvjbwb.supabase.co/functions/v1/notificar',
    headers := jsonb_build_object('Content-Type', 'application/json',
                                  'x-token', (select valor from public.app_segredos where nome = 'cron_token')),
    body    := '{}'::jsonb,
    timeout_milliseconds := 60000
  );
$job$);
