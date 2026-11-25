-- ---------- Faixas do Judô com ponteira: agora são 13 (0 a 12) ----------
-- Branca, Branca/ponta cinza, Cinza, Cinza/ponta azul, Azul, Azul/ponta amarela, Amarela,
-- Amarela/ponta laranja, Laranja, Verde, Roxa, Marrom, Preta. Roda uma vez só.
do $$
begin
  if not exists (select 1 from public.app_segredos where nome = 'mig_faixas_judo_ponteira') then
    alter table public.alunos drop constraint if exists alunos_faixa_check;
    alter table public.alunos add constraint alunos_faixa_check check (faixa between 0 and 12);
    alter table public.alunos disable trigger alunos_after;   -- não criar histórico falso de graduação
    update public.alunos     set faixa = (array[0,2,4,6,8,9,10,11,12])[faixa + 1] where modalidade = 'judo' and faixa between 0 and 8;
    update public.graduacoes set faixa = (array[0,2,4,6,8,9,10,11,12])[faixa + 1] where modalidade = 'judo' and faixa between 0 and 8;
    alter table public.alunos enable trigger alunos_after;
    insert into public.app_segredos(nome, valor) values ('mig_faixas_judo_ponteira', now()::text);
  end if;
end $$;
