// =====================================================================
//  FUNÇÃO "senha" — professor responsável gera uma senha temporária para o aluno
//  (sem depender de e-mail). No próximo login o app pede para o aluno criar a dele.
// =====================================================================
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPA_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_SECRET_KEY') ?? '';
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...cors, 'Content-Type': 'application/json' } });
const admin = createClient(SUPA_URL, SERVICE, { auth: { persistSession: false, autoRefreshToken: false } });

// 4 letras + 4 números, sem caracteres que confundem (l, o, 0, 1)
function senhaTemporaria() {
  const L = 'abcdefghjkmnpqrstuvwxyz', N = '23456789';
  const r = crypto.getRandomValues(new Uint32Array(8));
  let s = '';
  for (let i = 0; i < 4; i++) s += L[r[i] % L.length];
  for (let i = 4; i < 8; i++) s += N[r[i] % N.length];
  return s;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: true, servico: 'senha' });
  try {
    const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
    const { data: quem } = token ? await admin.auth.getUser(token) : { data: null };
    const prof = quem?.user;
    if (!prof) return json({ erro: 'Sua sessão expirou. Entre de novo no app.' }, 401);

    let body = {}; try { body = await req.json(); } catch { body = {}; }
    const { data: a } = await admin.from('alunos').select('id,modalidade,user_id,nome').eq('id', body.aluno_id || '').maybeSingle();
    if (!a) return json({ erro: 'Aluno não encontrado.' }, 404);

    const { data: papel } = await admin.from('papeis').select('papel').eq('user_id', prof.id).eq('modalidade', a.modalidade).maybeSingle();
    if (papel?.papel !== 'resp') return json({ erro: 'Só o professor responsável pode gerar senha.' }, 403);
    if (!a.user_id) return json({ erro: 'Este aluno ainda não criou conta no app.' }, 400);
    if (a.user_id === prof.id) return json({ erro: 'Para trocar a sua própria senha, use "Esqueci minha senha".' }, 400);

    const { data: staff } = await admin.from('papeis').select('user_id').eq('user_id', a.user_id).limit(1);
    if (staff && staff.length) return json({ erro: 'Esta conta é de um professor. Só o dono pode trocar a senha.' }, 403);

    const { data: alvo } = await admin.auth.admin.getUserById(a.user_id);
    if (!alvo?.user) return json({ erro: 'Conta do aluno não encontrada.' }, 404);
    const senha = senhaTemporaria();
    const { error } = await admin.auth.admin.updateUserById(a.user_id, {
      password: senha,
      user_metadata: { ...(alvo.user.user_metadata || {}), trocar_senha: true }
    });
    if (error) return json({ erro: 'Não foi possível trocar a senha: ' + error.message }, 500);
    console.log('senha temporária gerada', { aluno: a.id, por: prof.id });
    return json({ ok: true, senha, email: alvo.user.email });
  } catch (e) {
    console.error(e);
    return json({ erro: 'Erro interno: ' + (e?.message || e) }, 500);
  }
});
