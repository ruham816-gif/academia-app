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
